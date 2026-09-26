from django.urls import path
from .views import (
    create_order_view, order_list_view, order_detail_view,
    update_order_status_view, order_tracking_view, delete_order_view,
    admin_farmers_view, toggle_farmer_active_view, admin_revenue_view, admin_inventory_view,
    create_razorpay_order_view, verify_razorpay_payment_view, validate_coupon_view
)

urlpatterns = [
    path('coupons/validate/', validate_coupon_view, name='validate_coupon'),
    path('orders/', order_list_view, name='order_list'),
    path('orders/create/', create_order_view, name='create_order'),
    path('orders/<str:order_id>/razorpay/create/', create_razorpay_order_view, name='create_razorpay_order'),
    path('orders/<str:order_id>/razorpay/verify/', verify_razorpay_payment_view, name='verify_razorpay_payment'),
    path('orders/<str:order_id>/', order_detail_view, name='order_detail'),
    path('orders/<str:order_id>/status/', update_order_status_view, name='update_order_status'),
    path('orders/<str:order_id>/tracking/', order_tracking_view, name='order_tracking'),
    path('orders/<str:order_id>/delete/', delete_order_view, name='delete_order'),
    path('admin/farmers/', admin_farmers_view, name='admin_farmers'),
    path('admin/farmers/<int:farmer_id>/toggle/', toggle_farmer_active_view, name='toggle_farmer'),
    path('admin/revenue/', admin_revenue_view, name='admin_revenue'),
    path('admin/inventory/', admin_inventory_view, name='admin_inventory'),
]
