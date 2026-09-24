import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardCheck, AlertOctagon, Activity } from 'lucide-react'

export const revalidate = 0

export default async function KPIs() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  
  const { data: todas } = await supabase
    .from('observaciones')
    .select('*, areas(nombre_area)')
    .gte('fecha_reporte', hoy.toISOString())

  const total = todas?.length || 0
  const cerradas = todas?.filter(i => i.estado === 'Aprobado' || i.estado === 'Subsanado').length || 0
  const pendientes = todas?.filter(i => i.estado === 'Pendiente' || i.estado === 'En Proceso').length || 0
  
  const cumplimiento = total === 0 ? 0 : Math.round((cerradas / total) * 100)

  // Agrupar por áreas
  const porArea: Record<string, { total: number, cerradas: number }> = {}
  todas?.forEach(i => {
    const area = i.areas?.nombre_area || 'Desconocida'
    if (!porArea[area]) porArea[area] = { total: 0, cerradas: 0 }
    porArea[area].total++
    if (i.estado === 'Aprobado' || i.estado === 'Subsanado') {
      porArea[area].cerradas++
    }
  })

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">KPIs de Hoy</h1>
        <p className="text-sm text-slate-500">Métricas de cumplimiento operativo</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-white border-0 shadow-sm col-span-2">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Tasa de Cumplimiento</p>
              <h2 className="text-4xl font-bold text-slate-900">{cumplimiento}%</h2>
            </div>
            <div className={`p-4 rounded-full ${cumplimiento >= 80 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
              <Activity className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <AlertOctagon className="w-6 h-6 text-red-500 mb-3" />
            <p className="text-xs font-medium text-slate-500 mb-1">Total Hallazgos</p>
            <h3 className="text-2xl font-bold text-slate-900">{total}</h3>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <ClipboardCheck className="w-6 h-6 text-blue-500 mb-3" />
            <p className="text-xs font-medium text-slate-500 mb-1">Solucionados</p>
            <h3 className="text-2xl font-bold text-slate-900">{cerradas}</h3>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold text-slate-900 mb-4">Desglose por Área</h2>
      
      <div className="space-y-3">
        {Object.entries(porArea).sort((a, b) => b[1].total - a[1].total).map(([area, metrica]) => (
          <div key={area} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <h4 className="font-medium text-sm text-slate-700">{area}</h4>
              <span className="text-xs font-semibold text-slate-500">{metrica.cerradas} / {metrica.total}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full ${Math.round((metrica.cerradas / metrica.total) * 100) >= 80 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.round((metrica.cerradas / metrica.total) * 100)}%` }}
              ></div>
            </div>
          </div>
        ))}

        {Object.keys(porArea).length === 0 && (
          <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-slate-100">
            No hay datos registrados hoy.
          </div>
        )}
      </div>
    </div>
  )
}
