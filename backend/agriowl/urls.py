from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from django.http import JsonResponse

def api_root_view(request):
    return JsonResponse({
        'app': 'AgriOwl API Server',
        'status': 'online',
        'frontend_url': 'http://localhost:5173',
        'django_admin': 'http://localhost:8000/admin/'
    })

urlpatterns = [
    path('', api_root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include('apps.authentication.urls')),
    path('api/', include('apps.products.urls')),
    path('api/', include('apps.orders.urls')),
    path('api/', include('apps.ml_recommend.urls')),
    path('api/', include('apps.notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
