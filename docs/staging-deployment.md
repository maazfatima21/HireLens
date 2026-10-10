# HireLens staging deployment guide

This guide prepares a controlled staging deployment for the repository as it exists today. It does not assume a live production deployment, public DNS, or paid provider access. The repository architecture is intentionally kept as the current Docker Compose + Caddy + Nginx + external MongoDB/Supabase/Gemini model.

## Scope and constraints

- This is a staging deployment guide only.
- Do not deploy publicly without explicit approval.
- Do not paste or store real secrets in chat, documents, or shell history.
- Only a staging host, domain, and external credentials should be used.
- MongoDB, Redis, and Supabase remain external services.
- Redis is internal to Docker Compose; it is not exposed publicly.
- The public HTTPS entry point is Caddy; the API and Redis are not intended to be public.

## Current architecture to use

- Frontend: React/Vite served by Nginx in the client container
- API: Express server inside the Docker Compose `server` service
- Worker: BullMQ resume-processing worker inside the Docker Compose `worker` service
- Data: MongoDB external to the Compose stack
- Resume storage: private Supabase bucket
- AI: Google Gemini
- Public edge: Caddy TLS termination and reverse proxy

## Required prerequisites

### On the staging host

- Linux VM or VPS with Docker and Docker Compose installed
- SSH access to a non-root deployment account
- Open inbound ports: 80 and 443 only
- DNS record already pointing the staging domain to the host
- Docker volumes and directories retained under the host filesystem
- A secure host firewall that allows only needed ports and administrative access

### External services and credentials

- MongoDB connection string
- Supabase project URL and service-role key
- Supabase resume bucket name
- Gemini API key
- Public frontend origin (for example `https://staging.example.com`)
- Staging domain and ACME email

### Repository and GitHub configuration

Set environment values either on the Linux server or in repository/runner secrets, never in the committed source tree.

## Required environment variables

### Required for server and worker

- `MONGODB_URI`
- `JWT_SECRET` (minimum 32 characters in production)
- `REDIS_URL` (default `redis://redis:6379` within Compose)
- `CLIENT_URL` (exact public frontend origin; no trailing slash)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_RESUME_BUCKET`
- `GEMINI_API_KEY`
- `NODE_ENV=production`

### Required for public HTTPS

- `DOMAIN`
- `ACME_EMAIL`

### Required for client build

- `VITE_API_URL=/api` in the staging Compose path
- `CLIENT_PORT` if you change the default port
- `CLIENT_BIND_ADDRESS` if you need to bind the client to a specific interface

### Initial admin and recruiter accounts

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `RECRUITER_NAME`
- `RECRUITER_EMAIL`
- `RECRUITER_PASSWORD`

Never print actual secret values in chat or into files. Use placeholders locally and keep them out of the repo.

## Local pre-deployment checklist (PowerShell)

```powershell
# From the repository root
cd D:\TECH\HireLens

# 1. Confirm repo state
git status --short --branch

# 2. Create a local staging env file from the sample file
Copy-Item .env.example .env

# 3. Fill only placeholders in .env before validation
# Example values only:
# CLIENT_URL=https://staging.example.com
# MONGODB_URI=mongodb+srv://user:pass@cluster.example.mongodb.net/hirelens
# JWT_SECRET=replace-with-random-32-char-secret
# SUPABASE_URL=https://project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key
# SUPABASE_RESUME_BUCKET=resumes
# GEMINI_API_KEY=replace-with-gemini-key
# DOMAIN=staging.example.com
# ACME_EMAIL=ops@example.com

# 4. Validate Compose configuration using placeholders only
$env:CLIENT_URL='https://staging.example.com'
$env:MONGODB_URI='mongodb://example.invalid/hirelens'
$env:JWT_SECRET='01234567890123456789012345678901'
$env:SUPABASE_URL='https://example.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY='staging-placeholder'
$env:SUPABASE_RESUME_BUCKET='resumes'
$env:GEMINI_API_KEY='staging-placeholder'
$env:DOMAIN='staging.example.com'
$env:ACME_EMAIL='ops@example.com'
docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet

# 5. Build the production images
# This is a build validation only; it is not a deployment
# Do not push the images without explicit approval.
docker build -t hirelens-server:staging .\server
docker build -t hirelens-worker:staging .\worker
docker build --build-arg VITE_API_URL=/api -t hirelens-client:staging .\client

# 6. Run project validation commands
cd .\server
npm ci
npm test
npm run build

cd ..\worker
npm ci
npm test
npm run build

cd ..\client
npm ci
npm run build
```

## Linux server setup sequence

```bash
# 1. Install Docker and Docker Compose if not already present
# 2. Create a non-root deployment user
sudo adduser deployer
sudo usermod -aG docker deployer

# 3. Create the app directory
sudo mkdir -p /opt/hirelens
sudo chown deployer:deployer /opt/hirelens

# 4. Clone or sync the repository to /opt/hirelens
cd /opt/hirelens
# git clone ...

