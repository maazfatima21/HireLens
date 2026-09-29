# Deployment

The repository contains a local Docker Compose stack for Redis, the API, worker, and Nginx-served client. The client proxies `/api` requests to the API container. MongoDB remains external and is configured through `MONGODB_URI`.

For the Compose client, keep `VITE_API_URL=/api` so requests use the Nginx proxy. For a separately hosted static client, set `VITE_API_URL` to the public API base URL at client build time; it is embedded in the generated bundle.

Production deployment is not completed. Before release:

- Provision MongoDB and configure production network access and backups.
- Provision Supabase and create a private resume bucket; set service-role credentials only on server and worker.
- Configure a strong `JWT_SECRET`, production `CLIENT_URL`, and `GEMINI_API_KEY` when resume analysis or AI matching is enabled. Configure every required server and worker environment variable in the hosting platform.
- Choose and configure the hosting target, TLS, domain, health checks, logs, and alerting.
- Build and deploy the images, then smoke-test registration/login, role access, job creation/application, interviews, resume upload/processing/download/removal, and AI matching.

Do not commit deployment secrets or put server credentials in client build variables.
