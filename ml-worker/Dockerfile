FROM nvidia/cuda:12.1.1-cudnn8-devel-ubuntu22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# System dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-dev \
    python3-pip \
    python3.11-venv \
    git \
    git-lfs \
    wget \
    curl \
    build-essential \
    cmake \
    libssl-dev \
    libffi-dev \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set python3.11 as default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 \
    && update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 1

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Clone llama.cpp for GGUF conversion
RUN git clone https://github.com/ggerganov/llama.cpp /app/llama.cpp \
    && cd /app/llama.cpp \
    && pip install -r requirements.txt

# App directories
RUN mkdir -p /app/uploads /app/models /app/hf_cache /app/tmp

# Environment variables
ENV HF_HOME=/app/hf_cache
ENV TRANSFORMERS_CACHE=/app/hf_cache
ENV UPLOAD_DIR=/app/uploads
ENV MODELS_DIR=/app/models
ENV LLAMA_CPP_PATH=/app/llama.cpp

# Set working directory
WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt .

# Install PyTorch with CUDA support
RUN pip install --upgrade pip && \
    pip install torch==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cu121 && \
    pip install -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--timeout-keep-alive", "300"]
