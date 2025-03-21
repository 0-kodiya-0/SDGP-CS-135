from django.urls import path
from .views import HuggingFaceView

urlpatterns = [
    path('huggingface/', HuggingFaceView.as_view(), name='huggingface'),
]