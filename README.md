# HireLens

HireLens is an AI-assisted recruitment and applicant tracking platform. It helps candidates discover and save jobs, manage applications and interviews, and process resumes. Recruiters manage jobs, review applicant-submitted resumes, track status history, and coordinate interviews. Candidates receive in-app application and interview updates. AI output is **Resume–Job Match Assistance**, not a hiring prediction or automated decision.

## Stack

- Express, TypeScript, MongoDB/Mongoose
- React, Vite, React Router, TanStack Query, Axios
- Supabase Storage for private resume objects
- Redis/BullMQ for background resume processing
- Gemini for structured resume-job comparison

## Local setup

Create `server/.env` and `worker/.env` from the example files. Set `MONGODB_URI`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_RESUME_BUCKET` for resume storage. Redis and Gemini require their corresponding variables.

Create a private Supabase Storage bucket named `resumes` (or use another value for `SUPABASE_RESUME_BUCKET`). The service-role key is used only by the server and worker and must never be exposed to the frontend.

For the full Docker stack, copy `.env.example` to `.env`, fill in the MongoDB and Supabase values, then run:

```powershell
docker compose up --build
```

Open the client at `http://localhost:4173`. Nginx serves the production client build and proxies `/api` to the server container. MongoDB remains external; Redis is included. The direct Vite development server remains available with the commands below.

```powershell
cd server; npm install; npm run build; npm run dev
cd worker; npm install; npm run build; npm run dev
cd client; npm install; npm run dev
```

Seed accounts only through scripts:

```powershell
cd server; npm run seed:recruiter; npm run seed:admin
```

## Architecture

Browser -> React/Nginx -> Express API -> Supabase Storage/MongoDB Atlas. Private resumes use a private Supabase Storage bucket. Expensive resume parsing is queued through Redis/BullMQ and processed by the worker so API requests remain responsive. Docker Compose is configured for local full-stack use; production deployment and external service provisioning remain operator tasks.

## API

Major groups are `/api/auth`, `/api/profile`, `/api/company`, `/api/jobs`, `/api/applications`, `/api/interviews`, and `/api/admin`. See `docs/api.md` for the route inventory.

## Testing and security

Run `npm run build` and `npm test` in `server`; run `npm run build` and `npm test` in `worker`; run `npm run build` in `client`. Client journeys should also be smoke-tested against configured MongoDB, Redis, Supabase, and Gemini services before release. The API uses Helmet, configurable CORS, auth rate limiting, JSON limits, Zod validation, JWT claim validation, ownership checks, and safe projections. Never place credentials in source or frontend variables.

## Deployment

Docker Compose builds and runs server, worker, client, and Redis while MongoDB remains external. Supabase Storage requires a project, a private resume bucket, and server-side secrets configured through environment variables. See [deployment.md](docs/deployment.md) for the remaining production setup.

## Interview talking points

- Explicit role and ownership authorization
- Append-only application status history
- Background processing for resume extraction
- Structured, validated AI output
- Private Supabase object storage and signed URLs
- External services optional at API startup
