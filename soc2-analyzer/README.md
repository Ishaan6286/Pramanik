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
