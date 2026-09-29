import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseResumeBucket = process.env.SUPABASE_RESUME_BUCKET || "resumes";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase configuration missing: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});