'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotifier() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      navigator.serviceWorker.register('/sw.js')
      
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription)
        })
      })
    }
  }, [])

  const subscribeButtonOnClick = async () => {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready
      
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicVapidKey) {
        console.error('No VAPID public key available')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      })

      // Enviar suscripción a nuestro backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      setIsSubscribed(true)
      alert('Notificaciones activadas correctamente.')
    } else {
      alert('Debes permitir las notificaciones en tu navegador.')
    }
  }

  if (!isSupported || isSubscribed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-3 border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-2 rounded-full text-green-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Activar Alertas</p>
            <p className="text-xs text-slate-400">Recibe notificaciones cuando te asignen un ticket.</p>
          </div>
        </div>
        <Button onClick={subscribeButtonOnClick} size="sm" className="bg-green-600 hover:bg-green-700 text-white shrink-0">
          Permitir
        </Button>
      </div>
    </div>
  )
}
