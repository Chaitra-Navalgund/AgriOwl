from django.db import models
from django.conf import settings
from apps.orders.models import Order

class Notification(models.Model):
    order = models.ForeignKey(Order, related_name='notifications', on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='notifications', on_delete=models.CASCADE, null=True, blank=True)
    type = models.CharField(max_length=50)
    message = models.TextField()
    status = models.CharField(max_length=20, default='SENT')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.type}] {self.message[:40]}..."
