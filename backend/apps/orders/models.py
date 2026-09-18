from django.db import models
from django.conf import settings
from apps.products.models import Product, ProductVariant

class Address(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='addresses', on_delete=models.CASCADE, null=True, blank=True)
    full_name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    house_no = models.CharField(max_length=100, blank=True, default='')
    village = models.CharField(max_length=100)
    taluk = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100, default='Karnataka')
    pincode = models.CharField(max_length=10)
    latitude = models.FloatField(null=True, blank=True, default=15.3647) # Default North Karnataka / Hubballi lat
    longitude = models.FloatField(null=True, blank=True, default=75.1240) # Default lon
    created_at = models.DateTimeField(auto_now_add=True)

    def formatted_address(self):
        return f"{self.house_no}, {self.village}, Taluk: {self.taluk}, Dist: {self.district}, {self.state} - {self.pincode}"

    def __str__(self):
        return f"{self.full_name} ({self.village}, {self.district})"

class Order(models.Model):
    STATUS_CHOICES = (
        (-1, 'Rejected'),
        (0, 'Pending'),
        (1, 'Confirmed'),
        (2, 'Shipped'),
        (3, 'Out for Delivery'),
        (4, 'Delivered'),
    )
    
    PAYMENT_METHODS = (
        ('COD', 'Cash on Delivery'),
        ('UPI', 'UPI Payment'),
        ('CARD', 'Credit / Debit Card'),
    )
    
    order_id = models.CharField(max_length=20, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='orders', on_delete=models.CASCADE, null=True, blank=True)
    address = models.ForeignKey(Address, related_name='orders', on_delete=models.SET_NULL, null=True)
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS, default='COD')
    payment_status = models.CharField(max_length=20, default='Pending')
    order_status = models.IntegerField(choices=STATUS_CHOICES, default=0)

    # Razorpay payment tracking
    razorpay_order_id = models.CharField(max_length=100, blank=True, default='')
    razorpay_payment_id = models.CharField(max_length=100, blank=True, default='')
    razorpay_signature = models.CharField(max_length=255, blank=True, default='')
    rejection_reason = models.TextField(blank=True, default='')
    
    # Tracking coordinates (simulated live position for Out for Delivery)
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)
    estimated_delivery = models.CharField(max_length=100, default='2-3 Days')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_id:
            import random
            self.order_id = f"AGR{random.randint(10000, 99999)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.order_id} - {self.get_order_status_display()}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} ({self.variant.size}) x {self.quantity}"

class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, related_name='status_history', on_delete=models.CASCADE)
    status = models.IntegerField(choices=Order.STATUS_CHOICES)
    status_display = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    updated_by = models.CharField(max_length=100, default='System')
    notes = models.TextField(blank=True, default='')

    def __str__(self):
        return f"Order #{self.order.order_id} -> {self.status_display}"
