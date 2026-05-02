#===========================================================
#  
#  llm_claude.py
#  Integration with Anthropic's Claude API, providing 
#  reliable text generation and message streaming.
#  
#============================================================
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------
#   Claude class to interface with Anthropic models.
# -------------------------------------------------------------------
class Claude:
    # ---------------------------------------------------------------------
    #   Sets up the Anthropic client and model selection.
    # -------------------------------------------------------------------
    def __init__(self):
        self.model = 'claude-3-haiku-20240307'
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self.client = None
        if self.api_key and self.api_key != "KEY_NOT_SET":
            self.client = anthropic.Anthropic(api_key=self.api_key)

    # ---------------------------------------------------------------------
    #   Fetches a complete message response for a prompt.
    # -------------------------------------------------------------------
    def generate(self, prompt):
        if not self.client:
            return "Claude Error: ANTHROPIC_API_KEY not set correctly in .env file."
            
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return message.content[0].text
        except Exception as e:
            return f"Claude Error: {str(e)}"

    # ---------------------------------------------------------------------
    #   Initiates a stream for incremental message delivery.
    # -------------------------------------------------------------------
    def stream(self, prompt):
        if not self.client:
            yield "Claude Error: ANTHROPIC_API_KEY not set correctly in .env file."
            return
            
        try:
            with self.client.messages.stream(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            ) as stream:
                for text in stream.text_stream:
                    yield text
        except Exception as e:
            yield f"Claude Error: {str(e)}"

    # ---------------------------------------------------------------------
    #   Sets system instructions for Claude's behavior.
    # -------------------------------------------------------------------
    def set_system_prompt(self, prompt):
        pass