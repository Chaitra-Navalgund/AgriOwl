from rest_framework import serializers
from .models import Address, Order, OrderItem, OrderStatusHistory
from apps.products.serializers import ProductSerializer, ProductVariantSerializer

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_name_kn = serializers.CharField(source='product.name_kn', read_only=True)
    product_image = serializers.CharField(source='product.image', read_only=True)
    variant_size = serializers.CharField(source='variant.size', read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'product_name_kn', 'product_image', 'variant', 'variant_size', 'quantity', 'unit_price', 'total_price')

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    address = AddressSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_order_status_display', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'order_id', 'user', 'address', 'total_amount', 'discount', 
            'delivery_charge', 'payment_method', 'payment_status', 'order_status', 
            'status_display', 'rejection_reason', 'current_lat', 'current_lng', 
            'estimated_delivery', 'created_at', 'updated_at', 'items', 'status_history'
        )

class OrderAdminSerializer(serializers.ModelSerializer):
    """Extended serializer for admin views — includes nested user details"""
    address = AddressSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_order_status_display', read_only=True)
    farmer_name = serializers.SerializerMethodField()
    farmer_mobile = serializers.SerializerMethodField()
    farmer_username = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id', 'order_id', 'user', 'farmer_name', 'farmer_mobile', 'farmer_username',
            'address', 'total_amount', 'discount',
            'delivery_charge', 'payment_method', 'payment_status', 'order_status',
            'status_display', 'rejection_reason', 'current_lat', 'current_lng',
            'estimated_delivery', 'created_at', 'updated_at', 'items', 'status_history'
        )

    def get_farmer_name(self, obj):
        if obj.user:
            return (obj.user.first_name or obj.user.username).strip() or obj.user.username
        return obj.address.full_name if obj.address else 'Guest'

    def get_farmer_mobile(self, obj):
        if obj.user and obj.user.mobile:
            return obj.user.mobile
        return obj.address.mobile if obj.address else ''

    def get_farmer_username(self, obj):
        return obj.user.username if obj.user else ''

