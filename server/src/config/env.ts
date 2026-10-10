const ensureDefined = (name: string): string => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
};

export const validateServerEnvironment = () => {
  const mongoUri = ensureDefined("MONGODB_URI");
  const jwtSecret = ensureDefined("JWT_SECRET");

  if (process.env.NODE_ENV === "production" && jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters in production");
  }

  return {
    mongoUri,
    jwtSecret,
    clientUrl: process.env.CLIENT_URL?.trim() || "http://localhost:5173",
    redisUrl: process.env.REDIS_URL?.trim() || "redis://redis:6379",
    supabaseUrl: process.env.SUPABASE_URL?.trim(),
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    supabaseResumeBucket: process.env.SUPABASE_RESUME_BUCKET?.trim() || "resumes",
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() || "",
  };
};

export const validateSupabaseResumeEnvironment = () => {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Supabase resume configuration is incomplete: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
};
