"""
Simple script to start the ASGI server using Uvicorn
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv("PORT", 8000))
    
    # Start Uvicorn server with hot reload
    uvicorn.run(
        "ai_backend.asgi:application",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )