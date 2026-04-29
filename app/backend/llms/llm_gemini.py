#===========================================================
#  
#  llm_gemini.py
#  Wrapper class for Google's Gemini API, providing text
#  generation and streaming capabilities.
#  
#============================================================
import os
from google import genai
from google.genai import errors
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------
#   Gemini class to interface with Google's generative models.
# -------------------------------------------------------------------
class Gemini:
    # ---------------------------------------------------------------------
    #   Initializes the Gemini client and model configuration.
# -------------------------------------------------------------------
    def __init__(self, model_override: str = 'gemini-2.5-flash'):
        self.model = model_override
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        if self.api_key:
            # Explicitly using the client; the SDK handles version routing internally
            self.client = genai.Client(api_key=self.api_key)

    # ---------------------------------------------------------------------
    #   Sends a prompt to Gemini for a synchronous response.
# -------------------------------------------------------------------
    def generate(self, prompt):
        if not self.client:
            return "Gemini Error: GEMINI_API_KEY not set in environment."
        try:
            response = self.client.models.generate_content(model=self.model, contents=prompt)
            return response.text
        except errors.APIError as e:
            return f"Gemini API Error ({e.code}): {e.message}"
        except Exception as e:
            return f"Gemini Error: {str(e)}"

    # ---------------------------------------------------------------------
    #   Sends a prompt to Gemini and yields a stream of response chunks.
# -------------------------------------------------------------------
    def stream(self, prompt):
        if not self.client:
            yield "Gemini Error: GEMINI_API_KEY not set in environment."
            return
        try:
            for chunk in self.client.models.generate_content_stream(model=self.model, contents=prompt):
                # Safety: Check if chunk has text parts to avoid AttributeError
                if chunk.text:
                    yield chunk.text
        except errors.APIError as e:
            yield f"Gemini API Error ({e.code}): {e.message}"
        except Exception as e:
            yield f"Gemini Error: {str(e)}"