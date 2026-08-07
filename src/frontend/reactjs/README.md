# Donezo React frontend

The app runs in demo mode when `VITE_API_BASE_URL` is not set. To connect an API implementation, copy `.env.example` to `.env` and set the backend origin.

```bash
npm install
npm run dev
```

The client expects the REST contract documented in the repository root README and automatically sends a stored bearer token when one exists under `todo_access_token`.
