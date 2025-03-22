from rest_framework.views import AsyncAPIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from asgiref.sync import sync_to_async, async_to_sync

from .serializers import TextGenerationRequestSerializer
from .services import HuggingFaceService

class HuggingFaceView(AsyncAPIView):
    """
    API view for generating text using Hugging Face models
    """
    def post(self, request):
        """
        Handle POST requests synchronously by delegating to an async method
        """
        return async_to_sync(self._post_async)(request)
        
    async def _post_async(self, request):
        """
        Actual async implementation of the post method
        """
        # Validate the request data using serializer
        serializer = TextGenerationRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        prompt = serializer.validated_data['prompt']
        max_length = serializer.validated_data['max_length']
        temperature = serializer.validated_data['temperature']
        model_id = serializer.validated_data.get('model_id', None)
        
        # Initialize the service
        service = HuggingFaceService(model_id=model_id)
        
        # Call the async service method
        result = await service.generate_text(
            prompt=prompt,
            max_length=max_length,
            temperature=temperature
        )
        
        if result['status'] == 'success':
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)