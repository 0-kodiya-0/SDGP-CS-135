from rest_framework import serializers

class TextGenerationRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(required=True)
    max_length = serializers.IntegerField(min_value=1, max_value=1000, default=100)
    temperature = serializers.FloatField(min_value=0.0, max_value=1.0, default=0.7)
    model_id = serializers.CharField(required=False, allow_blank=True)
    
class TextSummarizationRequestSerializer(serializers.Serializer):
    file = serializers.FileField(required=True)  # Ensure the file is uploaded
    max_length = serializers.IntegerField(min_value=1, max_value=1000, default=200)  # Max length of the summary
    min_length = serializers.IntegerField(min_value=1, max_value=1000, default=50)   # Min length of the summary
    model_id = serializers.CharField(required=False, allow_blank=True)  # Optional 
    
    

class TextQuestionGenerationRequestSerializer(serializers.Serializer):
    # Accepts either context or a file
    context = serializers.CharField(required=False, allow_blank=True)
    file = serializers.FileField(required=False)
    num_questions = serializers.IntegerField(min_value=1, max_value=10, default=5)
    model_id = serializers.CharField(required=False, allow_blank=True)
