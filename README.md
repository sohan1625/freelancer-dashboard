# FreelancerOS Dashboard

React and TypeScript frontend for FreelancerOS, built with Vite.

## Requirements

- Node.js 20+
- npm

## Run locally

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` to the backend URL (local default:
`http://localhost:8081`). The development server prints its URL when ready.

## Checks

```powershell
npm run build
npm test
npm run lint
```

Never commit `.env` or production credentials.
