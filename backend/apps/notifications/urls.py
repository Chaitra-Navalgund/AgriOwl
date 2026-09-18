from django.urls import path
from .views import notification_list_view, admin_stats_view, mark_notification_read_view, delete_notification_view

urlpatterns = [
    path('notifications/', notification_list_view, name='notification_list'),
    path('notifications/<int:notif_id>/read/', mark_notification_read_view, name='mark_notification_read'),
    path('notifications/<int:notif_id>/delete/', delete_notification_view, name='delete_notification'),
    path('admin/stats/', admin_stats_view, name='admin_stats'),
]

