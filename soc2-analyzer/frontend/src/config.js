// API base URL — FastAPI serves /api/scan-github, /api/analyze, etc. (uvicorn default :8000).
// Legacy Express on :3001 does not expose all routes; override with VITE_API_URL if needed.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
