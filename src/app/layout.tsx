import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { createClient } from '@/utils/supabase/server';
import { Store, Clock } from 'lucide-react';

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Retail Ops - Gestión de Incidencias",
  description: "Sistema de gestión de incidencias en piso de venta",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let isAuthorized = true
  let showNavbar = true
  
  if (user) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('activo')
      .eq('id', user.id)
      .single()
      
    // Si el perfil no está activo, no está autorizado
    if (perfil && !perfil.activo) {
      isAuthorized = false
      showNavbar = false
    }
  }

  return (
    <html lang="es">
      <body
        className={`${outfit.variable} font-sans antialiased bg-slate-50 text-slate-900 pb-28 md:pb-0 md:pt-16 min-h-screen flex flex-col`}
      >
        {showNavbar && <Navbar />}
        <main className="flex-1 w-full max-w-md mx-auto md:max-w-4xl p-4">
          {!isAuthorized ? (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Cuenta en Revisión</h1>
              <p className="text-slate-500 mb-6">
                Has iniciado sesión correctamente, pero tu cuenta debe ser aprobada por un Administrador antes de acceder a la plataforma.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </body>
    </html>
  );
}
