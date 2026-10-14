'use client'

import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, AlertCircle } from 'lucide-react'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const getErrorMessage = (err: string | null) => {
    if (!err) return null
    if (err === 'server_error') {
      return 'Google rechazó la conexión institucional (server_error). En cuentas corporativas (@tottus.com.pe), esto ocurre cuando la aplicación en Google Cloud Console está en modo "Prueba" y el correo no ha sido registrado como "Usuario de prueba", o cuando Google Workspace bloquea aplicaciones externas no aprobadas.'
    }
    if (err === 'access_denied') {
      return 'Acceso denegado por Google. Se canceló la autorización o tu cuenta no tiene permisos para usar esta aplicación.'
    }
    if (err === 'true') {
      return 'La sesión de Google no pudo completarse. Asegúrate de seleccionar tu cuenta corporativa autorizada.'
    }
    return err
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        }
      },
    })
    
    if (error) {
      alert("Error iniciando sesión con Google: " + error.message)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm z-10 border-0 shadow-2xl overflow-hidden bg-white/90 backdrop-blur-lg">
      <div className="h-2 w-full bg-green-500" />
      <CardHeader className="text-center pb-2 pt-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          <Store className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Retail Ops</CardTitle>
        <CardDescription className="text-slate-500 font-medium">
          Sistema de Gestión de Incidencias
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 pb-8">
        {errorParam && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-semibold">No se pudo iniciar sesión</strong>
              <p className="mt-0.5 text-red-600 leading-relaxed">
                {getErrorMessage(errorParam)}
              </p>
            </div>
          </div>
        )}

        <Button 
          onClick={handleGoogleLogin} 
          disabled={isLoading}
          className="w-full h-12 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center gap-3 text-base font-medium transition-all hover:shadow-md cursor-pointer"
        >
          {isLoading ? (
            <span className="animate-pulse">Conectando...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Ingresar con Google
            </>
          )}
        </Button>
        <p className="text-xs text-center text-slate-400 mt-6 px-4">
          Ingreso exclusivo para personal autorizado de Tottus con correo corporativo.
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 relative -mx-4 -my-4 md:-mx-4 md:-my-16 h-[100vh]">
      <div className="absolute inset-0 bg-green-600/10 backdrop-blur-3xl z-0 rounded-full blur-[100px] transform scale-150" />
      <Suspense fallback={<div className="text-slate-400 text-sm">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
