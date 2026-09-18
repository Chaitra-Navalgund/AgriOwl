from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'mobile', 'role', 'preferred_language', 'is_staff')
        read_only_fields = ('id', 'role', 'is_staff')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'mobile', 'preferred_language')
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            mobile=validated_data.get('mobile', ''),
            preferred_language=validated_data.get('preferred_language', 'en'),
            role='FARMER'
        )
        return user
