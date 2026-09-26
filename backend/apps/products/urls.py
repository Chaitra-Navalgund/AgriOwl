from django.urls import path
from .views import category_list_view, product_list_create_view, product_detail_view, restock_variant_view

urlpatterns = [
    path('categories/', category_list_view, name='category_list'),
    path('products/', product_list_create_view, name='product_list_create'),
    path('products/<int:pk>/', product_detail_view, name='product_detail'),
    path('products/variants/<int:variant_id>/restock/', restock_variant_view, name='restock_variant'),
]
