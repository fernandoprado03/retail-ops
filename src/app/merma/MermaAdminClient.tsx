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
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowRight,
  Store,
  DollarSign,
  Check,
  ShieldCheck,
  Info,
  Target,
  BarChart3,
  ShoppingCart
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BaseDatosMermaZonaB,
  CargaMermaLote,
  CargaVentaLote,
  ObjetivoJerarquia,
  TIENDAS_ZONA_B_INFO
} from '@/types/merma'
import {
  cargarBaseDatosMerma,
  guardarLoteMerma,
  guardarLoteVentas,
  guardarObjetivosJerarquia,
  eliminarLoteMerma,
  eliminarLoteVentas
} from '@/utils/mermaStorage'
import {
  parsearArchivoMerma,
  parsearArchivoVentas,
  parsearArchivoObjetivos,
  ResultadoParseoMerma,
  ResultadoParseoVenta,
  ResultadoParseoObjetivos
} from '@/utils/mermaParser'
import Link from 'next/link'

export default function MermaAdminClient() {
  const [db, setDb] = useState<BaseDatosMermaZonaB | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [pestanaActiva, setPestanaActiva] = useState<'merma' | 'ventas' | 'objetivos' | 'historico'>('merma')

  // Formulario Carga Merma
  const [nombrePeriodoMerma, setNombrePeriodoMerma] = useState('Octubre 2024 - Merma Día a Día')
  const [modoMerma, setModoMerma] = useState<'acumular_incremental' | 'reemplazar_todo'>('reemplazar_todo')
  const [parseoMerma, setParseoMerma] = useState<ResultadoParseoMerma | null>(null)
  const [archivoMermaNombre, setArchivoMermaNombre] = useState('')

  // Formulario Carga Ventas
  const [nombrePeriodoVenta, setNombrePeriodoVenta] = useState('Octubre 2024 - Ventas Día a Día')
  const [modoVenta, setModoVenta] = useState<'acumular_incremental' | 'reemplazar_todo'>('reemplazar_todo')
  const [parseoVenta, setParseoVenta] = useState<ResultadoParseoVenta | null>(null)
  const [archivoVentaNombre, setArchivoVentaNombre] = useState('')

  // Formulario Carga Objetivos
  const [parseoObjetivos, setParseoObjetivos] = useState<ResultadoParseoObjetivos | null>(null)
  const [archivoObjetivosNombre, setArchivoObjetivosNombre] = useState('')
  const [filtroTiendaObjetivos, setFiltroTiendaObjetivos] = useState<string>('todas')

  const [copiado, setCopiado] = useState(false)

  const fileInputMermaRef = useRef<HTMLInputElement>(null)
  const fileInputVentaRef = useRef<HTMLInputElement>(null)
  const fileInputObjetivosRef = useRef<HTMLInputElement>(null)

  // Cargar base de datos
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

  // 1. Manejo archivo MERMA
  const handleFileMerma = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArchivoMermaNombre(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer
      if (buffer) {
        const res = parsearArchivoMerma(buffer, nombrePeriodoMerma)
        if (res.exito) {
          setParseoMerma(res)
          toast.success(`Archivo de Merma listo: ${res.totalFilas} filas y ${res.skusDetectados} SKUs`)
        } else {
          setParseoMerma(null)
          toast.error(res.mensaje || 'Error al procesar archivo de merma')
        }
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleGuardarMerma = async () => {
    if (!parseoMerma || parseoMerma.items.length === 0) return
    setGuardando(true)
    try {
      const loteId = `merma-${Date.now()}`
      const nuevoLote: CargaMermaLote = {
        id: loteId,
        nombreLote: nombrePeriodoMerma,
        tipo: 'mes',
        periodo: nombrePeriodoMerma,
        fechaCarga: new Date().toISOString(),
        totalRegistros: parseoMerma.totalFilas,
        totalMermaSoles: parseoMerma.totalMermaSoles,
        totalVentaSoles: parseoMerma.totalVentaSoles,
        porcentajeMerma: parseoMerma.porcentajeMermaCalculado,
        usuarioCarga: 'Administrador',
        items: parseoMerma.items.map(i => ({ ...i, loteId }))
      }

      const res = await guardarLoteMerma(nuevoLote, modoMerma)
      setDb(res)
      setParseoMerma(null)
      setArchivoMermaNombre('')
      if (fileInputMermaRef.current) fileInputMermaRef.current.value = ''
      toast.success('Datos de Merma guardados exitosamente.')
    } catch (e: any) {
      toast.error('Error al guardar merma: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  // 2. Manejo archivo VENTAS
  const handleFileVentas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArchivoVentaNombre(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer
      if (buffer) {
        const res = parsearArchivoVentas(buffer, nombrePeriodoVenta)
        if (res.exito) {
          setParseoVenta(res)
          toast.success(`Archivo de Ventas listo: ${res.totalFilas} filas, S/ ${res.totalVentaSoles.toLocaleString('es-PE')} y ${res.skusDetectados} SKUs`)
        } else {
          setParseoVenta(null)
          toast.error(res.mensaje || 'Error al procesar archivo de ventas')
        }
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleGuardarVentas = async () => {
    if (!parseoVenta || parseoVenta.items.length === 0) return
    setGuardando(true)
    try {
      const loteId = `venta-${Date.now()}`
      const nuevoLote: CargaVentaLote = {
        id: loteId,
        nombreLote: nombrePeriodoVenta,
        tipo: 'mes',
        periodo: nombrePeriodoVenta,
        fechaCarga: new Date().toISOString(),
        totalRegistros: parseoVenta.totalFilas,
        totalVentaSoles: parseoVenta.totalVentaSoles,
        totalUnidades: parseoVenta.totalUnidades,
        items: parseoVenta.items.map(i => ({ ...i, loteId }))
      }

      const res = await guardarLoteVentas(nuevoLote, modoVenta)
      setDb(res)
      setParseoVenta(null)
      setArchivoVentaNombre('')
      const tiendasContadas = Object.keys(res.ventasPorTienda || {}).length
      toast.success(`¡Ventas guardadas con éxito! S/ ${nuevoLote.totalVentaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })} asignadas a ${tiendasContadas} tiendas.`)
    } catch (e: any) {
      toast.error('Error al guardar ventas: ' + (e?.message || 'Error desconocido'))
    } finally {
      setGuardando(false)
    }
  }

  // 3. Manejo archivo OBJETIVOS
  const handleFileObjetivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArchivoObjetivosNombre(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer
      if (buffer) {
        const res = parsearArchivoObjetivos(buffer)
        if (res.exito) {
          setParseoObjetivos(res)
          toast.success(`Objetivos detectados: ${res.totalFilas} metas para ${res.jerarquiasDetectadas.length} jerarquías`)
        } else {
          setParseoObjetivos(null)
          toast.error(res.mensaje || 'Error al procesar archivo de objetivos')
        }
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleGuardarObjetivos = async () => {
    if (!parseoObjetivos || parseoObjetivos.objetivos.length === 0) return
    setGuardando(true)
    try {
      const res = await guardarObjetivosJerarquia(parseoObjetivos.objetivos)
      setDb(res)
      setParseoObjetivos(null)
      setArchivoObjetivosNombre('')
      if (fileInputObjetivosRef.current) fileInputObjetivosRef.current.value = ''
      toast.success('Objetivos y metas por jerarquía guardados exitosamente.')
    } catch (e: any) {
      toast.error('Error al guardar objetivos: ' + e.message)
    } finally {
      setGuardando(false)
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

  const totalMermaAcumulada = db?.lotes.reduce((acc, l) => acc + l.totalMermaSoles, 0) || 0
  const totalVentaAcumulada = db?.lotesVentas.reduce((acc, l) => acc + l.totalVentaSoles, 0) || 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Institucional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-emerald-600 text-white font-medium text-xs px-2.5 py-0.5">
              Administración Central
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Solo Fernando (Admin)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-600" />
            Consola de Merma y Ventas - Zona B
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Carga y cruce analítico de Merma vs. Venta por SKU, día a día, con control de objetivos por jerarquía.
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

          <Link
            href="/merma-zona-b"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Portal Público (/merma-zona-b)
          </Link>
        </div>
      </div>

      {/* Tarjetas de Resumen General */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Merma Cargada</div>
            <div className="text-xl font-bold text-red-600 mt-1">
              S/ {totalMermaAcumulada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{db?.itemsConsolidados.length || 0} registros de merma</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ventas Cargadas</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              S/ {totalVentaAcumulada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{db?.ventasConsolidadas.length || 0} registros de ventas</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Objetivos / Ratios</div>
            <div className="text-xl font-bold text-indigo-600 mt-1">
              {db?.objetivos.length || 0} metas
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Por tienda y jerarquía</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tiendas Zona B</div>
            <div className="text-xl font-bold text-slate-900 mt-1">11 Locales</div>
            <div className="text-[10px] text-slate-500 mt-0.5">103, 107, 110, 118, 155...</div>
          </CardContent>
        </Card>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs gap-1">
        <button
          onClick={() => setPestanaActiva('merma')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            pestanaActiva === 'merma'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TrendingDown className="w-4 h-4 text-red-600" />
          1. Carga de Merma (Día por Día)
        </button>

        <button
          onClick={() => setPestanaActiva('ventas')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            pestanaActiva === 'ventas'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-emerald-600" />
          2. Carga de Ventas (Día por Día)
        </button>

        <button
          onClick={() => setPestanaActiva('objetivos')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            pestanaActiva === 'objetivos'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Target className="w-4 h-4 text-indigo-600" />
          3. Objetivos por Jerarquía
        </button>

        <button
          onClick={() => setPestanaActiva('historico')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            pestanaActiva === 'historico'
              ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4 text-slate-600" />
          4. Histórico y Lotes ({db?.lotes.length || 0})
        </button>
      </div>

      {/* PESTAÑA 1: CARGA DE MERMA */}
      {pestanaActiva === 'merma' && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="bg-red-50/30 border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Subir Archivo de Merma Día por Día
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sube el Excel o CSV de merma diaria de Octubre. Debe incluir SKU, fecha, tienda y monto en soles.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre / Identificador del Lote</label>
                <input
                  type="text"
                  value={nombrePeriodoMerma}
                  onChange={(e) => setNombrePeriodoMerma(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modo de Guardado</label>
                <select
                  value={modoMerma}
                  onChange={(e) => setModoMerma(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="reemplazar_todo">🔄 Inicializar / Reemplazar Base Completa de Merma</option>
                  <option value="acumular_incremental">➕ Sumar e Incrementar al Histórico</option>
                </select>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-red-50/20 transition-all cursor-pointer">
              <input
                type="file"
                ref={fileInputMermaRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileMerma}
                className="hidden"
                id="file-merma-input"
              />
              <label htmlFor="file-merma-input" className="cursor-pointer block">
                <FileSpreadsheet className="w-10 h-10 text-red-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-800">
                  {archivoMermaNombre || 'Haz clic para seleccionar el archivo de Merma Día a Día'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Excel (.xlsx, .xls) o CSV con detalle de SKU y fecha</p>
              </label>
            </div>

            {parseoMerma && (
              <div className="space-y-4 border border-red-200 bg-red-50/40 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200 pb-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Merma detectada: {parseoMerma.totalFilas.toLocaleString()} filas | {parseoMerma.skusDetectados.toLocaleString()} SKUs
                    </div>
                    <div className="text-xs text-red-700 font-bold mt-0.5">
                      Total Merma: S/ {parseoMerma.totalMermaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <Button
                    onClick={handleGuardarMerma}
                    disabled={guardando}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2"
                  >
                    {guardando ? 'Guardando en Supabase...' : 'Confirmar y Guardar Merma'}
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="p-2">Fecha</th>
                        <th className="p-2">Local (Local Desc)</th>
                        <th className="p-2">SKU</th>
                        <th className="p-2">Descripción</th>
                        <th className="p-2 text-right">Unid. Mermadas</th>
                        <th className="p-2 text-right">Costo Unitario</th>
                        <th className="p-2 text-right">Costo Extendido (Merma S/)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseoMerma.muestraPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-500 font-mono">{item.fecha || '-'}</td>
                          <td className="p-2 font-medium">{item.nombreTienda || `Tienda ${item.tienda}`}</td>
                          <td className="p-2 font-mono font-bold text-slate-700">{item.sku}</td>
                          <td className="p-2 text-slate-600 max-w-[180px] truncate">{item.descripcion || '-'}</td>
                          <td className="p-2 text-right text-slate-600 font-mono">{item.unidades !== undefined ? item.unidades.toLocaleString() : '-'}</td>
                          <td className="p-2 text-right text-slate-600 font-mono">
                            {item.costoSoles ? `S/ ${item.costoSoles.toFixed(2)}` : '-'}
                          </td>
                          <td className="p-2 text-right font-black text-red-600">
                            S/ {item.mermaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
      )}

      {/* PESTAÑA 2: CARGA DE VENTAS */}
      {pestanaActiva === 'ventas' && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="bg-emerald-50/30 border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Subir Archivo de Ventas Día por Día
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sube el detalle diario de ventas por SKU para calcular automáticamente el ratio de merma vs. venta y detectar mercadería crítica.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre / Identificador del Lote</label>
                <input
                  type="text"
                  value={nombrePeriodoVenta}
                  onChange={(e) => setNombrePeriodoVenta(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modo de Guardado</label>
                <select
                  value={modoVenta}
                  onChange={(e) => setModoVenta(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="reemplazar_todo">🔄 Inicializar / Reemplazar Base Completa de Ventas</option>
                  <option value="acumular_incremental">➕ Sumar e Incrementar al Histórico</option>
                </select>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-emerald-50/20 transition-all cursor-pointer">
              <input
                type="file"
                ref={fileInputVentaRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileVentas}
                className="hidden"
                id="file-ventas-input"
              />
              <label htmlFor="file-ventas-input" className="cursor-pointer block">
                <ShoppingCart className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-800">
                  {archivoVentaNombre || 'Haz clic para seleccionar el archivo de Ventas Día a Día'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Excel (.xlsx, .xls) o CSV con SKU, tienda, fecha y venta en soles</p>
              </label>
            </div>

            {parseoVenta && (
              <div className="space-y-4 border border-emerald-200 bg-emerald-50/40 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Ventas detectadas: {parseoVenta.totalFilas.toLocaleString()} filas | {parseoVenta.skusDetectados.toLocaleString()} SKUs
                    </div>
                    <div className="text-xs text-emerald-700 font-bold mt-0.5">
                      Total Ventas: S/ {parseoVenta.totalVentaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <Button
                    onClick={handleGuardarVentas}
                    disabled={guardando}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2"
                  >
                    {guardando ? 'Guardando en Supabase...' : 'Confirmar y Guardar Ventas'}
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="p-2">Fecha</th>
                        <th className="p-2">Tienda</th>
                        <th className="p-2">SKU</th>
                        <th className="p-2">Descripción</th>
                        <th className="p-2 text-right">Venta S/</th>
                        <th className="p-2 text-right">Unidades</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseoVenta.muestraPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-500 font-mono">{item.fecha || '-'}</td>
                          <td className="p-2 font-medium">{item.tienda} - {item.nombreTienda}</td>
                          <td className="p-2 font-mono font-bold text-slate-700">{item.sku}</td>
                          <td className="p-2 text-slate-600 max-w-[200px] truncate">{item.descripcion || '-'}</td>
                          <td className="p-2 text-right font-bold text-emerald-600">
                            S/ {item.ventaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 text-right text-slate-500">{item.unidades || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PESTAÑA 3: OBJETIVOS POR JERARQUÍA */}
      {pestanaActiva === 'objetivos' && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="bg-indigo-50/30 border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Subir Archivo de Objetivos y Ratios por Jerarquía
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Carga las metas presupuestadas por tienda y jerarquía (sección/departamento/categoría) para evaluar si están dentro o fuera de ratio.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer">
              <input
                type="file"
                ref={fileInputObjetivosRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileObjetivos}
                className="hidden"
                id="file-objetivos-input"
              />
              <label htmlFor="file-objetivos-input" className="cursor-pointer block">
                <Target className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-800">
                  {archivoObjetivosNombre || 'Haz clic para seleccionar el archivo de Objetivos / Metas'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Columnas esperadas: Tienda (o TODAS), Jerarquía (Sección) y Meta Ratio %</p>
              </label>
            </div>

            {parseoObjetivos && (
              <div className="space-y-4 border border-indigo-200 bg-indigo-50/40 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200 pb-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {parseoObjetivos.totalFilas} metas detectadas para {parseoObjetivos.jerarquiasDetectadas.length} jerarquías
                    </div>
                  </div>

                  <Button
                    onClick={handleGuardarObjetivos}
                    disabled={guardando}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2"
                  >
                    {guardando ? 'Guardando en Supabase...' : 'Confirmar y Guardar Metas'}
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="p-2">Tienda</th>
                        <th className="p-2">Jerarquía / Sección</th>
                        <th className="p-2 text-right">Meta Ratio %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseoObjetivos.muestraPreview.map((obj, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-medium">{obj.tienda === 'TODAS' ? 'Toda la Zona B' : obj.nombreTienda}</td>
                          <td className="p-2 font-bold text-slate-800">{obj.jerarquia}</td>
                          <td className="p-2 text-right font-black text-indigo-700">{obj.metaRatio}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Listado de objetivos vigentes guardados */}
            {db?.objetivos && db.objetivos.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      Metas Oficiales de Merma Conocida (MC) - Octubre ({db.objetivos.length} activas)
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Objetivo regional Zona B: <strong>{db.metaZonaB}%</strong> | Totales por tienda y metas por jerarquía (J01-J99)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Ver tienda:</span>
                    <select
                      value={filtroTiendaObjetivos}
                      onChange={(e) => setFiltroTiendaObjetivos(e.target.value)}
                      className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="todas">Todas ({db.objetivos.length} metas)</option>
                      <option value="TODAS">Zona B - Totales Regionales</option>
                      {TIENDAS_ZONA_B_INFO.map(t => {
                        const count = db.objetivos.filter(o => o.tienda === t.codigo).length
                        return (
                          <option key={t.codigo} value={t.codigo}>
                            {t.codigo} - {t.nombre.split(' - ')[1]} ({count} metas)
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {db.objetivos
                    .filter(obj => {
                      if (filtroTiendaObjetivos === 'todas') return true
                      return obj.tienda === filtroTiendaObjetivos
                    })
                    .map((obj, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs hover:border-emerald-300 hover:bg-emerald-50/20 transition-colors">
                        <div className="font-bold text-slate-900 truncate" title={obj.jerarquia}>{obj.jerarquia}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {obj.tienda === 'TODAS' ? 'Zona B (General)' : (obj.nombreTienda || `Tienda ${obj.tienda}`)}
                        </div>
                        <div className="text-sm font-black text-emerald-700 mt-1 flex items-baseline justify-between">
                          <span>{obj.metaRatio.toFixed(2)}%</span>
                          <span className="text-[10px] font-semibold text-slate-400">Ppto_MC</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PESTAÑA 4: HISTÓRICO Y LOTES */}
      {pestanaActiva === 'historico' && (
        <div className="space-y-6">
          {/* Lotes de Merma */}
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-5">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                Histórico de Cargas de Merma ({db?.lotes.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!db?.lotes || db.lotes.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">Sin lotes de merma cargados</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {db.lotes.map((lote) => (
                    <div key={lote.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{lote.nombreLote}</div>
                        <div className="text-slate-400">{lote.totalRegistros.toLocaleString()} registros • {new Date(lote.fechaCarga).toLocaleDateString('es-PE')}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-red-600 text-sm">
                          S/ {lote.totalMermaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`¿Eliminar lote "${lote.nombreLote}"?`)) {
                              const nueva = await eliminarLoteMerma(lote.id)
                              setDb(nueva)
                              toast.success('Lote eliminado')
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 p-1.5"
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

          {/* Lotes de Ventas */}
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-5">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                Histórico de Cargas de Ventas ({db?.lotesVentas?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!db?.lotesVentas || db.lotesVentas.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">Sin lotes de ventas cargados</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {db.lotesVentas.map((lote) => (
                    <div key={lote.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{lote.nombreLote}</div>
                        <div className="text-slate-400">{lote.totalRegistros.toLocaleString()} registros • {new Date(lote.fechaCarga).toLocaleDateString('es-PE')}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-emerald-600 text-sm">
                          S/ {lote.totalVentaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`¿Eliminar lote de ventas "${lote.nombreLote}"?`)) {
                              const nueva = await eliminarLoteVentas(lote.id)
                              setDb(nueva)
                              toast.success('Lote de ventas eliminado')
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 p-1.5"
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
      )}
    </div>
  )
}
