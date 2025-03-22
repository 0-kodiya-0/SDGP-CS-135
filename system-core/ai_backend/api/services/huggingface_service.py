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
    async def summarize_text(self, text, max_length=150, min_length=50):
        """
        Summarize the provided text using Hugging Face's summarization model (async version)

        Args:
            text (str): The input text to summarize
            max_length (int): Maximum length of the summary
            min_length (int): Minimum length of the summary
            
        Returns:
            dict: Response from the API or error message
        """
        parameters = {
            "max_length": max_length,
            "min_length": min_length,
            "do_sample": False  # Deterministic summary
        }

        try:
            # Run text summarization in an async way
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.client.summarization(
                    text, 
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
    
    async def generate_questions(self, context, num_questions=5):
        """
        Generate questions from the provided text/context using Hugging Face's question generation model (async version)

        Args:
            context (str): The input text or context to generate questions from
            num_questions (int): Number of questions to generate
            
        Returns:
            dict: Response from the API or error message
        """
        # Use T5 model for question generation (you can use other models as well, like BART or T5-small)
        parameters = {
            "max_length": 64,   # Adjust length according to your needs
            "num_return_sequences": num_questions,  # Number of questions to generate
            "do_sample": True
        }

        try:
            # Run question generation in an async way
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.client.text2text_generation(
                    f"generate questions: {context}",  # Prompt for question generation
                    **parameters
                )
            )
            
            return {
                "status": "success",
                "model": self.model_id,
                "questions": response
            }

        except Exception as e:
            return {
                "status": "error",
                "message": f"Error: {str(e)}",
                "model": self.model_id
            }