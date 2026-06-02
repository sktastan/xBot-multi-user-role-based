# Stage 1: Build the React Frontend
FROM node:18-slim AS frontend-build
WORKDIR /build
COPY app/frontend/package*.json ./
RUN npm install
COPY app/frontend/ ./
RUN npm run build

# Stage 2: Build the Python Backend
FROM python:3.10-slim

# Set up a new user to comply with Hugging Face Spaces security
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/home/user/.cache/huggingface

WORKDIR $HOME/app

# Install system dependencies as root
USER root
RUN apt-get update && apt-get install -y \
    git \
    git-lfs \
    && rm -rf /var/lib/apt/lists/*
USER user

# Install Python dependencies
COPY --chown=user app/backend/requirements.txt ./app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r app/backend/requirements.txt

# Copy the entire project code
COPY --chown=user . .

# Copy the built frontend into the project structure
COPY --from=frontend-build --chown=user /build/dist ./app/frontend/dist

# Create directory for ChromaDB and ensure it's writable
RUN mkdir -p chroma_db && chown user:user chroma_db

# Hugging Face Spaces default port is 7860
EXPOSE 7860

# Start the FastAPI application via uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]