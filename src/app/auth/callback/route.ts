import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Construir base de redirección respetando proxies de Vercel (HTTPS)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const redirectBase = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin

  // Capturar posibles errores devueltos por Google OAuth en la URL
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  if (errorParam || errorDescription) {
    const errorMsg = errorDescription || errorParam || 'Error de autenticación con Google'
    console.error('OAuth callback error params:', { errorParam, errorDescription })
    return NextResponse.redirect(`${redirectBase}/login?error=${encodeURIComponent(errorMsg)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Sincronizar / vincular perfil precreado por correo si existe
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const dbClient = createAdminClient() || supabase
          const userEmail = user.email.trim().toLowerCase()

          // Buscar si el admin pre-creó un perfil con este correo (insensible a mayúsculas)
          const { data: perfilExistente } = await dbClient
            .from('perfiles')
            .select('id, nombre_completo, rol, activo, permisos')
            .ilike('email', userEmail)
            .maybeSingle()

          if (perfilExistente) {
            // Si el perfil existía pero con un ID temporal (UUID generado antes de loguearse)
            if (perfilExistente.id !== user.id) {
              const idAntiguo = perfilExistente.id

              // Actualizar áreas asignadas
              await dbClient
                .from('areas')
                .update({ jefe_responsable_id: user.id })
                .eq('jefe_responsable_id', idAntiguo)

              // Crear o actualizar el perfil con el ID real de Google Auth
              await dbClient.from('perfiles').upsert({
                id: user.id,
                email: userEmail,
                nombre_completo: user.user_metadata?.full_name || perfilExistente.nombre_completo,
                rol: perfilExistente.rol || 'jefe_area',
                activo: perfilExistente.activo ?? true,
                permisos: perfilExistente.permisos
              })

              // Limpiar el registro temporal anterior
              await dbClient.from('perfiles').delete().eq('id', idAntiguo)
            }
          } else {
            // Si el perfil no existía en absoluto, crearlo (inactivo por defecto hasta aprobación)
            await dbClient.from('perfiles').upsert({
              id: user.id,
              email: userEmail,
              nombre_completo: user.user_metadata?.full_name || user.email.split('@')[0],
              rol: 'jefe_area',
              activo: false,
            })
          }
        }
      } catch (linkErr) {
        console.error('Error sincronizando perfil en auth callback:', linkErr)
      }

      return NextResponse.redirect(`${redirectBase}${next}`)
    } else {
      console.error('exchangeCodeForSession error:', error)
      return NextResponse.redirect(`${redirectBase}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  // Si no vino código ni params, retornar con aviso
  return NextResponse.redirect(`${redirectBase}/login?error=${encodeURIComponent('No se recibió código de autorización de Google')}`)
}

