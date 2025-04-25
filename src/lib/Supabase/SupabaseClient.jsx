import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bjwrijtycnvfodxgveex.supabase.co"; // ✅ Supabase Dashboard se copy kar
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqd3JpanR5Y252Zm9keGd2ZWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5Nzc4MzEsImV4cCI6MjA1NzU1MzgzMX0.4QtZfr3z5yvMYuRtZt0qDcwvz7a_LdwTg7JWjOeMTNc"; // ✅ Supabase Dashboard se copy kar

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
