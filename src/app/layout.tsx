import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Retail Ops - Gestión de Incidencias",
  description: "Sistema de gestión de incidencias en piso de venta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 pb-20 md:pb-0 md:pt-16 min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-1 w-full max-w-md mx-auto md:max-w-4xl p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
