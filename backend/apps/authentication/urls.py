from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import register_view, login_view, profile_view

urlpatterns = [
    path('register/', register_view, name='auth_register'),
    path('login/', login_view, name='auth_login'),
    path('profile/', profile_view, name='auth_profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
