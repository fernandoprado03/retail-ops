'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validarIncidencia } from '@/actions/incidencias'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Check, X } from 'lucide-react'

export default function ValidacionGerencia({ incidenciaId }: { incidenciaId: string }) {
  const router = useRouter()
  const [comentario, setComentario] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleValidar = async (accion: 'aprobar' | 'rechazar') => {
    if (accion === 'rechazar' && !comentario.trim()) {
      alert("Debes añadir un comentario si vas a rechazar la solución.")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await validarIncidencia(incidenciaId, accion, comentario)
      if (!result.success) throw new Error(result.error)
      router.refresh()
    } catch (error: any) {
      alert(error.message)
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden mt-6">
      <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            Validación de Gerencia
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">Aprueba o rechaza el trabajo realizado.</p>
        </div>
      </div>
      
      <CardContent className="p-5 space-y-4">
        <Textarea 
          placeholder="Comentario (Obligatorio si rechazas)..." 
          className="resize-none bg-slate-50"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          disabled={isSubmitting}
        />
        
        <div className="flex gap-3">
          <Button 
            onClick={() => handleValidar('rechazar')}
            disabled={isSubmitting} 
            variant="outline"
            className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <X className="w-5 h-5 mr-1" /> Rechazar
          </Button>
          <Button 
            onClick={() => handleValidar('aprobar')}
            disabled={isSubmitting} 
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white shadow-md"
          >
            <Check className="w-5 h-5 mr-1" /> Aprobar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
