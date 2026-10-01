# Deployment

## Compose topology

The base Compose file is suitable for local use. It runs Redis, the API, the resume worker, and an Nginx-served client. The client proxies `/api` requests to the API over the private Compose network. MongoDB and Supabase are external services. Redis uses append-only persistence on the named `redis-data` volume.

When upgrading an existing Compose installation, Docker does not copy data from an old anonymous Redis volume into `redis-data`. Stop queue producers, snapshot and migrate the Redis keyspace, and verify queue counts before removing the old volume.

The API is not published directly to the host. The client is bound to loopback by default at `http://127.0.0.1:4173`; local browser API calls go through the Nginx proxy. For direct API development, run the server with `npm run dev` as described in the README.

## Production Compose

1. Provision MongoDB with network restrictions and automated backups. Provision Supabase and create a private resume bucket.
2. Create a deployment environment file from `.env.example`. Set the production `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_RESUME_BUCKET`, `GEMINI_API_KEY`, `CLIENT_URL` to the exact public frontend origin, `DOMAIN` to its DNS name, and `ACME_EMAIL` for certificate registration. Never use a trailing slash in an origin.
3. Point the domain's DNS records to the Docker host and allow inbound ports 80 and 443. Caddy uses `DOMAIN` and `ACME_EMAIL` from `deploy/Caddyfile` to obtain and renew TLS certificates, then proxies traffic to the loopback-bound client. Do not expose the API or Redis ports publicly.
4. Validate and start the production stack:

	```powershell
	docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
	docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
	```

	The production override requires credentials at Compose interpolation time and sets `NODE_ENV=production`. The frontend must keep `VITE_API_URL=/api`; server credentials must never be passed as client build arguments.
5. Configure centralized logs, alerting for unhealthy/exited containers, Redis volume backups, MongoDB backups, and a tested restore procedure.
6. Smoke-test registration/login, role access, job creation/application, interviews, resume upload/processing/download/removal, and AI matching against the production services.
7. Before public launch, publish organization-reviewed terms and privacy information, including contact details, data-retention periods, and applicable privacy rights.

CI builds the server, worker, and client Docker images to catch image-specific build failures. It does not deploy them or replace the production smoke tests above.
