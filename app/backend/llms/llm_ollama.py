#===========================================================
#  
#  llm_ollama.py
#  Interface for local LLM execution via the Ollama library.
#  
#============================================================
from ollama import chat

# ---------------------------------------------------------------------
#   Ollama class for managing local model interactions.
# -------------------------------------------------------------------
class Ollama:
    # ---------------------------------------------------------------------
    #   Sets the default local model identifier.
    # -------------------------------------------------------------------
    def __init__(self):
        self.model = 'qwen3:0.6b'

    # ---------------------------------------------------------------------
    #   Requests a standard blocking generation from the local model.
    # -------------------------------------------------------------------
    def generate(self, prompt):
        response = chat(
            model=self.model,
            messages=[{'role': 'user', 'content': prompt}],
            stream=False,
        )
        # Return the actual text content from the response message
        return response['message']['content']

    # ---------------------------------------------------------------------
    #   Requests a streaming generation from the local model.
    #-------------------------------------------------------------------
    def stream(self, prompt):
        for chunk in chat(
            model=self.model,
            messages=[{'role': 'user', 'content': prompt}],
            stream=True,
        ):
            if 'message' in chunk and 'content' in chunk['message']:
                yield chunk['message']['content']

    # ---------------------------------------------------------------------
    #   Placeholder for setting model system prompts.
    # -------------------------------------------------------------------
    def set_system_prompt(self, prompt):
        pass
