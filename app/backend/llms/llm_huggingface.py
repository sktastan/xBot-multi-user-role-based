#===========================================================
#  
#  llm_huggingface.py
#  Large Language Model (LLM) wrapper for local execution 
#  using the Transformers library and Hugging Face models.
#  
#============================================================
# ---------------------------------------------------------------------
#   Large Language Model (LLM) wrapper for text generation.
# -------------------------------------------------------------------
from threading import Thread, Event
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer, GenerationConfig, StoppingCriteria, StoppingCriteriaList
from huggingface_hub import try_to_load_from_cache, REPO_TYPE_MODEL
import torch
import os
import gc

# Set environment variables to force offline mode for Hugging Face libraries.
HG_TRANSFORMERS_OFFLINE = "0"
huggingface_hub_local_files_only = False

os.environ["TRANSFORMERS_OFFLINE"] = HG_TRANSFORMERS_OFFLINE
os.environ["HF_HUB_OFFLINE"] = HG_TRANSFORMERS_OFFLINE

# ---------------------------------------------------------------------
#   Custom stopping criteria to handle cancellation events.
# -------------------------------------------------------------------
class CancellationToken(StoppingCriteria):
    # ---------------------------------------------------------------------
    #   Initializes with a thread-safe event for stop signaling.
    # -------------------------------------------------------------------
    def __init__(self, stop_event):
        self.stop_event = stop_event

    # ---------------------------------------------------------------------
    #   Evaluates if the generation should stop based on the event state.
    # -------------------------------------------------------------------
    def __call__(self, input_ids, scores, **kwargs):
        return self.stop_event.is_set() if self.stop_event else False

