from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, Product, ProductVariant, ProductGuideline
from .serializers import CategorySerializer, ProductSerializer, ProductVariantSerializer, ProductGuidelineSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def category_list_view(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response({'success': True, 'data': serializer.data})

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def product_list_create_view(request):
    if request.method == 'GET':
        query = request.GET.get('q', '').strip()
        category_id = request.GET.get('category', '')
        category_name = request.GET.get('category_name', '')
        crop = request.GET.get('crop', '')
        sort_by = request.GET.get('sort', 'popular')
        
        products = Product.objects.filter(active=True)
        
        if query:
            products = products.filter(
                Q(name__icontains=query) | 
                Q(name_kn__icontains=query) | 
                Q(brand__icontains=query) | 
                Q(crop_usage__icontains=query) |
                Q(description__icontains=query)
            )
            
        if category_id:
            products = products.filter(category_id=category_id)
            
        if category_name:
            products = products.filter(category__name__iexact=category_name)
            
        if crop:
            products = products.filter(crop_usage__icontains=crop)
            
        if sort_by == 'rating':
            products = products.order_by('-rating')
        elif sort_by == 'newest':
            products = products.order_by('-created_at')
            
        serializer = ProductSerializer(products, many=True)
        return Response({'success': True, 'count': len(serializer.data), 'data': serializer.data})
        
    elif request.method == 'POST':
        if not request.user.is_authenticated or not request.user.is_admin_user():
            return Response({'success': False, 'message': 'Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            return Response({'success': True, 'data': ProductSerializer(product).data}, status=status.HTTP_201_CREATED)
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def product_detail_view(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'success': False, 'message': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        serializer = ProductSerializer(product)
        return Response({'success': True, 'data': serializer.data})
        
    elif request.method == 'PUT':
        if not request.user.is_authenticated or not request.user.is_admin_user():
            return Response({'success': False, 'message': 'Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'data': serializer.data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
    elif request.method == 'DELETE':
        if not request.user.is_authenticated or not request.user.is_admin_user():
            return Response({'success': False, 'message': 'Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
            
        product.active = False
        product.save()
        return Response({'success': True, 'message': 'Product deactivated (soft-deleted)'})


@api_view(['POST'])
@permission_classes([AllowAny])
def restock_variant_view(request, variant_id):
    """Admin: restock a product variant by adding stock quantity."""
    try:
        variant = ProductVariant.objects.get(pk=variant_id)
    except ProductVariant.DoesNotExist:
        return Response({'success': False, 'message': 'Variant not found'}, status=status.HTTP_404_NOT_FOUND)

    qty = int(request.data.get('qty', 50))
    if qty <= 0:
        return Response({'success': False, 'message': 'Quantity must be positive'}, status=status.HTTP_400_BAD_REQUEST)

    variant.stock = variant.stock + qty
    variant.save(update_fields=['stock'])
    return Response({
        'success': True,
        'message': f'Restocked {qty} units. New stock: {variant.stock}',
        'variant_id': variant.id,
        'product_name': variant.product.name,
        'size': variant.size,
        'new_stock': variant.stock,
    })
