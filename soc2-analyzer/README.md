# SOC2 Analyzer

AI-powered SOC 2 compliance analyzer for AWS infrastructure. Upload your AWS config JSON and get instant compliance gap analysis, fix recommendations, and audit-ready policy documents.

## Features

- **Landing Page + Login** — Clean onboarding flow
- **Dark / Light Mode** — Toggle between themes
- **Instant Compliance Scoring** — Checks 8 SOC 2 controls against your AWS config
- **AI-Powered Explanations** — Groq LLM explains risks and provides step-by-step fixes
- **Policy Generation** — Auto-generates Access Control, Encryption, and Incident Response policies
- **PDF Export** — Download a professional compliance report
- **Severity Classification** — Issues categorized as Critical, High, or Medium

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** FastAPI (Python)
- **AI:** Groq API (LLaMA 3.3 70B)
- **PDF:** jsPDF

## Setup

### 1. Clone and install

```bash
cd soc2-analyzer

# Backend
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../frontend && npm install
```

### 2. Configure API key

Create `backend/.env`:

```
GROQ_API_KEY=your_groq_api_key_here
```

Get a free key at [console.groq.com](https://console.groq.com)

### 3. Run

**Terminal 1 — Backend:**
```bash
cd backend && uvicorn main:app --reload --port 3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Test

Upload the sample config file from `sample-data/sample-aws-config.json`.

## SOC 2 Controls Checked

| Control | Description | Severity |
|---------|-------------|----------|
| CC6.1 | Logical Access Controls (MFA, access keys) | Critical |
| CC6.2 | Password Policy | High |
| CC6.6 | Public Access Controls (S3, RDS, Security Groups) | Critical |
| CC7.1 | Threat Detection (GuardDuty, AWS Config) | High |
| CC7.2 | Audit Logging (CloudTrail, VPC Flow Logs) | Critical |
| CC8.1 | S3 Access Logging | Medium |
| CC9.2 | Data Encryption at Rest (S3, RDS) | Critical |
| A1.2 | Backup and Recovery | High |

## Project Structure

```
soc2-analyzer/
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── components/
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── UploadPage.jsx
│       │   ├── Dashboard.jsx
│       │   ├── ControlCard.jsx
│       │   ├── PolicyViewer.jsx
│       │   ├── PDFExport.jsx
│       │   └── ThemeToggle.jsx
│       ├── ThemeContext.jsx
│       ├── App.jsx
│       └── main.jsx
├── backend/           # FastAPI
│   ├── main.py
│   ├── soc2_controls.py
│   ├── groq_service.py
│   └── requirements.txt
└── sample-data/
    └── sample-aws-config.json
```

## Deployment

### Backend — Render

| Setting | Value |
|---|---|
| Service Type | Web Service |
| Root Directory | `soc2-analyzer/backend` |
| Runtime | Python 3.11 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/api/health` |

**Required environment variables on Render:**

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `DEEPSEEK_API_KEY` | NVIDIA NIM API key |
| `DEEPSEEK_BASE_URL` | `https://integrate.api.nvidia.com/v1` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `CORS_ORIGINS` | Your Vercel frontend URL e.g. `https://pramanik.vercel.app` |
| `AI_PROVIDER` | `groq` (default) or `bedrock` |
| `AWS_REGION` | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | AWS key (only if using Bedrock AI) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret (only if using Bedrock AI) |

---

### Frontend — Vercel

| Setting | Value |
|---|---|
| Root Directory | `soc2-analyzer/frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

**Required environment variables on Vercel:**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Your Render backend URL e.g. `https://pramanik-backend.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

---

### Recommended Deployment Order

1. **Deploy backend on Render first** — note the production URL.
2. Set `VITE_API_URL=https://<your-render-service>.onrender.com` on Vercel.
3. **Deploy frontend on Vercel** — note the production URL.
4. Set `CORS_ORIGINS=https://<your-vercel-app>.vercel.app` on Render and redeploy.
5. Add your Vercel domain to **Google Cloud Console** → OAuth → Authorized JavaScript Origins.

### Google OAuth (Production)

Add to Google Cloud Console → APIs & Services → Credentials → your OAuth client:

- **Authorized JavaScript Origins**: `https://<your-vercel-domain>.vercel.app`
- No redirect URI changes needed (app uses popup mode with `redirect_uri: postmessage`).
