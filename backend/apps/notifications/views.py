from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Sum, Count
from .models import Notification
from .serializers import NotificationSerializer
from apps.orders.models import Order
from apps.products.models import Product, ProductVariant

@api_view(['GET'])
@permission_classes([AllowAny])
def notification_list_view(request):
    notifications = Notification.objects.all().order_by('-created_at')[:50]
    serializer = NotificationSerializer(notifications, many=True)
    return Response({'success': True, 'data': serializer.data})

@api_view(['PATCH'])
@permission_classes([AllowAny])
def mark_notification_read_view(request, notif_id):
    try:
        notif = Notification.objects.get(id=notif_id)
    except Notification.DoesNotExist:
        return Response({'success': False, 'message': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    notif.status = 'READ'
    notif.save()
    return Response({'success': True, 'message': 'Marked as read'})

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_notification_view(request, notif_id):
    try:
        notif = Notification.objects.get(id=notif_id)
    except Notification.DoesNotExist:
        return Response({'success': False, 'message': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    notif.delete()
    return Response({'success': True, 'message': 'Notification deleted'})

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_stats_view(request):
    total_products = Product.objects.filter(active=True).count()
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(order_status=0).count()
    delivered_orders = Order.objects.filter(order_status=4).count()
    
    total_revenue = Order.objects.filter(order_status__gte=1).aggregate(Sum('total_amount'))['total_amount__sum'] or 0.0
    low_stock_count = ProductVariant.objects.filter(stock__lt=15).count()
    
    # Status breakdown
    status_counts = Order.objects.values('order_status').annotate(count=Count('id'))
    status_map = {-1: 'Rejected', 0: 'Pending', 1: 'Confirmed', 2: 'Shipped', 3: 'Out for Delivery', 4: 'Delivered'}
    status_distribution = [{'status': status_map.get(item['order_status'], 'Unknown'), 'count': item['count']} for item in status_counts]
    
    # Payment method breakdown
    payment_counts = Order.objects.values('payment_method').annotate(count=Count('id'))
    payment_distribution = [{'method': r['payment_method'], 'count': r['count']} for r in payment_counts]
    
    # Monthly/Recent sales trend (simulated structure)
    sales_trend = [
        {'day': 'Mon', 'sales': float(total_revenue) * 0.10},
        {'day': 'Tue', 'sales': float(total_revenue) * 0.15},
        {'day': 'Wed', 'sales': float(total_revenue) * 0.20},
        {'day': 'Thu', 'sales': float(total_revenue) * 0.18},
        {'day': 'Fri', 'sales': float(total_revenue) * 0.22},
        {'day': 'Sat', 'sales': float(total_revenue) * 0.15},
    ]
    
    return Response({
        'success': True,
        'kpis': {
            'total_products': total_products,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'delivered_orders': delivered_orders,
            'total_revenue': round(float(total_revenue), 2),
            'low_stock_count': low_stock_count
        },
        'status_distribution': status_distribution,
        'payment_distribution': payment_distribution,
        'sales_trend': sales_trend
    })

