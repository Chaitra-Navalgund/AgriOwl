from rest_framework import serializers
from .models import Category, Product, ProductVariant, ProductGuideline

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'name_kn', 'description', 'icon', 'product_count')

    def get_product_count(self, obj):
        return obj.products.filter(active=True).count()

class ProductVariantSerializer(serializers.ModelSerializer):
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ('id', 'product', 'size', 'price', 'discount', 'discounted_price', 'stock')
        read_only_fields = ('product', 'discounted_price')

    def get_discounted_price(self, obj):
        return round(obj.discounted_price(), 2)

class ProductGuidelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductGuideline
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_name_kn = serializers.CharField(source='category.name_kn', read_only=True)
    variants = ProductVariantSerializer(many=True, required=False)
    guideline = ProductGuidelineSerializer(read_only=True, required=False)

    class Meta:
        model = Product
        fields = (
            'id', 'category', 'category_name', 'category_name_kn', 
            'name', 'name_kn', 'brand', 'description', 'crop_usage', 
            'rating', 'active', 'image', 'created_at', 'variants', 'guideline'
        )

    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        product = Product.objects.create(**validated_data)
        for v in variants_data:
            ProductVariant.objects.create(product=product, **v)
        return product

    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if variants_data is not None:
            instance.variants.all().delete()
            for v in variants_data:
                ProductVariant.objects.create(product=instance, **v)
        return instance