# ---------------------------------------------------------------------
#   Wrapper for the Large Language Model (Qwen/HuggingFace).
# -------------------------------------------------------------------
class HuggingFace:
    # ---------------------------------------------------------------------
    #   Initializes the model and tokenizer from local cache.
    # -------------------------------------------------------------------
    def __init__(self):
        # self.repo_id = "Qwen/Qwen3.5-4B"
        # self.repo_id = "Qwen/Qwen3-1.7B"
        self.repo_id = "Qwen/Qwen3.5-0.8B"
        # self.repo_id = "Qwen/Qwen2.5-0.5B-Instruct"
        self.tools = None
        self._active_thread = None
        self._active_stop_event = None
        self._init_resources()

    # ---------------------------------------------------------------------
    #   Prints available CUDA device information to the console.
    # -------------------------------------------------------------------
    def cuda_info(self):
        print("\n--- CUDA Information ---")
        if torch.cuda.is_available():
            print(f"CUDA is available. Device count: {torch.cuda.device_count()}")
            for i in range(torch.cuda.device_count()):
                print(f"Device {i}: {torch.cuda.get_device_name(i)}")
        else:
            print("CUDA is not available.")
        print("------------------------")

    # ---------------------------------------------------------------------
    #   Internal method to load tokenizer and model into memory/VRAM.
    # -------------------------------------------------------------------
    def _init_resources(self):
        """Initializes the tokenizer and model using the current repo_id."""
        self.model_path = self.get_local_model_path(self.repo_id)
        
        # Determine if we should force local loading. If model_path is a directory,
        # it was successfully found in the local cache. We force local_files_only
        # in this case to avoid 401 errors from the Hub when checking for updates.
        load_locally = huggingface_hub_local_files_only or os.path.isdir(self.model_path)

        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_path, 
            local_files_only=load_locally
        )
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_path,
            dtype="auto",
            device_map="auto",
            local_files_only=load_locally
        )
        
        # Identify the model's hardware context window limit from its configuration.
        # Most modern models use 'max_position_embeddings'. Fallback to 2048 if undefined.
        self.max_context_length = getattr(self.model.config, 'max_position_embeddings', 2048)
        print(f"[LLM] Model '{self.repo_id}' loaded with {self.max_context_length} token context window.")

    # ---------------------------------------------------------------------
    #   Resolves the absolute local path for a HuggingFace model.
    # -------------------------------------------------------------------
    def get_local_model_path(self, repo_id):
        """
        Attempts to find the local cache directory for a given repository ID.
        Returns the absolute path to the snapshot directory if found, 
        otherwise returns the original repo_id.
        """
        try:
            # try_to_load_from_cache returns the path to a specific file in the snapshot
            file_path = try_to_load_from_cache(repo_id, "config.json", repo_type=REPO_TYPE_MODEL)
            if file_path:
                return os.path.dirname(file_path)
        except Exception:
            pass
        return repo_id

    # ---------------------------------------------------------------------
    #   Switches the active model to the specified model_name.
    # -------------------------------------------------------------------
    def setModel(self, model_name):
        self.repo_id = model_name
        self._init_resources()

    # ---------------------------------------------------------------------
    #   Returns the current model repository ID.
    # -------------------------------------------------------------------
    def get_model_name(self):
        return self.repo_id
    
    # ---------------------------------------------------------------------
    #   Configures tools/functions available for the model to call.
    # -------------------------------------------------------------------
    def set_tools(self, tools):
        """
        Sets the tools for the model. 
        'tools' should be a list of dictionaries following the JSON schema 
        standard for tool calling, or a list of callable functions with 
        type hints and docstrings.
        """
        self.tools = tools

    # ---------------------------------------------------------------------
    #   Aggregates the stream into a single string.
    # -------------------------------------------------------------------
    def generate(self, prompt, stop_event=None, max_new_tokens=2048, temperature=0.1, top_p=0.9, repetition_penalty=1.1):
        return "".join(list(self.stream(prompt, stop_event, max_new_tokens, temperature, top_p, repetition_penalty)))

    # ---------------------------------------------------------------------
    #   Generates a streaming response from the model given a prompt.
    # -------------------------------------------------------------------
    def stream(self, prompt, stop_event=None, max_new_tokens=2048, temperature=0.1, top_p=0.9, repetition_penalty=1.1):
        """
        Generates a stream of text. 'prompt' can be a string or a list of message dicts.
        """
        if isinstance(prompt, str):
            messages = [{"role": "user", "content": prompt}]
        else:
            messages = prompt

        # Track stop event to allow explicit interruption during unload
        if stop_event is None:
            stop_event = Event()
        
        self._active_stop_event = stop_event

        # We do NOT pass tools here because main.py manually manages tool descriptions
        # in the system prompt to enforce a specific <tool_call> tag format.
        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        model_inputs = self.tokenizer([text], return_tensors="pt").to(self.model.device)

        # Initialize the iterator streamer
        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)

        # Define tokens to ban during generation
        # bad_chars = ["#", "*"]
        # bad_words_ids = [self.tokenizer.encode(c, add_special_tokens=False) for c in bad_chars]
    
        stopping_criteria = StoppingCriteriaList()
        if stop_event:
            stopping_criteria.append(CancellationToken(stop_event))

        gen_config = GenerationConfig(
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=temperature,
            top_p=top_p,
            repetition_penalty=repetition_penalty,
            thinking=False
        )

        generation_kwargs = dict(
            **model_inputs,
            streamer=streamer,
            generation_config=gen_config,
            stopping_criteria=stopping_criteria,
        )

        # Start generation in a separate thread so the main thread can yield chunks
        self._active_thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
        self._active_thread.start()

        for new_text in streamer:
            if stop_event and stop_event.is_set():
                break
            yield new_text.replace("*", "").replace("#", "")
            
        # Clean up trackers once done
        if self._active_thread == self._active_thread:
            self._active_thread = None
            self._active_stop_event = None

    # ---------------------------------------------------------------------
    #   Unloads the model and tokenizer to free up system memory and VRAM.
    # -------------------------------------------------------------------
    def unload(self):
        """Releases the model and tokenizer from memory/VRAM."""
        print(f"[LLM] Unloading model '{self.repo_id}' to free resources...")
        
        # 1. Force stop any ongoing generation thread
        if self._active_stop_event:
            self._active_stop_event.set()
        
        if self._active_thread and self._active_thread.is_alive():
            print("[LLM] Waiting for generation thread to terminate...")
            self._active_thread.join(timeout=2)
            self._active_thread = None

        if hasattr(self, 'model') and self.model is not None:
            try:
                # Move model to CPU first to ensure VRAM is cleared immediately
                self.model.to('cpu')
            except:
                pass
            del self.model
            self.model = None
            
        if hasattr(self, 'tokenizer') and self.tokenizer is not None:
            del self.tokenizer
            self.tokenizer = None
            
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
        elif hasattr(torch, 'mps') and torch.mps.is_available():
            torch.mps.empty_cache()
            
        gc.collect()
        print(f"[LLM] Model '{self.repo_id}' successfully removed from memory.")
