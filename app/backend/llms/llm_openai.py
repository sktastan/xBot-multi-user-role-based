#===========================================================
#  
#  llm_openai.py
#  Wrapper class for interacting with OpenAI's API, 
#  supporting both synchronous and streaming generation.
#  
#============================================================
import openai
import os
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------
#   OpenAI class to handle communication with GPT models.
# -------------------------------------------------------------------
class OpenAI:
    # ---------------------------------------------------------------------
    #   Initializes the OpenAI client using environment API keys.
    # -------------------------------------------------------------------
    def __init__(self):
        self.model = 'gpt-3.5-turbo'
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        if self.api_key and self.api_key != "KEY_NOT_SET":
            self.client = openai.OpenAI(api_key=self.api_key)

    # ---------------------------------------------------------------------
    #   Generates a full text response for a given prompt.
# -------------------------------------------------------------------
    def generate(self, prompt):
        if not self.client:
            return "OpenAI Error: OPENAI_API_KEY not set correctly in .env file."
            
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"OpenAI Error: {str(e)}"

    # ---------------------------------------------------------------------
    #   Generates a streaming response for real-time output.
# -------------------------------------------------------------------
    def stream(self, prompt):
        if not self.client:
            yield "OpenAI Error: OPENAI_API_KEY not set correctly in .env file."
            return
            
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{'role': 'user', 'content': prompt}],
                stream=True
            )
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"OpenAI Error: {str(e)}"

    # ---------------------------------------------------------------------
    #   Sets the system instructions for the model.
# -------------------------------------------------------------------
    def set_system_prompt(self, prompt):
        pass