import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const subscription = await req.json()

    // Upsert subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: subscription,
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('Error saving subscription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
