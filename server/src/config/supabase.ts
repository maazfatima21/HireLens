import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
export const supabaseResumeBucket = process.env.SUPABASE_RESUME_BUCKET?.trim() || "resumes";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase configuration missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});