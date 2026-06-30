import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Banco de pruebas — Supabase (vulnerable a propósito)",
  description: "App de prueba para validar un scanner de seguridad. Datos falsos.",
  robots: { index: false, follow: false },
  // Verificación de propiedad para Sereno (código path-aware de esta URL).
  other: { "sereno-site-verification": "sereno-9da28dc20fe838adc96758db8bf78ae0" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
