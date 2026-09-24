'use client'

import { Button } from '@/components/ui/button'
import { toggleUsuarioActivo } from '@/actions/usuarios'
import { useState } from 'react'

export default function ActivarUsuarioBoton({ 
  usuarioId, 
  estadoActual, 
  isSelf 
}: { 
  usuarioId: string
  estadoActual: boolean
  isSelf: boolean 
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    if (isSelf && estadoActual) {
      alert("No puedes bloquear tu propia cuenta.")
      return
    }
    
    setIsLoading(true)
    const result = await toggleUsuarioActivo(usuarioId, !estadoActual)
    if (!result.success) {
      alert(result.error)
    }
    setIsLoading(false)
  }

  return (
    <Button 
      variant={estadoActual ? "outline" : "default"} 
      size="sm" 
      onClick={handleToggle}
      disabled={isLoading || (isSelf && estadoActual)}
      className={`h-7 text-xs ${!estadoActual ? 'bg-green-600 hover:bg-green-700' : ''}`}
    >
      {isLoading ? "..." : estadoActual ? "Bloquear" : "Aprobar"}
    </Button>
  )
}
