import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("SUPABASE_URL loaded?", !!supabaseUrl);
console.log("SUPABASE_ANON_KEY loaded?", !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
