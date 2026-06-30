"use client";

import { useEffect, useState } from "react";
import {
  supabase,
  SUPABASE_URL,
  LEAKED_SERVICE_ROLE_KEY,
} from "@/lib/supabase-client";

// Banco de pruebas vulnerable A PROPÓSITO. Datos 100% falsos. No es producción.
// La página lee de las tablas con el anon key para forzar que las credenciales
// (y la service key fugada) queden en el bundle del cliente.

type Row = Record<string, unknown>;

interface TableState {
  label: string;
  rows: Row[];
  error: string | null;
}

export default function Home() {
  const [tables, setTables] = useState<TableState[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const TABLAS = [
      { name: "clientes_abierta", label: "clientes_abierta (RLS off)" },
      {
        name: "pedidos_policy_abierta",
        label: "pedidos_policy_abierta (policy USING true)",
      },
      {
        name: "usuarios_protegida",
        label: "usuarios_protegida (RLS + policy correcta)",
      },
    ];

    (async () => {
      const results: TableState[] = [];
      for (const t of TABLAS) {
        const { data, error } = await supabase
          .from(t.name)
          .select("*")
          .limit(5);
        results.push({
          label: t.label,
          rows: data ?? [],
          error: error?.message ?? null,
        });
      }
      setTables(results);

      // Storage: listamos el bucket público.
      const { data: filesData, error: filesError } = await supabase.storage
        .from("documentos")
        .list();
      if (filesError) setStorageError(filesError.message);
      else setFiles((filesData ?? []).map((f) => f.name));
    })();
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 font-sans">
      <h1 className="text-2xl font-bold">Banco de pruebas — Supabase</h1>
      <p className="mt-2 text-sm text-zinc-500">
        App vulnerable a propósito para testear un scanner de seguridad. Datos
        falsos. No usar en producción.
      </p>
      <p className="mt-1 break-all text-xs text-zinc-400">
        Proyecto: {SUPABASE_URL || "(configurar NEXT_PUBLIC_SUPABASE_URL)"}
      </p>

      {tables.map((t) => (
        <section key={t.label} className="mt-8">
          <h2 className="font-mono text-sm font-semibold">{t.label}</h2>
          {t.error ? (
            <p className="mt-1 text-sm text-amber-600">
              Sin acceso anónimo: {t.error}
            </p>
          ) : t.rows.length === 0 ? (
            <p className="mt-1 text-sm text-emerald-600">
              0 filas leídas con el anon key (protegida).
            </p>
          ) : (
            <pre className="mt-1 overflow-x-auto rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              {JSON.stringify(t.rows, null, 2)}
            </pre>
          )}
        </section>
      ))}

      <section className="mt-8">
        <h2 className="font-mono text-sm font-semibold">
          Storage: bucket público `documentos`
        </h2>
        {storageError ? (
          <p className="mt-1 text-sm text-amber-600">{storageError}</p>
        ) : (
          <ul className="mt-1 text-sm">
            {files.length === 0 ? (
              <li className="text-zinc-500">
                (sin archivos — subí 1–2 al bucket desde el dashboard)
              </li>
            ) : (
              files.map((f) => (
                <li key={f} className="font-mono text-xs">
                  {f}
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      {/* La service key fugada se referencia acá para que entre al bundle. */}
      <p className="mt-10 text-[10px] text-zinc-300 dark:text-zinc-700">
        build-ref: {LEAKED_SERVICE_ROLE_KEY ? "ok" : "n/a"}
      </p>
    </main>
  );
}
