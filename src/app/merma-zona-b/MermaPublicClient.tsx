'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingDown,
  TrendingUp,
  Store,
  Calendar,
  Layers,
  Filter,
  Search,
  Download,
  Share2,
  Check,
  Copy,
  Sparkles,
  Info,
  ShieldCheck,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  PieChart,
  DollarSign,
  PackageMinus,
  AlertOctagon,
  Target,
  ShoppingCart,
  ListFilter
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BaseDatosMermaZonaB, CruceSkuAnalisis, TIENDAS_ZONA_B_INFO } from '@/types/merma'
import { cargarBaseDatosMerma } from '@/utils/mermaStorage'
import { generarCruceMermaVentas } from '@/utils/mermaParser'
import * as XLSX from 'xlsx'

export default function MermaPublicClient() {
  const [db, setDb] = useState<BaseDatosMermaZonaB | null>(null)
  const [cargando, setCargando] = useState(true)
  const [vistaActiva, setVistaActiva] = useState<'tiendas' | 'jerarquias' | 'merma_mayor_venta' | 'todos_skus'>('tiendas')

  // Filtros
  const [tiendaFiltro, setTiendaFiltro] = useState<string>('todas')
  const [seccionFiltro, setSeccionFiltro] = useState<string>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [soloFueraDeRatio, setSoloFueraDeRatio] = useState(false)
  const [copiadoWsp, setCopiadoWsp] = useState(false)

  // Cargar datos
  const refrescar = async () => {
    setCargando(true)
    try {
      const data = await cargarBaseDatosMerma()
      setDb(data)
    } catch (e: any) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    refrescar()
  }, [])

  // Cruce de SKU analítico
  const itemsCruzados = useMemo(() => {
    if (!db) return []
    return generarCruceMermaVentas(
      db.itemsConsolidados || [],
      db.ventasConsolidadas || [],
      db.objetivos || []
    )
  }, [db])

  // Lista filtrada según selectores
  const itemsFiltrados = useMemo(() => {
    let list = itemsCruzados

    if (tiendaFiltro !== 'todas') {
      list = list.filter(i => i.tienda === tiendaFiltro)
    }

    if (seccionFiltro !== 'todas') {
      list = list.filter(i => i.seccion.toLowerCase() === seccionFiltro.toLowerCase())
    }

    if (soloFueraDeRatio) {
      list = list.filter(i => i.dentroDeRatio === false)
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      list = list.filter(i =>
        i.sku.toLowerCase().includes(q) ||
        i.descripcion.toLowerCase().includes(q) ||
        i.tienda.includes(q) ||
        i.nombreTienda.toLowerCase().includes(q) ||
        i.seccion.toLowerCase().includes(q) ||
        (i.departamento && i.departamento.toLowerCase().includes(q))
      )
    }

    return list
  }, [itemsCruzados, tiendaFiltro, seccionFiltro, soloFueraDeRatio, busqueda])

  // Productos donde MERMA > VENTA
  const productosMermaMayorQueVenta = useMemo(() => {
    return itemsFiltrados.filter(i => i.mermaMayorQueVenta && i.mermaSoles > 0)
  }, [itemsFiltrados])

  // Métricas Consolidadas
  const metricas = useMemo(() => {
    const totalMerma = itemsFiltrados.reduce((acc, i) => acc + i.mermaSoles, 0)
    const totalUnidadesMerma = itemsFiltrados.reduce((acc, i) => acc + (i.unidadesMerma || 0), 0)
    const totalVenta = itemsFiltrados.reduce((acc, i) => acc + i.ventaSoles, 0)
    const ratioGlobal = totalVenta > 0 ? (totalMerma / totalVenta) * 100 : 0
    const metaGlobal = db?.metaZonaB || 4.84
    const cumpleMetaGlobal = totalVenta > 0 ? ratioGlobal <= metaGlobal : true

    // Ranking por Tienda
    const tiendaMap: Record<string, { merma: number; unidades: number; venta: number; count: number; nombre: string; lider: string }> = {}

    TIENDAS_ZONA_B_INFO.forEach(t => {
      tiendaMap[t.codigo] = {
        merma: 0,
        unidades: 0,
        venta: 0,
        count: 0,
        nombre: t.nombre.split(' - ')[1] || t.nombre,
        lider: t.lider
      }
    })

    itemsFiltrados.forEach(i => {
      const cod = i.tienda || '103'
      if (!tiendaMap[cod]) {
        tiendaMap[cod] = {
          merma: 0,
          unidades: 0,
          venta: 0,
          count: 0,
          nombre: i.nombreTienda || `Tienda ${cod}`,
          lider: 'Líder Zona B'
        }
      }
      tiendaMap[cod].merma += i.mermaSoles
      tiendaMap[cod].unidades += i.unidadesMerma || 0
      tiendaMap[cod].venta += i.ventaSoles
      tiendaMap[cod].count += 1
    })

    const rankingTiendas = Object.entries(tiendaMap).map(([codigo, val]) => {
      const tieneVenta = val.venta > 0
      const ratio = tieneVenta ? (val.merma / val.venta) * 100 : 0
      // Buscar objetivo específico de tienda si existe
      const objTienda = db?.objetivos.find(o => o.tienda === codigo)
      const meta = objTienda ? objTienda.metaRatio : metaGlobal
      const cumple = tieneVenta ? (ratio <= meta) : null
      const desvio = tieneVenta ? (ratio - meta) : 0
      const mermaPresupuestada = (val.venta * meta) / 100
      const impactoSoles = val.merma - mermaPresupuestada

      return {
        codigo,
        nombre: val.nombre,
        lider: val.lider,
        merma: val.merma,
        unidades: val.unidades,
        venta: val.venta,
        tieneVenta,
        ratio,
        meta,
        cumple,
        desvio,
        impactoSoles: impactoSoles > 0 ? impactoSoles : 0
      }
    }).sort((a, b) => {
      if (a.ratio !== b.ratio && a.ratio > 0 && b.ratio > 0) return a.ratio - b.ratio
      return b.merma - a.merma
    })

    // Ranking por Jerarquía / Sección
    const seccionMap: Record<string, { merma: number; unidades: number; venta: number; count: number }> = {}
    itemsFiltrados.forEach(i => {
      const sec = i.seccion || 'GENERAL'
      if (!seccionMap[sec]) seccionMap[sec] = { merma: 0, unidades: 0, venta: 0, count: 0 }
      seccionMap[sec].merma += i.mermaSoles
      seccionMap[sec].unidades += i.unidadesMerma || 0
      seccionMap[sec].venta += i.ventaSoles
      seccionMap[sec].count += 1
    })

    const rankingJerarquias = Object.entries(seccionMap).map(([jerarquia, val]) => {
      const tieneVenta = val.venta > 0
      const ratio = tieneVenta ? (val.merma / val.venta) * 100 : 0
      const objJerarquia = db?.objetivos.find(o => o.jerarquia.toUpperCase() === jerarquia.toUpperCase())
      const meta = objJerarquia ? objJerarquia.metaRatio : metaGlobal
      const cumple = tieneVenta ? (ratio <= meta) : null
      const desvio = tieneVenta ? (ratio - meta) : 0
      const impactoSoles = val.merma - (val.venta * meta) / 100

      return {
        jerarquia,
        merma: val.merma,
        unidades: val.unidades,
        venta: val.venta,
        tieneVenta,
        ratio,
        meta,
        cumple,
        desvio,
        impactoSoles: impactoSoles > 0 ? impactoSoles : 0,
        count: val.count
      }
    }).sort((a, b) => b.merma - a.merma)

    return {
      totalMerma,
      totalUnidadesMerma,
      totalVenta,
      ratioGlobal,
      metaGlobal,
      cumpleMetaGlobal,
      rankingTiendas,
      rankingJerarquias,
      totalSkusCriticos: productosMermaMayorQueVenta.length
    }
  }, [itemsFiltrados, db, productosMermaMayorQueVenta])

  // Secciones únicas
  const listaSecciones = useMemo(() => {
    const set = new Set<string>()
    itemsCruzados.forEach(i => {
      if (i.seccion) set.add(i.seccion)
    })
    return Array.from(set).sort()
  }, [itemsCruzados])

  // Exportar reporte consolidado a Excel
  const handleExportarExcel = () => {
    if (itemsFiltrados.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const data = itemsFiltrados.map(i => ({
      'Código Tienda': i.tienda,
      'Local (Local Desc)': i.nombreTienda,
      'SKU': i.sku,
      'Descripción': i.descripcion,
      'Sección / Jerarquía': i.seccion,
      'Departamento': i.departamento || '',
      'Unidades Mermadas': i.unidadesMerma || 0,
      'Costo Unitario (S/)': i.costoUnitario ? Number(i.costoUnitario.toFixed(2)) : '',
      'Costo Extendido / Merma (S/)': i.mermaSoles,
      'Ventas (S/)': i.ventaSoles,
      '% Ratio Merma': i.ventaSoles > 0 && i.ratioMermaVenta ? `${i.ratioMermaVenta.toFixed(2)}%` : '',
      'Meta Ratio %': i.metaRatio ? `${i.metaRatio.toFixed(2)}%` : '',
      'Cumple Objetivo': i.ventaSoles === 0 ? 'SOLO MERMA' : i.dentroDeRatio ? 'EN META' : 'DESVÍO',
      'Merma > Venta': i.mermaMayorQueVenta ? 'SÍ (CRÍTICO)' : 'NO'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Analisis SKU Merma Venta')
    XLSX.writeFile(wb, `Analisis_Merma_Venta_ZonaB_${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success('Excel descargado con éxito')
  }

  // Copiar resumen WhatsApp
  const handleCopiarWsp = () => {
    let txt = `📊 *REPORTE EJECUTIVO DE MERMA Y VENTAS - ZONA B*\n`
    txt += `🎯 *Meta Presupuesto:* ${metricas.metaGlobal}%\n`
    txt += `💰 *Merma Total:* S/ ${metricas.totalMerma.toLocaleString('es-PE', { maximumFractionDigits: 0 })}\n`
    if (metricas.totalVenta > 0) {
      txt += `🛒 *Venta Total:* S/ ${metricas.totalVenta.toLocaleString('es-PE', { maximumFractionDigits: 0 })}\n`
      txt += `📈 *% Ratio Global:* ${metricas.ratioGlobal.toFixed(2)}% ${metricas.cumpleMetaGlobal ? '✅ (En Meta)' : '⚠️ (Desvío)'}\n`
    }
    txt += `🚨 *SKUs con Merma > Venta:* ${metricas.totalSkusCriticos} productos\n\n`
    txt += `📍 *Top Tiendas por Merma:*\n`
    metricas.rankingTiendas.filter(t => t.merma > 0).slice(0, 5).forEach((t, i) => {
      txt += `${i + 1}. T-${t.codigo} ${t.nombre}: S/ ${t.merma.toLocaleString('es-PE', { maximumFractionDigits: 0 })} [${t.ratio.toFixed(2)}%]\n`
    })

    navigator.clipboard.writeText(txt)
    setCopiadoWsp(true)
    toast.success('Resumen ejecutivo copiado para WhatsApp')
    setTimeout(() => setCopiadoWsp(false), 2500)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header Corporativo */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center shadow-inner shrink-0">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Reporte de Merma y Ventas
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5">
                  ZONA B (11 Tiendas)
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Análisis cruzado por SKU, día a día y evaluación de ratios por jerarquía
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopiarWsp}
              className="bg-emerald-700/80 hover:bg-emerald-700 border-emerald-600 text-white text-xs h-8 flex items-center gap-1.5"
            >
              {copiadoWsp ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiadoWsp ? 'Copiado' : 'WhatsApp'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportarExcel}
              className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 text-xs h-8 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={refrescar}
              disabled={cargando}
              className="text-slate-400 hover:text-white p-2 h-8 w-8"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Banner de Resumen de KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Merma Total S/</span>
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-red-600 mt-1">
                S/ {metricas.totalMerma.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">
                {metricas.totalUnidadesMerma.toLocaleString('es-PE')} unid. mermadas (costo extendido)
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ventas Totales S/</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                S/ {metricas.totalVenta.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {metricas.totalVenta > 0 ? 'Base cruzada con SKU' : 'Pendiente de carga de ventas'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">% Merma Global</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${metricas.totalVenta > 0 ? (metricas.cumpleMetaGlobal ? 'bg-emerald-50' : 'bg-amber-50') : 'bg-slate-100'}`}>
                  {metricas.totalVenta > 0 ? (
                    metricas.cumpleMetaGlobal ? (
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )
                  ) : (
                    <Target className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>
              <div className={`text-xl sm:text-2xl font-black mt-1 ${metricas.totalVenta > 0 ? (metricas.cumpleMetaGlobal ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-600'}`}>
                {metricas.ratioGlobal > 0 ? `${metricas.ratioGlobal.toFixed(2)}%` : 'Sin Venta'}
              </div>
              <div className="text-[10px] mt-1 font-semibold">
                {metricas.totalVenta > 0 ? (
                  metricas.cumpleMetaGlobal ? (
                    <span className="text-emerald-600">✓ En Meta (Obj: {metricas.metaGlobal}%)</span>
                  ) : (
                    <span className="text-amber-600">⚠️ Desvío (+{(metricas.ratioGlobal - metricas.metaGlobal).toFixed(2)}%)</span>
                  )
                ) : (
                  <span className="text-slate-400">Meta regional: {metricas.metaGlobal}%</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-xs bg-red-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Merma &gt; Venta</span>
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-red-700 mt-1">
                {metricas.totalSkusCriticos} SKUs
              </div>
              <div className="text-[10px] text-red-600 font-medium mt-1">
                Mercadería con pérdida mayor a venta
              </div>
            </CardContent>
          </Card>
        </div>

        {itemsCruzados.length === 0 && !cargando && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-700">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Aún no hay datos de merma guardados</h3>
            <p className="text-xs text-slate-600 max-w-lg mx-auto">
              Para visualizar el reporte y el ranking de las 11 tiendas de Zona B, debes ingresar al módulo de administración y confirmar el guardado del archivo de merma.
            </p>
            <div className="pt-1">
              <Link href="/merma">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                  Ir al Módulo de Carga (/merma)
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Pestañas de Análisis */}
        <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs gap-1">
          <button
            onClick={() => setVistaActiva('tiendas')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              vistaActiva === 'tiendas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Store className="w-4 h-4" />
            1. Ranking y Metas por Tienda
          </button>

          <button
            onClick={() => setVistaActiva('jerarquias')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              vistaActiva === 'jerarquias'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            2. Ratios por Jerarquía / Sección
          </button>

          <button
            onClick={() => setVistaActiva('merma_mayor_venta')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              vistaActiva === 'merma_mayor_venta'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 bg-red-50/50 hover:bg-red-100/50 border border-red-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            3. Alerta: Merma &gt; Venta ({productosMermaMayorQueVenta.length})
          </button>

          <button
            onClick={() => setVistaActiva('todos_skus')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              vistaActiva === 'todos_skus'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            4. Detalle Completo de SKUs ({itemsFiltrados.length})
          </button>
        </div>

        {/* Filtros Interactivos */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Tienda */}
            <select
              value={tiendaFiltro}
              onChange={(e) => setTiendaFiltro(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="todas">🏢 Todas las Tiendas (11)</option>
              {TIENDAS_ZONA_B_INFO.map(t => (
                <option key={t.codigo} value={t.codigo}>
                  {t.codigo} - {t.nombre.split(' - ')[1]}
                </option>
              ))}
            </select>

            {/* Sección */}
            {listaSecciones.length > 0 && (
              <select
                value={seccionFiltro}
                onChange={(e) => setSeccionFiltro(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value="todas">📦 Todas las Secciones</option>
                {listaSecciones.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            )}

            {/* Toggle Fuera de Ratio */}
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soloFueraDeRatio}
                onChange={(e) => setSoloFueraDeRatio(e.target.checked)}
                className="w-3.5 h-3.5 text-red-600 rounded"
              />
              <span>Mostrar solo fuera de ratio</span>
            </label>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por SKU o descripción..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* VISTA 1: RANKING Y METAS POR TIENDA */}
        {vistaActiva === 'tiendas' && (
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-5">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Evaluación de Cumplimiento de Ratio por Tienda (Zona B)</span>
                <span className="text-xs text-slate-500 font-normal">Objetivo Presupuestado: <strong>{metricas.metaGlobal}%</strong></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">Tienda / Local (Local Desc)</th>
                      <th className="p-3">Líder</th>
                      <th className="p-3 text-right">Unid. Mermadas</th>
                      <th className="p-3 text-right">Merma S/ (Costo Ext.)</th>
                      <th className="p-3 text-right">Venta S/</th>
                      <th className="p-3 text-right">Ratio Real %</th>
                      <th className="p-3 text-right">Meta %</th>
                      <th className="p-3 text-right">Desvío</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metricas.rankingTiendas.map((t, idx) => (
                      <tr key={t.codigo} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{t.nombre}</div>
                          <div className="text-[10px] text-slate-400 font-mono">T-{t.codigo}</div>
                        </td>
                        <td className="p-3 text-slate-600">{t.lider}</td>
                        <td className="p-3 text-right font-mono font-medium text-slate-700">
                          {t.unidades > 0 ? t.unidades.toLocaleString('es-PE') : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-red-600">
                          {t.merma > 0 ? `S/ ${t.merma.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-3 text-right text-slate-600 font-mono">
                          {t.venta > 0 ? `S/ ${t.venta.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {t.ratio > 0 ? (
                            <span className={t.ratio <= t.meta ? 'text-emerald-600' : 'text-rose-600'}>
                              {t.ratio.toFixed(2)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-right font-medium text-slate-500">{t.meta.toFixed(2)}%</td>
                        <td className="p-3 text-right font-semibold">
                          {t.ratio > 0 ? (
                            t.desvio <= 0 ? (
                              <span className="text-emerald-600">{t.desvio.toFixed(2)}%</span>
                            ) : (
                              <span className="text-rose-600 font-bold">+{t.desvio.toFixed(2)}%</span>
                            )
                          ) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {t.merma === 0 ? (
                            <Badge variant="outline" className="text-[10px] text-slate-400">Sin Carga</Badge>
                          ) : !t.tieneVenta ? (
                            <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">Merma Registrada</Badge>
                          ) : t.cumple ? (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">✓ En Ratio</Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 text-[10px] font-bold">⚠️ Fuera de Ratio</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VISTA 2: RATIOS POR JERARQUÍA / SECCIÓN */}
        {vistaActiva === 'jerarquias' && (
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-5">
              <CardTitle className="text-sm font-bold text-slate-900">
                Cumplimiento de Ratios por Jerarquía / Sección
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                    <tr>
                      <th className="p-3">Jerarquía / Sección</th>
                      <th className="p-3 text-right">Unid. Mermadas</th>
                      <th className="p-3 text-right">Merma S/ (Costo Ext.)</th>
                      <th className="p-3 text-right">Venta S/</th>
                      <th className="p-3 text-right">Ratio Real %</th>
                      <th className="p-3 text-right">Meta %</th>
                      <th className="p-3 text-right">Desvío %</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metricas.rankingJerarquias.map((j) => (
                      <tr key={j.jerarquia} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{j.jerarquia}</td>
                        <td className="p-3 text-right font-mono text-slate-700">
                          {j.unidades > 0 ? j.unidades.toLocaleString('es-PE') : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-red-600">
                          S/ {j.merma.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right text-slate-600 font-mono">
                          {j.venta > 0 ? `S/ ${j.venta.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {j.ratio > 0 ? `${j.ratio.toFixed(2)}%` : '-'}
                        </td>
                        <td className="p-3 text-right font-medium text-slate-500">{j.meta.toFixed(2)}%</td>
                        <td className="p-3 text-right font-semibold">
                          {j.ratio > 0 ? (
                            j.desvio <= 0 ? (
                              <span className="text-emerald-600">{j.desvio.toFixed(2)}%</span>
                            ) : (
                              <span className="text-rose-600 font-bold">+{j.desvio.toFixed(2)}%</span>
                            )
                          ) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {!j.tieneVenta ? (
                            <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">Merma Registrada</Badge>
                          ) : j.cumple ? (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">✓ En Ratio</Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 text-[10px] font-bold">⚠️ Fuera de Ratio</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VISTA 3: ALERTA CRÍTICA MERMA > VENTA */}
        {vistaActiva === 'merma_mayor_venta' && (
          <Card className="border-red-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-red-50 border-b border-red-100 py-3.5 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-red-900 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-red-600" />
                    Mercadería Crítica: SKUs donde Merma &gt; Venta ({productosMermaMayorQueVenta.length})
                  </CardTitle>
                  <p className="text-xs text-red-700 mt-0.5">
                    Productos cuya pérdida por merma supera el 100% del total vendido.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {productosMermaMayorQueVenta.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-400">
                  <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">¡Excelente! Ningún producto merma más de lo que vende.</p>
                  <p className="text-xs text-slate-400 mt-1">Todos los SKUs analizados tienen una merma inferior a sus ventas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Local (Local Desc)</th>
                        <th className="p-3">Sección</th>
                        <th className="p-3 text-right">Unid. Mermadas</th>
                        <th className="p-3 text-right">Costo Unit.</th>
                        <th className="p-3 text-right">Costo Ext. (Merma S/)</th>
                        <th className="p-3 text-right">Venta S/</th>
                        <th className="p-3 text-right">Exceso Pérdida S/</th>
                        <th className="p-3 text-right">% Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productosMermaMayorQueVenta.slice(0, 50).map((p, idx) => (
                        <tr key={idx} className="hover:bg-red-50/40">
                          <td className="p-3 font-mono font-bold text-slate-800">{p.sku}</td>
                          <td className="p-3 font-medium text-slate-900 max-w-[200px] truncate">{p.descripcion}</td>
                          <td className="p-3 text-slate-700 font-medium">
                            <div>{p.nombreTienda}</div>
                            <div className="text-[10px] text-slate-400 font-mono">T-{p.tienda}</div>
                          </td>
                          <td className="p-3 text-slate-500">{p.seccion}</td>
                          <td className="p-3 text-right font-mono text-slate-700">
                            {p.unidadesMerma > 0 ? p.unidadesMerma.toLocaleString('es-PE') : '-'}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-600">
                            {p.costoUnitario && p.costoUnitario > 0 ? `S/ ${p.costoUnitario.toFixed(2)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-bold text-red-600">
                            S/ {p.mermaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right text-slate-600 font-mono">
                            S/ {p.ventaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-black text-rose-700">
                            S/ {p.diferenciaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-black text-rose-700">
                            {p.ratioMermaVenta.toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* VISTA 4: DETALLE COMPLETO DE SKUS */}
        {vistaActiva === 'todos_skus' && (
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-5">
              <CardTitle className="text-sm font-bold text-slate-900">
                Detalle Consolidado de SKUs ({itemsFiltrados.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                    <tr>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3">Local (Local Desc)</th>
                      <th className="p-3">Sección / Jerarquía</th>
                      <th className="p-3 text-right">Unid. Mermadas</th>
                      <th className="p-3 text-right">Costo Unit.</th>
                      <th className="p-3 text-right">Costo Extendido (Merma S/)</th>
                      <th className="p-3 text-right">Venta S/</th>
                      <th className="p-3 text-right">Ratio %</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemsFiltrados.slice(0, 100).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-800">{item.sku}</td>
                        <td className="p-3 font-medium text-slate-900 max-w-[200px] truncate">{item.descripcion}</td>
                        <td className="p-3 text-slate-700 font-medium">
                          <div>{item.nombreTienda}</div>
                          <div className="text-[10px] text-slate-400 font-mono">T-{item.tienda}</div>
                        </td>
                        <td className="p-3 text-slate-500">{item.seccion}</td>
                        <td className="p-3 text-right text-slate-700 font-mono">
                          {item.unidadesMerma > 0 ? item.unidadesMerma.toLocaleString('es-PE') : '-'}
                        </td>
                        <td className="p-3 text-right text-slate-600 font-mono">
                          {item.costoUnitario && item.costoUnitario > 0 ? `S/ ${item.costoUnitario.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-red-600">
                          {item.mermaSoles > 0 ? `S/ ${item.mermaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-3 text-right text-slate-600 font-mono">
                          {item.ventaSoles > 0 ? `S/ ${item.ventaSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {item.ventaSoles > 0 && item.ratioMermaVenta > 0 ? `${item.ratioMermaVenta.toFixed(2)}%` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {item.ventaSoles === 0 ? (
                            <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50 border-slate-200">Merma Registrada</Badge>
                          ) : item.dentroDeRatio ? (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">✓ En Ratio</Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 text-[10px] font-bold">⚠️ Desvío</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
