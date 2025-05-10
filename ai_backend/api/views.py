from rest_framework.views import AsyncAPIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from asgiref.sync import sync_to_async, async_to_sync
from .text_extract import TextExtractor

from .serializers import TextGenerationRequestSerializer
from .serializers import TextSummarizationRequestSerializer
from .serializers import TextQuestionGenerationRequestSerializer
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
        




class SummarizationView(AsyncAPIView):
    """
    API view for summarizing text using Hugging Face models.
    Accepts a file, extracts text, and summarizes it.
    """
    def post(self, request):
        """
        Handle POST requests synchronously by delegating to an async method.
        """
        return async_to_sync(self._post_async)(request)
        
    async def _post_async(self, request):
        """
        Actual async implementation of the post method.
        """
        # Validate the request data using serializer
        serializer = TextSummarizationRequestSerializer(data=request.data, files=request.FILES)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Extract the uploaded file
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # Extract text from the file using the TextExtractor class
        try:
            extractor = TextExtractor()
            extracted_text = extractor.extract_text()
        except Exception as e:
            return Response({"error": f"Failed to extract text: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Get parameters from the request
        max_length = serializer.validated_data['max_length']
        min_length = serializer.validated_data['min_length']
        model_id = serializer.validated_data.get('model_id', None)

        # Initialize the service
        service = HuggingFaceService(model_id=model_id)

        # Call the async service method to summarize text
        result = await service.summarize_text(
            text=extracted_text,
            max_length=max_length,
            min_length=min_length
        )

        if result['status'] == 'success':
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class QuestionGenerationView(AsyncAPIView):
    """
    API view for generating questions using Hugging Face models.
    Accepts a file, extracts text, and generates questions.
    """
    def post(self, request):
        """
        Handle POST requests synchronously by delegating to an async method.
        """
        return async_to_sync(self._post_async)(request)
        
    async def _post_async(self, request):
        """
        Actual async implementation of the post method.
        """
        # Validate the request data using serializer
        serializer = TextQuestionGenerationRequestSerializer(data=request.data, files=request.FILES)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Extract the uploaded file
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # Extract text from the file using the TextExtractor class
        try:
            extractor = TextExtractor()
            extracted_text = extractor.extract_text()
        except Exception as e:
            return Response({"error": f"Failed to extract text: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Get parameters from the request
        num_questions = serializer.validated_data['num_questions']
        model_id = serializer.validated_data.get('model_id', None)

        # Initialize the service
        service = HuggingFaceService(model_id=model_id)

        # Call the async service method to generate questions
        result = await service.generate_questions(
            context=extracted_text,
            num_questions=num_questions
        )

        if result['status'] == 'success':
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)