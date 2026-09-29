# Development

Install dependencies in `server`, `worker`, and `client`. Run the API with `npm run dev`, the worker with `npm run dev`, and the client with `npm run dev`. Build with `npm run build`. Server tests use `npm test` and `npm run test:watch`.

For Docker Compose, copy the root `.env.example` to `D:\TECH\HireLens\.env` and fill it locally. Run `docker compose up --build`; the client is available at `http://localhost:4173` and Nginx proxies API requests to the server. Compose reads this root file automatically for `${...}` substitution. Do not copy secrets into `.env.example` or commit the local `.env`. The existing `server/.env` remains available for direct, non-Docker server development; it is not automatically shared with Compose or the worker.

MongoDB is required for normal API operation. Redis is required for queued resume processing. Supabase Storage and Gemini are required for their respective features. Do not put secrets in frontend environment variables.

## Configuration matrix

| Variable | Component | Required | Purpose |
|---|---|---:|---|
| `PORT` | Server | Yes | HTTP port |
| `MONGODB_URI` | Server/worker | Yes | MongoDB Atlas connection |
| `JWT_SECRET` | Server | Yes | JWT signing and verification |
| `CLIENT_URL` | Server | Optional | Allowed browser origin or comma-separated origin allowlist |
| `REDIS_URL` | Server/worker | Optional | BullMQ queue connection |
| `SUPABASE_URL` | Server/worker | Yes for resumes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server/worker | Yes for resumes | Server-side Storage access; never expose to clients |
| `SUPABASE_RESUME_BUCKET` | Server/worker | Yes for resumes | Private resume bucket, normally `resumes` |
| `GEMINI_API_KEY` | Server/worker | Required for AI features | Resume analysis and resume-job matching assistance |
| `VITE_API_URL` | Client | Optional | Public API base URL |
| `ADMIN_NAME` | Seed script | Optional | Admin seed name |
| `ADMIN_EMAIL` | Seed script | Optional | Admin seed email |
| `ADMIN_PASSWORD` | Seed script | Optional | Admin seed password |
