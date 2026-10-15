'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  TrendingDown,
  RefreshCw,
  Plus,
  ArrowRight,
  Store,
  DollarSign,
  Check,
  ShieldCheck,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BaseDatosMermaZonaB, CargaMermaLote, TIENDAS_ZONA_B_INFO } from '@/types/merma'
import { cargarBaseDatosMerma, guardarLoteMerma, eliminarLoteMerma } from '@/utils/mermaStorage'
import { parsearArchivoMerma, ResultadoParseoMerma } from '@/utils/mermaParser'
import Link from 'next/link'

export default function MermaAdminClient() {
  const [db, setDb] = useState<BaseDatosMermaZonaB | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  // Estados del formulario de carga
  const [tipoCarga, setTipoCarga] = useState<'mes' | 'semana'>('mes')
  const [nombrePeriodo, setNombrePeriodo] = useState('Octubre 2024')
  const [modoPersistencia, setModoPersistencia] = useState<'acumular_incremental' | 'reemplazar_todo'>('reemplazar_todo')
  const [resultadoParseo, setResultadoParseo] = useState<ResultadoParseoMerma | null>(null)
  const [archivoNombre, setArchivoNombre] = useState('')
  const [copiado, setCopiado] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar base de datos inicial
  const refrescarDatos = async () => {
    setCargando(true)
    try {
      const data = await cargarBaseDatosMerma()
      setDb(data)
    } catch (e: any) {
      toast.error('Error al cargar la base de datos de Merma: ' + e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    refrescarDatos()
  }, [])

  // Manejar subida de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArchivoNombre(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer
      if (buffer) {
        const resultado = parsearArchivoMerma(buffer, nombrePeriodo)
        if (resultado.exito) {
          setResultadoParseo(resultado)
          toast.success(`Archivo procesado: ${resultado.totalFilas} registros detectados`)
        } else {
          setResultadoParseo(null)
          toast.error(resultado.mensaje || 'Error al procesar el archivo')
        }
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Confirmar y guardar lote en Supabase / Local
  const handleGuardarLote = async () => {
    if (!resultadoParseo || resultadoParseo.items.length === 0) {
      toast.error('No hay datos válidos para guardar.')
      return
    }

    setGuardando(true)
    try {
      const loteId = `lote-${Date.now()}`
      const nuevoLote: CargaMermaLote = {
        id: loteId,
        nombreLote: nombrePeriodo,
        tipo: tipoCarga,
        periodo: nombrePeriodo,
        fechaCarga: new Date().toISOString(),
        totalRegistros: resultadoParseo.totalFilas,
        totalMermaSoles: resultadoParseo.totalMermaSoles,
        totalVentaSoles: resultadoParseo.totalVentaSoles,
        porcentajeMerma: resultadoParseo.porcentajeMermaCalculado,
        usuarioCarga: 'Administrador',
        items: resultadoParseo.items.map(item => ({ ...item, loteId }))
      }

      const baseActualizada = await guardarLoteMerma(nuevoLote, modoPersistencia)
      setDb(baseActualizada)
      setResultadoParseo(null)
      setArchivoNombre('')
      if (fileInputRef.current) fileInputRef.current.value = ''

      toast.success(
        modoPersistencia === 'reemplazar_todo'
          ? 'Base de datos de Merma inicializada con éxito'
          : 'Lote semanal agregado al histórico consolidado'
      )
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  // Eliminar lote del histórico
  const handleEliminarLote = async (loteId: string, nombreLote: string) => {
    if (!confirm(`¿Estás seguro de eliminar el lote "${nombreLote}"? Se restará del acumulado histórico.`)) {
      return
    }
    try {
      const nuevaBase = await eliminarLoteMerma(loteId)
      setDb(nuevaBase)
      toast.success(`Lote "${nombreLote}" eliminado`)
    } catch (e: any) {
      toast.error('Error al eliminar lote: ' + e.message)
    }
  }

  // Copiar link público
  const handleCopiarEnlace = () => {
    const url = `${window.location.origin}/merma-zona-b`
    navigator.clipboard.writeText(url)
    setCopiado(true)
    toast.success('Enlace público copiado: ' + url)
    setTimeout(() => setCopiado(false), 2500)
  }

  // Métricas acumuladas consolidadas
  const totalMermaAcumulada = db?.lotes.reduce((acc, l) => acc + l.totalMermaSoles, 0) || 0
  const totalVentaAcumulada = db?.lotes.reduce((acc, l) => acc + (l.totalVentaSoles || 0), 0) || 0
  const totalRegistrosAcumulados = db?.itemsConsolidados.length || 0
  const ratioGlobal = totalVentaAcumulada > 0 ? (totalMermaAcumulada / totalVentaAcumulada) * 100 : 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Encabezado y Acceso Directo al Portal Público */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-emerald-600 text-white font-medium text-xs px-2.5 py-0.5">
              Administración Exclusiva
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Solo Fernando (Admin)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-600" />
            Módulo de Merma - Zona B
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Carga y consolida los archivos de merma. La información configurada aquí alimenta automáticamente el portal público.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopiarEnlace}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            {copiado ? '¡Copiado!' : 'Copiar Link Público'}
          </Button>

          <Link href="/merma-zona-b" target="_blank">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm">
              <ExternalLink className="w-4 h-4" />
              Ver Portal Público (/merma-zona-b)
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumen de KPIs Acumulados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Merma Acumulada</div>
            <div className="text-xl font-bold text-red-600 mt-1">
              S/ {totalMermaAcumulada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Consolidado en soles</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">% Merma Global</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {ratioGlobal > 0 ? `${ratioGlobal.toFixed(2)}%` : 'Calculando...'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Meta Zona B: {db?.metaZonaB || 4.84}%</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lotes Cargados</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              {db?.lotes.length || 0} periodo(s)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{totalRegistrosAcumulados} filas en histórico</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tiendas Zona B</div>
            <div className="text-xl font-bold text-indigo-600 mt-1">11 Tiendas</div>
            <div className="text-[10px] text-slate-500 mt-0.5">103, 107, 110, 118, 155...</div>
          </CardContent>
        </Card>
      </div>

      {/* Zona de Carga de Archivo */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Cargar Archivo de Merma (Excel / CSV)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Sube el reporte mensual de Octubre o suma semanas incrementales para construir el histórico.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Opciones del lote */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipo de Carga
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTipoCarga('mes')
                    setNombrePeriodo('Octubre 2024')
                    setModoPersistencia('reemplazar_todo')
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    tipoCarga === 'mes'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  📅 Mes Completo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipoCarga('semana')
                    setNombrePeriodo('Semana 43 - Octubre')
                    setModoPersistencia('acumular_incremental')
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    tipoCarga === 'semana'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  📈 Semana Incremental
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Etiqueta del Período
              </label>
              <input
                type="text"
                value={nombrePeriodo}
                onChange={(e) => setNombrePeriodo(e.target.value)}
                placeholder="ej: Octubre 2024 o Semana 43"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-emerald-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Modo de Guardado
              </label>
              <select
                value={modoPersistencia}
                onChange={(e) => setModoPersistencia(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-emerald-600 font-medium text-slate-700"
              >
                <option value="reemplazar_todo">🔄 Inicializar / Reemplazar Base Completa</option>
                <option value="acumular_incremental">➕ Sumar e Incrementar al Histórico</option>
              </select>
            </div>
          </div>

          {/* Input de archivo estilizado */}
          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-emerald-50/20 transition-all cursor-pointer">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-merma-input"
            />
            <label htmlFor="file-merma-input" className="cursor-pointer block">
              <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">
                {archivoNombre ? archivoNombre : 'Haz clic o arrastra aquí tu archivo de Merma'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Formatos soportados: Excel (.xlsx, .xls) o CSV (.csv). Mapeo automático de Tienda, Merma S/, Venta y Sección.
              </p>
            </label>
          </div>

          {/* Vista Previa de Datos Detectados */}
          {resultadoParseo && (
            <div className="space-y-4 border border-emerald-200 bg-emerald-50/40 p-4 rounded-xl animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-slate-900">
                      Archivo listo para guardar: {resultadoParseo.totalFilas} registros
                    </span>
                    <span className="text-xs text-slate-600 ml-2">
                      (Merma Total detectada: <strong>S/ {resultadoParseo.totalMermaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>)
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleGuardarLote}
                  disabled={guardando}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2"
                >
                  {guardando ? 'Guardando en Supabase...' : 'Confirmar y Guardar Lote'}
                </Button>
              </div>

              {/* Tiendas detectadas */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1.5">
                  Tiendas Zona B encontradas ({resultadoParseo.tiendasDetectadas.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {resultadoParseo.tiendasDetectadas.map((t) => (
                    <Badge key={t} variant="outline" className="bg-white text-slate-700 border-slate-300 text-[11px]">
                      Tienda {t}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Muestra de primeras filas */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                    <tr>
                      <th className="p-2">Tienda</th>
                      <th className="p-2">Sección</th>
                      <th className="p-2">Motivo</th>
                      <th className="p-2 text-right">Merma S/</th>
                      <th className="p-2 text-right">Venta S/</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultadoParseo.muestraPreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-medium text-slate-900">{item.tienda} - {item.nombreTienda}</td>
                        <td className="p-2 text-slate-600">{item.seccion}</td>
                        <td className="p-2 text-slate-500">{item.motivo}</td>
                        <td className="p-2 text-right font-bold text-red-600">
                          S/ {item.mermaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-right text-slate-600">
                          {item.ventaSoles ? `S/ ${item.ventaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Cargas Realizadas */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Histórico de Períodos Cargados ({db?.lotes.length || 0})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Listado de lotes que conforman el reporte consolidado. Puedes remover cualquier semana si hubo algún error.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refrescarDatos}
              disabled={cargando}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              Refrescar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!db?.lotes || db.lotes.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Aún no se ha cargado ningún archivo de merma.</p>
              <p className="text-xs text-slate-400 mt-1">
                Usa el botón de arriba para subir los datos de Octubre y empezar a construir el histórico.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {db.lotes.map((lote) => (
                <div key={lote.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{lote.nombreLote}</span>
                        <Badge variant="outline" className={lote.tipo === 'mes' ? 'bg-purple-50 text-purple-700 border-purple-200 text-[10px]' : 'bg-blue-50 text-blue-700 border-blue-200 text-[10px]'}>
                          {lote.tipo === 'mes' ? 'Mes Completo' : 'Semana'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>📅 Cargado: {new Date(lote.fechaCarga).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>📊 {lote.totalRegistros.toLocaleString()} registros</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">
                        S/ {lote.totalMermaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {lote.porcentajeMerma > 0 && (
                        <div className="text-[11px] text-slate-500 font-medium">
                          Ratio: {lote.porcentajeMerma.toFixed(2)}%
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEliminarLote(lote.id, lote.nombreLote)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2"
                      title="Eliminar este lote del consolidado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
