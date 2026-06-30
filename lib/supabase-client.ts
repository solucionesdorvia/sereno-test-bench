import { createClient } from "@supabase/supabase-js";

// Credenciales PÚBLICAS de Supabase (van al cliente por diseño).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// ⚠️⚠️⚠️  FUGA DELIBERADA — SOLO PARA EL BANCO DE PRUEBAS  ⚠️⚠️⚠️
// La SERVICE ROLE key NUNCA debería estar en el cliente: bypassea RLS y da
// control total de la base. Acá la metemos a propósito (con prefijo
// NEXT_PUBLIC_ para que Next la inyecte en el bundle del navegador) para que
// el scanner pueda detectar el caso "service key expuesta = crítico máximo".
// En un proyecto real esto es catastrófico. Proyecto descartable, datos falsos.
export const LEAKED_SERVICE_ROLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ?? "";

// Fallback con placeholders válidos para que la app no crashee sin .env.local;
// las queries van a fallar de forma controlada hasta que cargues las keys reales.
export const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-anon-key",
);
