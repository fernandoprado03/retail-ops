import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Clock, MapPin, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

function getEstadoColor(estado: string) {
  switch (estado) {
    case 'Pendiente': return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
    case 'En Proceso': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200'
    case 'Subsanado': return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
    case 'Aprobado': return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
    case 'Rechazado': return 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export default async function Pendientes() {
  const { data: incidencias } = await supabase
    .from('observaciones')
    .select('*, areas(nombre_area)')
    .order('fecha_reporte', { ascending: false })

  return (
    <div className="pb-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Incidencias</h1>
          <p className="text-sm text-slate-500">Gestión de tickets en piso</p>
        </div>
        <Badge variant="outline" className="font-medium bg-white text-slate-600 shadow-sm px-3 py-1 text-sm border-slate-200">
          {incidencias?.length || 0} Tickets
        </Badge>
      </div>

      <div className="space-y-4">
        {incidencias?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-medium">Todo al día</h3>
            <p className="text-slate-500 text-sm mt-1">No hay incidencias pendientes.</p>
          </div>
        ) : (
          incidencias?.map((incidencia) => (
            <Link href={`/ticket/${incidencia.id}`} key={incidencia.id} className="block">
              <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden active:scale-[0.98] active:bg-slate-50">
                <div className="flex h-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="w-28 shrink-0 bg-slate-100 relative">
                    <img 
                      src={incidencia.foto_antes_url} 
                      alt="Antes" 
                      className="w-full h-full object-cover"
                    />
                    {incidencia.prioridad === 'Alta' && (
                      <div className="absolute top-1 left-1 bg-red-600 text-white p-1 rounded shadow-sm">
                        <AlertTriangle className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <Badge className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${getEstadoColor(incidencia.estado)}`} variant="outline">
                          {incidencia.estado}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {formatTime(incidencia.fecha_reporte)}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-sm text-slate-900 leading-tight line-clamp-1 mt-1">
                        {incidencia.tipo_incidencia}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{incidencia.areas?.nombre_area || 'Área general'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

// Para usar el icono check
import { CheckCircle2 } from 'lucide-react'
