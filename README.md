# SLM Forge 🔥

**Fine-tune Small Language Models without writing a single line of code.**

SLM Forge is a full-stack web platform that lets domain experts (doctors, lawyers, engineers) fine-tune state-of-the-art small language models (Phi-3, Gemma 2, Llama 3.2, Mistral, Qwen2.5) on their own data using LoRA/QLoRA — and export the result as a GGUF model runnable in Ollama.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **No-code fine-tuning** | Upload your data, pick a model, click Train |
| **Multi-model support** | Phi-3 Mini, Gemma 2 2B, Llama 3.2 3B, Mistral 7B, Qwen2.5 3B |
| **LoRA / QLoRA** | 4-bit quantized training fits on 6–16GB VRAM |
| **Auto dataset formatting** | Upload TXT/PDF → auto-generates instruction/output pairs |
| **Live training metrics** | Real-time loss chart via WebSocket |
| **GGUF export** | One-click export in q4_k_m quantization for Ollama |
| **A/B Evaluation** | BLEU/ROUGE side-by-side base vs fine-tuned comparison |
| **One-click Ollama deploy** | Register model locally in one click |
| **Hardware-aware** | Warns if model won't fit your available VRAM |

---

## 🏗️ Architecture

```
[Next.js 14 Frontend :3000]
         │ REST + WebSocket (Socket.io)
         ▼
[Express.js API :4000] ←→ [Redis/BullMQ] ←→ [SQLite/Prisma]
         │ internal HTTP
         ▼
[Python FastAPI ML Worker :8000]
    ├── HF transformers + PEFT (LoRA/QLoRA)
    ├── SFTTrainer (trl)
    ├── GGUF export (llama.cpp)
    └── BLEU/ROUGE evaluation
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- NVIDIA GPU with 6GB+ VRAM (recommended) — CPU training also works but is slow
- 20GB+ free disk space (for model weights)

### 1. Clone & Configure

```bash
git clone https://github.com/Saisivatejabobbile/LLM_1.git
cd LLM_1
cp api/.env.example api/.env
```

Edit `api/.env`:
```env
JWT_SECRET=your_super_secret_key_change_this
DATABASE_URL=file:/app/data/slm.db
REDIS_URL=redis://redis:6379
ML_WORKER_URL=http://ml-worker:8000
UPLOAD_DIR=/app/uploads
MODELS_DIR=/app/models
```

### 2. Start with Docker Compose

```bash
docker compose up --build
```

This starts:
- **Frontend** → http://localhost:3000
- **API** → http://localhost:4000
- **ML Worker** → http://localhost:8000
- **Redis** → localhost:6379

### 3. Enable GPU (Optional)

Uncomment the `deploy` section in `docker-compose.yml` for the `ml-worker` service:
```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
```

Also install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html).

---

## 📋 Supported Base Models

| Model | Params | VRAM Required | Provider |
|-------|--------|---------------|----------|
| Phi-3 Mini 4K Instruct | 3.8B | 8GB | Microsoft |
| Gemma 2 2B Instruct | 2B | 6GB | Google |
| Llama 3.2 3B Instruct | 3B | 8GB | Meta |
| Mistral 7B Instruct v0.3 | 7B | 16GB | Mistral AI |
| Qwen2.5 3B Instruct | 3B | 8GB | Alibaba |

---

## 🔧 Development Setup (Without Docker)

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# → http://localhost:3000
```

### API
```bash
cd api
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
# → http://localhost:4000
```

### ML Worker
```bash
cd ml-worker
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# → http://localhost:8000
```

### Redis
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

---

## 📁 Project Structure

```
LLM_1/
├── docker-compose.yml          # Orchestrates all services
├── frontend/                   # Next.js 14 App (TypeScript)
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # API client, utils, types
├── api/                        # Express.js API (TypeScript)
│   ├── src/
│   │   ├── routes/             # REST route handlers
│   │   ├── queue/              # BullMQ job queue + workers
│   │   ├── middleware/         # Auth, validation, errors
│   │   ├── services/           # ML client, storage service
│   │   └── lib/                # Prisma, Redis, Socket.io
│   └── prisma/
│       ├── schema.prisma       # Database schema
│       └── seed.ts             # Base model seeder
└── ml-worker/                  # Python FastAPI ML service
    ├── main.py                 # FastAPI application
    ├── routes/                 # Training, export, eval endpoints
    ├── utils/                  # Hardware detection, dataset utils
    ├── config/                 # Model registry, settings
    └── schemas/                # Pydantic request/response models
```

---

## 🔗 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Get JWT token |
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| POST | /api/projects/:id/dataset/upload | Upload dataset |
| POST | /api/projects/:id/dataset/format | Auto-format dataset |
| POST | /api/projects/:id/train | Start fine-tuning |
| POST | /api/projects/:id/export | Export to GGUF |
| POST | /api/projects/:id/evaluate | Run A/B evaluation |
| POST | /api/projects/:id/deploy | Deploy to Ollama |
| GET | /api/models | List available base models |

---

## 📊 Dataset Format

SLM Forge accepts:
- **JSONL**: `{"instruction": "...", "input": "...", "output": "..."}` per line
- **TXT**: Plain text (auto-formatted into instruction/output pairs)
- **PDF**: Extracted and auto-formatted

Minimum recommended: **50 examples**. Sweet spot: **200–500 examples**.

---

## 🎯 Default Hyperparameters (Small Datasets)

| Parameter | Default | Notes |
|-----------|---------|-------|
| Epochs | 3 | Prevents overfitting on small datasets |
| Learning Rate | 2e-4 | Conservative for stability |
| LoRA Rank | 16 | Good balance capacity/efficiency |
| LoRA Alpha | 32 | 2x rank is standard |
| LoRA Dropout | 0.1 | Light regularization |
| Batch Size | 4 | Works on 8GB VRAM |
| Max Seq Length | 512 | Covers most instruction/output pairs |
| QLoRA (4-bit) | Enabled | Saves ~50% VRAM |

---

## 🛡️ License

MIT License — see [LICENSE](LICENSE) file.

---

## 🤝 Contributing

PRs welcome! Please open an issue first to discuss what you'd like to change.

---

*Built with ❤️ for domain experts who deserve AI tools too.*