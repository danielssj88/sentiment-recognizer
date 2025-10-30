# Emotion → Poem (React + Python + OpenAI)

A minimal full‑stack app that captures a webcam frame in React, sends it to a Python (FastAPI) backend, infers the visible **emotion** with OpenAI’s **multimodal** model, and returns a short **poem** inspired by that emotion.

## Structure
```
emotion-poem/
├─ backend/
│  ├─ main.py
│  ├─ requirements.txt
│  └─ .env.example
└─ frontend/
   ├─ package.json
   ├─ vite.config.js
   └─ src/
      ├─ App.jsx
      └─ api.js
```

## Setup

### 1) Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # put your OpenAI key in .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Open http://localhost:5173 and click **Capture & Generate Poem**.

## Notes
- **Model**: uses `gpt-4o-mini` (vision). You can change the model name in `backend/main.py`.
- **Privacy**: No images are stored; they are sent to the API for immediate processing.
- **CORS**: Currently permissive (`*`). Restrict in production.
- **Uploads**: You can add a file upload fallback if a webcam isn’t available.
- **Internationalization**: Extend the prompt to produce poems in different languages.
