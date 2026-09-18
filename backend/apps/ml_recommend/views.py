from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.products.models import Product
from apps.products.serializers import ProductSerializer
from .recommender import CropProtectionRecommender

@api_view(['POST'])
@permission_classes([AllowAny])
def recommend_solution_view(request):
    crop = request.data.get('crop', '').strip()
    problem = request.data.get('problem', '').strip()
    
    if not crop or not problem:
        return Response({
            'success': False, 
            'message': 'Please provide both crop name and problem/symptom description'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    products = Product.objects.filter(active=True)
    product_data = ProductSerializer(products, many=True).data
    
    recommender = CropProtectionRecommender(product_data)
    recommendations = recommender.predict(crop, problem, top_n=3)
    
    return Response({
        'success': True,
        'query': {'crop': crop, 'problem': problem},
        'count': len(recommendations),
        'recommendations': recommendations
    })
