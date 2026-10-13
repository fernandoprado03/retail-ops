import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

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

          // Buscar si el admin pre-creó un perfil con este correo
          const { data: perfilExistente } = await dbClient
            .from('perfiles')
            .select('id, nombre_completo, rol, activo')
            .ilike('email', userEmail)
            .maybeSingle()

          if (perfilExistente && perfilExistente.id !== user.id) {
            const idAntiguo = perfilExistente.id

            // Actualizar áreas antes de cambiar o reasignar
            await dbClient
              .from('areas')
              .update({ jefe_responsable_id: user.id })
              .eq('jefe_responsable_id', idAntiguo)

            // Actualizar el perfil con el ID de Auth real
            await dbClient
              .from('perfiles')
              .update({ id: user.id })
              .eq('id', idAntiguo)
          } else if (!perfilExistente) {
            // Si el perfil no existía en absoluto, crearlo (inactivo por defecto)
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

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=true`)
}

