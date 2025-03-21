from rest_framework import serializers

class TextGenerationRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(required=True)
    max_length = serializers.IntegerField(min_value=1, max_value=1000, default=100)
    temperature = serializers.FloatField(min_value=0.0, max_value=1.0, default=0.7)
    model_id = serializers.CharField(required=False, allow_blank=True)