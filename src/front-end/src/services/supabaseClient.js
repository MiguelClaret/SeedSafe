import { createClient } from "@supabase/supabase-js";

// URL e chave de acesso à sua instância Supabase.
// Em produção, armazene-os em variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://llzdtdnqaovaxspybttr.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsemR0ZG5xYW92YXhzcHlidHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NTY3MjMsImV4cCI6MjA2NTUzMjcyM30.FLoGU8e8FvYHqEmKQLouVu_-sctbiDYBwlmKXo27Hco";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 