# AI Offer Letter Agent • Enterprise People Operations Portal

An automated, enterprise-grade offer letter generation and candidate pipeline management portal powered by FastAPI, React Vite, HuggingFace embeddings, and LangChain vector search.

---

## Architecture Overview

- **Frontend**: Modern enterprise People Operations portal built with React 19, Vite, and Lucide React.
  - Multi-tab portal: Candidate Pipeline (20 records), Offer Studio, Policy Vault, Compensation Bands.
  - Features live letter editing, corporate letterhead, Print/Save PDF styling, copy-to-clipboard, text download, and email dispatch simulation.
- **Backend**: FastAPI web framework with ASGI runtime (Uvicorn).
  - Robust RAG vector store indexing official HR policy documents (`HR Leave Policy.pdf`, `HR Travel Policy.pdf`, `HR Offer Letter.pdf`).
  - Automatic fallback mechanism: local HuggingFace `all-MiniLM-L6-v2` embeddings and in-memory vector storage without remote API dependencies, with seamless integration for Pinecone and OpenRouter LLMs when configured.
  - Dynamic compensation engine supporting custom salaries, bands (L1–L5), departments, locations, and joining dates.

---

## Cloud Deployment

### 1. Deploy on Render (Full-Stack All-In-One Web Service)

Render builds and runs the entire application (frontend + backend) in an isolated container using the included [`Dockerfile`](./Dockerfile) and [`render.yaml`](./render.yaml).

1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** > **Blueprint**.
3. Select your repository. Render automatically reads [`render.yaml`](./render.yaml) and provisions the service.
4. *(Alternative)* Click **New +** > **Web Service**, select your GitHub repository, choose **Runtime: Docker**, and click **Create Web Service**.
5. Once deployed, Render provides an SSL-enabled public URL (e.g. `https://ai-offer-letter-agent.onrender.com`).

---

### 2. Deploy on Vercel (Edge-Optimized Frontend)

You can host the React frontend on Vercel's global CDN and connect it to your Render backend:

1. Push this repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import your repository.
3. Configure the project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or `frontend`)
   - **Build Command**: `cd frontend && npm install && npm run build` (handled automatically by [`vercel.json`](./vercel.json))
   - **Output Directory**: `frontend/build` (or `build` if root is `frontend`)
4. Add the Environment Variable:
   - `VITE_API_URL`: `https://<your-render-app>.onrender.com`
5. Click **Deploy**. Vercel will build and publish your frontend globally.

---

### 3. Deploy on Railway

1. In [Railway](https://railway.com), click **New Project** > **Deploy from GitHub repo**.
2. Railway detects [`railway.toml`](./railway.toml) and [`Dockerfile`](./Dockerfile).
3. Under **Settings > Networking**, click **Generate Domain** to get your public URL.

---

## Local Development Setup

### 1. Windows One-Click Launchers
- Run [`run_project.bat`](./run_project.bat) to launch both backend and frontend servers simultaneously.
- Or run [`run_backend.bat`](./run_backend.bat) (FastAPI at `http://127.0.0.1:8000`) and [`run_frontend.bat`](./run_frontend.bat) (Vite dev at `http://localhost:5173`).

### 2. Manual CLI Run
```bash
# Setup backend virtual environment
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Run backend API
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

# In a separate terminal, run frontend
cd frontend
npm install
npm run dev
```

---

## Environment Variables (.env)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Web server listening port | `8000` |
| `OPENROUTER_API_KEY` | *(Optional)* OpenRouter LLM API key | `None` (uses high-speed fallback agent) |
| `PINECONE_API_KEY` | *(Optional)* Pinecone vector database key | `None` (uses in-memory vector store) |
| `VITE_API_URL` | *(Frontend only)* Base URL for backend API | Relative path `""` |
