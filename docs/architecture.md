# Architecture

The current system is a modular Express API with Mongoose models and thin controllers. Browser clients use React and Axios. MongoDB Atlas is external. Private resumes are stored in Supabase Storage using generated object keys and signed URLs.

Resume flow:

`Resume upload -> private Supabase Storage -> ResumeAnalysis PENDING -> Redis/BullMQ -> worker -> extraction -> MongoDB`

The worker is separate because parsing and AI calls can be slow and retryable. The planned deployment is `CloudFront -> React -> ALB -> ECS/Fargate -> Express -> MongoDB Atlas`. This architecture is configured in documentation only, not deployed.