# 5. Create the runtime .env file on the server
# Use the actual values only on the host. Do not store them in the repo.
cat > .env <<'EOF'
PORT=5000
NODE_ENV=production
CLIENT_URL=https://staging.example.com
CLIENT_PORT=4173
CLIENT_BIND_ADDRESS=127.0.0.1
VITE_API_URL=/api
DOMAIN=staging.example.com
ACME_EMAIL=ops@example.com
MONGODB_URI=YOUR_MONGODB_URI
JWT_SECRET=YOUR_RANDOM_32_CHAR_SECRET
REDIS_URL=redis://redis:6379
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_RESUME_BUCKET=resumes
GEMINI_API_KEY=YOUR_GEMINI_KEY
ADMIN_NAME=Admin Name
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongPasswordHere
RECRUITER_NAME=Recruiter Name
RECRUITER_EMAIL=recruiter@example.com
RECRUITER_PASSWORD=StrongPasswordHere
EOF

chmod 600 .env

# 6. Validate Compose config on the server
docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet

# 7. Start the stack
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 8. Check status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 9. See logs safely
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f server worker client caddy
```

## Production Compose verification checklist

### Verified from the repository

- [docker-compose.yml](../docker-compose.yml): Redis is local to the stack and no MongoDB or Redis host port is published publicly.
- [docker-compose.prod.yml](../docker-compose.prod.yml): only Caddy exposes `80` and `443` publicly; `client` remains private to loopback; `server` is not published publicly.
- [deploy/Caddyfile](../deploy/Caddyfile): Caddy terminates TLS, uses the configured `DOMAIN`, and proxies to the client container.
- [client/nginx.conf](../client/nginx.conf): the client proxies `/api` requests to `http://server:5000` on the internal private network.
- [server/Dockerfile](../server/Dockerfile): production image builds from Node 22 Alpine, installs dependencies, compiles TypeScript, and runs as a non-root `node` user.
- [worker/Dockerfile](../worker/Dockerfile): same pattern as the server worker image.
- [client/Dockerfile](../client/Dockerfile): production client image is built with Vite then served by nginx-unprivileged.

### Verified runtime constraints

- Redis persistence is enabled via the named volume `redis-data` in [docker-compose.yml](../docker-compose.yml).
- No public MongoDB port is defined in the Compose stack.
- No public Redis port is defined in the Compose stack.
- Only the public HTTPS edge is intentionally published by Caddy.
- `server` and `worker` do not have host-published ports in production Compose.

## Health checks and smoke tests

### Container health checks

- Redis health check: `redis-cli ping`
- Server health check: `GET /api/health`
- Client health check: `GET /`
- Caddy is the public TLS layer and should show the served site on port 443

### Smoke-test commands

```bash
curl -fsS http://127.0.0.1:4173/ >/dev/null
curl -fsS http://127.0.0.1:5000/api/health
curl -fsS -H 'Origin: https://staging.example.com' -I https://staging.example.com/
```

### Manual smoke-test coverage

- Registration and login flow
- Candidate role access
- Recruiter role access
- Admin route access
- Job create/list/apply flow
- Interview scheduling flow
- Resume upload and processing flow
- Resume analysis and matching flow
- Notification reads
- Logout flow and invalid session rejection

## Troubleshooting

### Compose config fails

Check that the required variables are populated in the host `.env` file and that `CLIENT_URL` has no trailing slash.

### API startup fails

Check `MONGODB_URI`, `JWT_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f server
```

### Worker fails or repeatedly restarts

Check `GEMINI_API_KEY`, Redis, MongoDB, and Supabase connectivity.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f worker
```

### TLS does not issue

Check DNS, inbound access to 80/443, valid `DOMAIN`, and correct `ACME_EMAIL`.

### Resume upload fails

Check that the Supabase bucket exists, is private, and the service-role key has permission.

## Rollback and recovery

1. Store the last known-good image tags or build artifacts.
2. Stop the current stack:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml down
   ```
3. Bring the previous known-good stack back using its image or git commit reference.
4. Confirm health endpoints return success.
5. Validate core flows again and inspect logs before re-enabling users.

Rollback is valid only after a healthy smoke test and a documented reason for the rollback.

## Operational notes

- Do not expose MongoDB or Redis to the internet.
- Keep secrets in the host environment or GitHub Actions secrets; do not hardcode them in source.
- Use least-privilege service accounts for external dependencies.
- Keep `.env` files local to the server and out of version control.
- Create backup plans for Redis data and MongoDB; verify restore drills in an isolated environment before production use.
- The browser does not persist JWTs in localStorage or sessionStorage; the API relies on HttpOnly session cookies plus a CSRF header for state-changing requests. Validate this behavior in the deployed staging environment with the real domain and external services.

## Blockers that require approval before public deployment

- Real staging or production domain and DNS setup
- Payment or cloud-provider setup
- Live external credentials from the owner
- Privacy/legal sign-off for candidate data and AI processing
- Final decision to proceed beyond a controlled staging environment

## Checks to run before declaring staging ready

- Compose config validates with real values
- Container health checks are passing
- Redis, API, worker, and client logs are clean
- Registration/login succeeds
- Candidate/recruiter/admin permission checks pass
- Resume upload and AI analysis progress without exposing data
- TLS certificate is issued and the site is reachable over HTTPS
- Rollback path is documented and tested in a non-production environment

The repository is not yet a public production deployment. It is a staging-ready Docker Compose application only after the required environment values are set, health checks pass, and the above smoke tests validate the deployment.

