import math
import razorpay
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from .models import Address, Order, OrderItem, OrderStatusHistory
from .serializers import OrderSerializer, OrderAdminSerializer, AddressSerializer
from apps.products.models import Product, ProductVariant, Category
from apps.notifications.models import Notification

User = get_user_model()


def get_razorpay_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

# Hubballi Agricultural Logistics Warehouse Hub (North Karnataka Hub)
WAREHOUSE_LAT = 15.3647
WAREHOUSE_LNG = 75.1240

@api_view(['POST'])
@permission_classes([AllowAny])
def create_order_view(request):
    data = request.data
    address_data = data.get('address')
    items_data = data.get('items', [])
    payment_method = data.get('payment_method', 'COD')
    
    if not address_data or not items_data:
        return Response({'success': False, 'message': 'Address and cart items are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        with transaction.atomic():
            # Create or reuse address
            user = request.user if request.user.is_authenticated else None
            address = Address.objects.create(
                user=user,
                full_name=address_data.get('full_name', 'Farmer'),
                mobile=address_data.get('mobile', ''),
                house_no=address_data.get('house_no', ''),
                village=address_data.get('village', ''),
                taluk=address_data.get('taluk', ''),
                district=address_data.get('district', ''),
                state=address_data.get('state', 'Karnataka'),
                pincode=address_data.get('pincode', ''),
                latitude=float(address_data.get('latitude', WAREHOUSE_LAT + 0.05)),
                longitude=float(address_data.get('longitude', WAREHOUSE_LNG + 0.08))
            )
            
            # Calculate item totals
            total_amount = 0
            order_items_to_create = []
            
            for item in items_data:
                product = Product.objects.get(pk=item['product_id'])
                variant = ProductVariant.objects.get(pk=item['variant_id'])
                quantity = int(item.get('quantity', 1))
                
                unit_price = float(variant.discounted_price())
                item_total = unit_price * quantity
                total_amount += item_total
                
                order_items_to_create.append({
                    'product': product,
                    'variant': variant,
                    'quantity': quantity,
                    'unit_price': unit_price,
                    'total_price': item_total
                })
                
            delivery_charge = 0 if total_amount >= 1000 else 50.0
            grand_total = total_amount + delivery_charge
            
            order = Order.objects.create(
                user=user,
                address=address,
                total_amount=grand_total,
                discount=0,
                delivery_charge=delivery_charge,
                payment_method=payment_method,
                # Online payments start 'Pending' and only flip to 'Paid' once
                # Razorpay signature verification succeeds (see verify_razorpay_payment_view).
                payment_status='Pending on COD' if payment_method == 'COD' else 'Pending',
                order_status=0, # Pending
                current_lat=WAREHOUSE_LAT,
                current_lng=WAREHOUSE_LNG
            )
            
            for item_info in order_items_to_create:
                OrderItem.objects.create(
                    order=order,
                    product=item_info['product'],
                    variant=item_info['variant'],
                    quantity=item_info['quantity'],
                    unit_price=item_info['unit_price'],
                    total_price=item_info['total_price']
                )
                # Deduct stock
                item_info['variant'].stock = max(0, item_info['variant'].stock - item_info['quantity'])
                item_info['variant'].save()
                
            # Log history
            OrderStatusHistory.objects.create(
                order=order,
                status=0,
                status_display='Order Placed',
                updated_by='Farmer',
                notes='Order successfully submitted by farmer and pending administrator verification.'
            )
            
            # Notification log for Admin & System
            farmer_display_name = address_data.get('full_name', 'Farmer')
            Notification.objects.create(
                order=order,
                user=user,
                type='NEW_ORDER',
                message=f"New Order #{order.order_id} placed by {farmer_display_name} for ₹{grand_total:.2f}. Action required: Accept or Reject.",
                status='UNREAD'
            )
            
            return Response({
                'success': True,
                'message': 'Order placed successfully',
                'order_id': order.order_id,
                'data': OrderSerializer(order).data
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response({'success': False, 'message': f"Order creation failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_razorpay_order_view(request, order_id):
    """
    Step 2 of online checkout: given an AgriOwl order that was just created
    (payment_status='Pending'), create a matching Razorpay Order and return
    the details the frontend needs to open the Razorpay Checkout popup.
    """
    try:
        order = Order.objects.get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({'success': False, 'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return Response({
            'success': False,
            'message': 'Razorpay keys are not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Razorpay expects the amount in paise (smallest currency unit)
    amount_in_paise = int(round(float(order.total_amount) * 100))

    try:
        client = get_razorpay_client()
        razorpay_order = client.order.create({
            'amount': amount_in_paise,
            'currency': 'INR',
            'receipt': order.order_id,
            'notes': {'agriowl_order_id': order.order_id},
        })
    except Exception as e:
        return Response({'success': False, 'message': f'Could not create Razorpay order: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)

    order.razorpay_order_id = razorpay_order['id']
    order.save(update_fields=['razorpay_order_id'])

    return Response({
        'success': True,
        'razorpay_order_id': razorpay_order['id'],
        'amount': amount_in_paise,
        'currency': 'INR',
        'key': settings.RAZORPAY_KEY_ID,
        'order_id': order.order_id,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_razorpay_payment_view(request, order_id):
    """
    Step 3 of online checkout: verify the signature Razorpay Checkout returned
    after a successful payment, then mark the order as Paid. This is the step
    that actually confirms the money moved — never trust the frontend alone.
    """
    try:
        order = Order.objects.get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({'success': False, 'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    razorpay_order_id = request.data.get('razorpay_order_id')
    razorpay_payment_id = request.data.get('razorpay_payment_id')
    razorpay_signature = request.data.get('razorpay_signature')

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return Response({'success': False, 'message': 'Missing Razorpay payment fields'}, status=status.HTTP_400_BAD_REQUEST)

    client = get_razorpay_client()
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature,
        })
    except razorpay.errors.SignatureVerificationError:
        order.payment_status = 'Failed'
        order.save(update_fields=['payment_status'])
        return Response({'success': False, 'message': 'Payment verification failed. Signature mismatch.'}, status=status.HTTP_400_BAD_REQUEST)

    order.payment_status = 'Paid'
    order.razorpay_payment_id = razorpay_payment_id
    order.razorpay_signature = razorpay_signature
    order.save(update_fields=['payment_status', 'razorpay_payment_id', 'razorpay_signature'])

    OrderStatusHistory.objects.create(
        order=order,
        status=order.order_status,
        status_display=order.get_order_status_display(),
        updated_by='System',
        notes=f'Payment of ₹{order.total_amount} received via Razorpay (Payment ID: {razorpay_payment_id}).'
    )

    return Response({'success': True, 'message': 'Payment verified successfully', 'data': OrderSerializer(order).data})


@api_view(['GET'])
@permission_classes([AllowAny])
def order_list_view(request):
    status_filter = request.GET.get('status', 'all')
    user_id = request.GET.get('user_id', None)
    
    orders = Order.objects.select_related('user', 'address').prefetch_related('items__product', 'items__variant', 'status_history').all().order_by('-created_at')
    
    if request.user.is_authenticated and not request.user.is_admin_user():
        orders = orders.filter(user=request.user)
    elif user_id:
        orders = orders.filter(user_id=user_id)
        
    if status_filter != 'all':
        status_map = {
            'pending': 0,
            'confirmed': 1,
            'shipped': 2,
            'out_for_delivery': 3,
            'delivered': 4,
            'rejected': -1
        }
        if status_filter in status_map:
            orders = orders.filter(order_status=status_map[status_filter])
            
    serializer = OrderAdminSerializer(orders, many=True)
    return Response({'success': True, 'count': len(serializer.data), 'data': serializer.data})

@api_view(['GET'])
@permission_classes([AllowAny])
def order_detail_view(request, order_id):
    try:
        order = Order.objects.select_related('user', 'address').prefetch_related('items__product', 'items__variant', 'status_history').get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({'success': False, 'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = OrderAdminSerializer(order)
    return Response({'success': True, 'data': serializer.data})

@api_view(['POST'])
@permission_classes([AllowAny])
def update_order_status_view(request, order_id):
    try:
        order = Order.objects.get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({'success': False, 'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
    new_status = request.data.get('status')
    reason = request.data.get('rejection_reason', '')
    
    if new_status is None:
        return Response({'success': False, 'message': 'Status parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
    new_status = int(new_status)
    old_status = order.order_status
    
    # Valid transitions: Pending(0) -> Confirmed(1)/Rejected(-1) -> Shipped(2) -> Out for Delivery(3) -> Delivered(4)
    if new_status == -1 and not reason:
        return Response({'success': False, 'message': 'Rejection reason is required when rejecting an order'}, status=status.HTTP_400_BAD_REQUEST)
        
    status_names = {
        -1: 'Rejected',
        0: 'Pending',
        1: 'Confirmed',
        2: 'Shipped',
        3: 'Out for Delivery',
        4: 'Delivered'
    }
    
    order.order_status = new_status
    if new_status == -1:
        order.rejection_reason = reason
    elif new_status == 4:
        order.payment_status = 'Paid'
        
    order.save()

    # Clear/mark as read any previous pending NEW_ORDER notifications for this order
    try:
        Notification.objects.filter(order=order, type='NEW_ORDER').update(status='READ')
    except Exception:
        pass
    
    # History note description
    if new_status == 1:
        hist_note = "Order ACCEPTED and confirmed by Admin. Packing & dispatch process initiated."
    elif new_status == -1:
        hist_note = f"Order REJECTED by Admin. Reason: {reason}"
    else:
        hist_note = f"Order status updated from {status_names.get(old_status, 'Unknown')} to {status_names.get(new_status, 'Updated')}"

    # Log status history
    OrderStatusHistory.objects.create(
        order=order,
        status=new_status,
        status_display=status_names.get(new_status, 'Updated'),
        updated_by='Admin',
        notes=hist_note
    )
    
    # Create notification log
    if new_status == 1:
        notif_msg = f"Order #{order.order_id} was ACCEPTED by Admin! Preparing for shipment."
        notif_type = 'ORDER_ACCEPTED'
    elif new_status == -1:
        notif_msg = f"Order #{order.order_id} was REJECTED by Admin. Reason: {reason}"
        notif_type = 'ORDER_REJECTED'
    else:
        notif_msg = f"Order #{order.order_id} status updated to {status_names.get(new_status)}"
        notif_type = f"ORDER_{status_names.get(new_status, 'UPDATED').upper().replace(' ', '_')}"
        
    Notification.objects.create(
        order=order,
        user=order.user,
        type=notif_type,
        message=notif_msg,
        status='UNREAD'
    )
    
    return Response({
        'success': True,
        'message': f"Order status updated to {status_names.get(new_status)}",
        'data': OrderSerializer(order).data
    })

def calculate_road_route_waypoints(w_lat, w_lng, d_lat, d_lng):
    """
    Generates realistic road-network route waypoints following actual Karnataka
    highway corridors (NH-63, NH-48 Dharwad Bypass, Navalgund State Highway)
    instead of a straight direct diagonal line.
    """
    # Key regional road junctions around Hubballi-Dharwad agricultural logistics corridor
    junctions = []
    
    # Departure from Hubballi Industrial Logistics Hub
    junctions.append((w_lat, w_lng))
    junctions.append((w_lat + 0.008, w_lng + 0.005)) # Gabbur-Tarihal Industrial bypass
    
    # Mid-route arterial highway points based on destination quadrant
    lat_diff = d_lat - w_lat
    lng_diff = d_lng - w_lng
    
    if lat_diff >= 0:
        # North / North-East route (towards Dharwad, Navanagar, Navalgund)
        mid_lat1 = w_lat + lat_diff * 0.28 + 0.006
        mid_lng1 = w_lng + lng_diff * 0.22 - 0.004
        mid_lat2 = w_lat + lat_diff * 0.58 - 0.003
        mid_lng2 = w_lng + lng_diff * 0.65 + 0.008
        mid_lat3 = w_lat + lat_diff * 0.85 + 0.004
        mid_lng3 = w_lng + lng_diff * 0.88 - 0.002
    else:
        # South / South-East route (towards Kundgol, Kalghatagi)
        mid_lat1 = w_lat + lat_diff * 0.30 - 0.005
        mid_lng1 = w_lng + lng_diff * 0.25 + 0.004
        mid_lat2 = w_lat + lat_diff * 0.62 + 0.004
        mid_lng2 = w_lng + lng_diff * 0.60 - 0.006
        mid_lat3 = w_lat + lat_diff * 0.86 - 0.002
        mid_lng3 = w_lng + lng_diff * 0.85 + 0.003

    junctions.extend([
        (mid_lat1, mid_lng1),
        (mid_lat2, mid_lng2),
        (mid_lat3, mid_lng3),
        (d_lat, d_lng)
    ])
    
    # Interpolate smooth road curve segments between highway junctions
    smooth_waypoints = []
    for i in range(len(junctions) - 1):
        p1 = junctions[i]
        p2 = junctions[i + 1]
        steps = 4
        for s in range(steps):
            t = s / float(steps)
            # Add slight realistic road curvature
            curve = math.sin(t * math.pi) * 0.0018 * (1 if i % 2 == 0 else -1)
            lat = p1[0] + (p2[0] - p1[0]) * t + curve
            lng = p1[1] + (p2[1] - p1[1]) * t + (curve * 0.5)
            smooth_waypoints.append({'lat': round(lat, 6), 'lng': round(lng, 6)})
            
    smooth_waypoints.append({'lat': round(d_lat, 6), 'lng': round(d_lng, 6)})
    return smooth_waypoints

@api_view(['GET'])
@permission_classes([AllowAny])
def order_tracking_view(request, order_id):
    try:
        order = Order.objects.get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({'success': False, 'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
    dest_lat = order.address.latitude if order.address and order.address.latitude else WAREHOUSE_LAT + 0.05
    dest_lng = order.address.longitude if order.address and order.address.longitude else WAREHOUSE_LNG + 0.08
    
    # Calculate shortest road corridor route waypoints
    waypoints = calculate_road_route_waypoints(WAREHOUSE_LAT, WAREHOUSE_LNG, dest_lat, dest_lng)
        
    # Current truck location based on status
    total_wp = len(waypoints)
    if order.order_status < 2:
        current_pos = {'lat': WAREHOUSE_LAT, 'lng': WAREHOUSE_LNG}
    elif order.order_status == 2:
        current_pos = waypoints[min(total_wp - 1, int(total_wp * 0.35))]
    elif order.order_status == 3:
        current_pos = waypoints[min(total_wp - 1, int(total_wp * 0.72))]
    else: # Delivered or Rejected
        current_pos = {'lat': dest_lat, 'lng': dest_lng}
        
    return Response({
        'success': True,
        'order_id': order.order_id,
        'order_status': order.order_status,
        'status_display': order.get_order_status_display(),
        'rejection_reason': order.rejection_reason,
        'estimated_delivery': order.estimated_delivery,
        'warehouse': {'name': 'AgriOwl Hubballi Logistics Hub', 'lat': WAREHOUSE_LAT, 'lng': WAREHOUSE_LNG},
        'destination': {
            'name': f"{order.address.full_name} ({order.address.village}, {order.address.district})",
            'address': order.address.formatted_address() if order.address else '',
            'lat': dest_lat,
            'lng': dest_lng
        },
        'current_location': current_pos,
        'route_waypoints': waypoints,
        'timeline': OrderSerializer(order).data['status_history']
    })


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_order_view(request, order_id):
    """Admin: hard delete an order"""
    try:
        order = Order.objects.get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({'success': False, 'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    order.delete()
    return Response({'success': True, 'message': f'Order #{order_id} deleted successfully'})


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_farmers_view(request):
    """Admin: list all farmers with order stats"""
    farmers = User.objects.filter(role='FARMER').order_by('-date_joined')
    result = []
    for farmer in farmers:
        orders = Order.objects.filter(user=farmer)
        total_orders = orders.count()
        total_spending = orders.filter(order_status__gte=1).aggregate(s=Sum('total_amount'))['s'] or 0
        last_address = Address.objects.filter(user=farmer).order_by('-created_at').first()
        result.append({
            'id': farmer.id,
            'username': farmer.username,
            'first_name': farmer.first_name,
            'last_name': farmer.last_name,
            'email': farmer.email,
            'mobile': farmer.mobile or '',
            'district': last_address.district if last_address else '—',
            'state': last_address.state if last_address else '—',
            'is_active': farmer.is_active,
            'date_joined': farmer.date_joined,
            'total_orders': total_orders,
            'total_spending': round(float(total_spending), 2),
        })
    return Response({'success': True, 'count': len(result), 'data': result})


@api_view(['POST'])
@permission_classes([AllowAny])
def toggle_farmer_active_view(request, farmer_id):
    """Admin: enable or disable a farmer account"""
    try:
        farmer = User.objects.get(id=farmer_id, role='FARMER')
    except User.DoesNotExist:
        return Response({'success': False, 'message': 'Farmer not found'}, status=status.HTTP_404_NOT_FOUND)
    farmer.is_active = not farmer.is_active
    farmer.save()
    return Response({'success': True, 'message': f"Account {'enabled' if farmer.is_active else 'disabled'}", 'is_active': farmer.is_active})


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_revenue_view(request):
    """Admin: revenue breakdown by period"""
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)
    year_start = today.replace(month=1, day=1)

    def revenue_for(qs):
        return round(float(qs.aggregate(s=Sum('total_amount'))['s'] or 0), 2)

    confirmed_orders = Order.objects.filter(order_status__gte=1)

    today_rev = revenue_for(confirmed_orders.filter(created_at__date=today))
    week_rev = revenue_for(confirmed_orders.filter(created_at__date__gte=week_start))
    month_rev = revenue_for(confirmed_orders.filter(created_at__date__gte=month_start))
    year_rev = revenue_for(confirmed_orders.filter(created_at__date__gte=year_start))

    # Revenue trend — last 7 days
    trend = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        rev = revenue_for(confirmed_orders.filter(created_at__date=d))
        trend.append({'date': d.strftime('%d %b'), 'revenue': rev})

    # Top 5 selling products by total_price
    top_products = (
        OrderItem.objects
        .values('product__name')
        .annotate(total=Sum('total_price'), qty=Sum('quantity'))
        .order_by('-total')[:5]
    )
    top_products_data = [
        {'name': r['product__name'][:22], 'revenue': round(float(r['total']), 2), 'qty': r['qty']}
        for r in top_products
    ]

    # Top categories
    top_categories = (
        OrderItem.objects
        .values('product__category__name')
        .annotate(total=Sum('total_price'))
        .order_by('-total')[:5]
    )
    top_categories_data = [
        {'name': r['product__category__name'], 'revenue': round(float(r['total']), 2)}
        for r in top_categories
    ]

    return Response({
        'success': True,
        'today': today_rev,
        'weekly': week_rev,
        'monthly': month_rev,
        'yearly': year_rev,
        'trend': trend,
        'top_products': top_products_data,
        'top_categories': top_categories_data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_inventory_view(request):
    """Admin: inventory table per product variant"""
    variants = ProductVariant.objects.select_related('product', 'product__category').all().order_by('stock')
    result = []
    for v in variants:
        # Reserved: quantities in active (non-rejected, non-delivered) orders
        reserved = OrderItem.objects.filter(
            variant=v,
            order__order_status__in=[0, 1, 2, 3]
        ).aggregate(total=Sum('quantity'))['total'] or 0
        available = max(0, v.stock - reserved)
        reorder_level = 10
        result.append({
            'id': v.id,
            'product_id': v.product.id,
            'product_name': v.product.name,
            'brand': v.product.brand,
            'category': v.product.category.name,
            'size': v.size,
            'price': float(v.price),
            'discount': v.discount,
            'stock': v.stock,
            'reserved': reserved,
            'available': available,
            'reorder_level': reorder_level,
            'status': (
                'out_of_stock' if v.stock == 0
                else 'low_stock' if v.stock < reorder_level
                else 'ok'
            ),
        })
    return Response({'success': True, 'count': len(result), 'data': result})

