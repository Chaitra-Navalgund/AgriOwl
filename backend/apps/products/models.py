from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    name_kn = models.CharField(max_length=100, help_text="Kannada category name")
    description = models.TextField(blank=True, default='')
    icon = models.CharField(max_length=50, default='Package')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return f"{self.name} ({self.name_kn})"

class Product(models.Model):
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    name_kn = models.CharField(max_length=200, help_text="Kannada product name")
    brand = models.CharField(max_length=100)
    description = models.TextField()
    crop_usage = models.CharField(max_length=255, help_text="e.g. Cotton, Jowar, Soybean, Chilli")
    rating = models.FloatField(default=4.5)
    active = models.BooleanField(default=True)
    image = models.URLField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.brand}"

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE)
    size = models.CharField(max_length=50, help_text="e.g. 1 KG, 5 KG, 25 KG, 500 ML, 1 L")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.IntegerField(default=0, help_text="Discount percentage")
    stock = models.IntegerField(default=50)

    def discounted_price(self):
        return float(self.price) * (1 - self.discount / 100.0)

    def __str__(self):
        return f"{self.product.name} - {self.size} (₹{self.price})"

class ProductGuideline(models.Model):
    product = models.OneToOneField(Product, related_name='guideline', on_delete=models.CASCADE)
    usage_instructions = models.TextField(help_text="Step by step application instructions")
    dosage = models.CharField(max_length=255, help_text="e.g. 2-3 g per liter of water")
    timing = models.CharField(max_length=255, help_text="e.g. Early morning or late evening")
    
    # Weather guidance
    sunny_guidance = models.CharField(max_length=255, default="Ideal for spraying. Apply in early morning before high temperatures.")
    rainy_guidance = models.CharField(max_length=255, default="Do not apply if heavy rain is expected within 4 hours.")
    windy_guidance = models.CharField(max_length=255, default="Avoid spraying in high wind to prevent drift to neighboring crops.")
    cold_guidance = models.CharField(max_length=255, default="Store in warm dry place. Ensure thorough mixing before application.")
    
    precautions = models.TextField(help_text="Safety equipment and precautions")
    storage = models.TextField(help_text="Storage requirements")
    safety_warning = models.TextField(default="Use only according to the product label and applicable agricultural guidance. Do not exceed the recommended dosage.")

    def __str__(self):
        return f"Guidelines for {self.product.name}"
