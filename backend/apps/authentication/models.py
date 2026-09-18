from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('FARMER', 'Farmer'),
        ('ADMIN', 'Administrator'),
    )
    
    LANG_CHOICES = (
        ('en', 'English'),
        ('kn', 'Kannada'),
    )
    
    mobile = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='FARMER')
    preferred_language = models.CharField(max_length=5, choices=LANG_CHOICES, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_admin_user(self):
        return self.role == 'ADMIN' or self.is_superuser or self.is_staff

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
