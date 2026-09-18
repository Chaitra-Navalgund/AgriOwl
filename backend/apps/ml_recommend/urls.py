from django.urls import path
from .views import recommend_solution_view

urlpatterns = [
    path('ml/recommend/', recommend_solution_view, name='ml_recommend'),
]
