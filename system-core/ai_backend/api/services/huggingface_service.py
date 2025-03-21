from huggingface_hub import InferenceClient
from django.conf import settings
import asyncio

class HuggingFaceService:
    def __init__(self, api_key=None, model_id=None):
        self.api_key = api_key or settings.HUGGINGFACE_API_KEY
        self.model_id = model_id or settings.DEFAULT_HUGGINGFACE_MODEL
        # Create the inference client
        self.client = InferenceClient(model=self.model_id, token=self.api_key)
    
    async def generate_text(self, prompt, max_length=100, temperature=0.7):
        """
        Generate text using Hugging Face API (async version)
        
        Args:
            prompt (str): The input prompt to generate from
            max_length (int): Maximum length of generated text
            temperature (float): Sampling temperature (0.0-1.0)
            
        Returns:
            dict: Response from the API or error message
        """
        parameters = {
            "temperature": temperature,
            "return_full_text": False
        }
        
        try:
            # Use asyncio to run the synchronous client in a thread pool
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.client.text_generation(
                    prompt, 
                    **parameters
                )
            )
            
            return {
                "status": "success",
                "model": self.model_id,
                "response": response
            }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error: {str(e)}",
                "model": self.model_id
            }