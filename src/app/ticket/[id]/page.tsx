import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, AlertCircle, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import FormSubsanar from './FormSubsanar'
import ValidacionGerencia from './ValidacionGerencia'

export const revalidate = 0

function getEstadoColor(estado: string) {
  switch (estado) {
    case 'Pendiente': return 'bg-red-100 text-red-700 border-red-200'
    case 'En Proceso': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'Subsanado': return 'bg-green-100 text-green-700 border-green-200'
    case 'Aprobado': return 'bg-green-100 text-green-700 border-green-200'
    case 'Rechazado': return 'bg-slate-100 text-slate-700 border-slate-200'
    default: return 'bg-slate-100 text-slate-700'
  }
}

export default async function TicketDetalle({ params }: { params: { id: string } }) {
  const { data: incidencia, error } = await supabase
    .from('observaciones')
    .select('*, areas(nombre_area)')
    .eq('id', params.id)
    .single()

  if (error || !incidencia) {
    notFound()
  }

  const date = new Date(incidencia.fecha_reporte)
  const fechaFormateada = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="pb-12">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 bg-white rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900 truncate">Ticket #{incidencia.codigo_ticket || incidencia.id.substring(0, 8)}</h1>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden mb-6">
        <div className="w-full aspect-video bg-slate-100 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={incidencia.foto_antes_url} 
            alt="Antes" 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={`${getEstadoColor(incidencia.estado)} font-bold px-2 py-1 uppercase tracking-wider text-xs shadow-sm`} variant="outline">
              {incidencia.estado}
            </Badge>
            {incidencia.prioridad === 'Alta' && (
              <Badge className="bg-red-600 hover:bg-red-600 text-white font-bold px-2 py-1 shadow-sm border-0">
                Prioridad Alta
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{incidencia.tipo_incidencia}</h2>
          
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="font-medium">{incidencia.areas?.nombre_area}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
              <Clock className="w-4 h-4 text-green-500" />
              <span>{fechaFormateada}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed">
            {incidencia.descripcion}
          </div>
        </CardContent>
      </Card>

      {/* Si hay foto de después, la mostramos */}
      {incidencia.foto_despues_url && (
        <Card className="border-0 shadow-sm overflow-hidden mb-6 border-l-4 border-l-green-500">
          <div className="p-4 bg-slate-50 flex items-center justify-between border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Evidencia de Solución
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {new Date(incidencia.fecha_subsanacion).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
          
          <div className="w-full aspect-video bg-slate-100 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={incidencia.foto_despues_url} 
              alt="Después" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <CardContent className="p-4">
            <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-100 italic">
              &quot;{incidencia.comentario_subsanacion}&quot;
            </p>
          </CardContent>
        </Card>
      )}

      {/* Acciones según el estado */}
      {(incidencia.estado === 'Pendiente' || incidencia.estado === 'En Proceso') && (
        <FormSubsanar incidenciaId={incidencia.id} />
      )}

      {incidencia.estado === 'Subsanado' && (
        <ValidacionGerencia incidenciaId={incidencia.id} />
      )}
      
      {incidencia.comentario_gerencia && (
        <div className={`p-4 rounded-lg border ${incidencia.estado === 'Rechazado' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'} text-sm mt-4`}>
          <div className="font-bold mb-1 flex items-center gap-2">
            {incidencia.estado === 'Rechazado' ? <XCircle className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
            Comentario de Gerencia
          </div>
          {incidencia.comentario_gerencia}
        </div>
      )}
    </div>
  )
}
