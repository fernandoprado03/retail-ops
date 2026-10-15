'use client'

import { useState, useEffect, useMemo } from 'react'
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
  PackageMinus
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BaseDatosMermaZonaB, ItemMerma, TIENDAS_ZONA_B_INFO } from '@/types/merma'
import { cargarBaseDatosMerma } from '@/utils/mermaStorage'
import * as XLSX from 'xlsx'

export default function MermaPublicClient() {
  const [db, setDb] = useState<BaseDatosMermaZonaB | null>(null)
  const [cargando, setCargando] = useState(true)
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('todos')
  const [tiendaFiltro, setTiendaFiltro] = useState<string>('todas')
  const [seccionFiltro, setSeccionFiltro] = useState<string>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [copiado, setCopiado] = useState(false)
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

  // Filtrado de items
  const itemsFiltrados = useMemo(() => {
    if (!db || !db.itemsConsolidados) return []
    let list = db.itemsConsolidados

    // Filtro por período / lote
    if (periodoSeleccionado !== 'todos') {
      const lote = db.lotes.find(l => l.id === periodoSeleccionado)
      if (lote) {
        list = lote.items
      }
    }

    // Filtro por tienda
    if (tiendaFiltro !== 'todas') {
      list = list.filter(i => i.tienda === tiendaFiltro)
    }

    // Filtro por sección
    if (seccionFiltro !== 'todas') {
      list = list.filter(i => (i.seccion || 'General').toLowerCase() === seccionFiltro.toLowerCase())
    }

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      list = list.filter(i => 
        (i.nombreTienda && i.nombreTienda.toLowerCase().includes(q)) ||
        (i.tienda && i.tienda.includes(q)) ||
        (i.seccion && i.seccion.toLowerCase().includes(q)) ||
        (i.motivo && i.motivo.toLowerCase().includes(q)) ||
        (i.descripcion && i.descripcion.toLowerCase().includes(q)) ||
        (i.sku && i.sku.toLowerCase().includes(q))
      )
    }

    return list
  }, [db, periodoSeleccionado, tiendaFiltro, seccionFiltro, busqueda])

  // Métricas agregadas
  const metricas = useMemo(() => {
    const totalMerma = itemsFiltrados.reduce((acc, i) => acc + i.mermaSoles, 0)
    const totalVenta = itemsFiltrados.reduce((acc, i) => acc + (i.ventaSoles || 0), 0)
    const ratioMerma = totalVenta > 0 ? (totalMerma / totalVenta) * 100 : 0
    const meta = db?.metaZonaB || 4.84
    const cumpleMeta = ratioMerma <= meta

    // Agrupación por Tienda
    const porTiendaMap: Record<string, { merma: number; venta: number; count: number; nombre: string; lider: string }> = {}

    // Inicializar las 11 tiendas oficiales de Zona B
    TIENDAS_ZONA_B_INFO.forEach(t => {
      porTiendaMap[t.codigo] = {
        merma: 0,
        venta: 0,
        count: 0,
        nombre: t.nombre.split(' - ')[1] || t.nombre,
        lider: t.lider
      }
    })

    // Sumar valores
    itemsFiltrados.forEach(i => {
      const cod = i.tienda || '103'
      if (!porTiendaMap[cod]) {
        porTiendaMap[cod] = {
          merma: 0,
          venta: 0,
          count: 0,
          nombre: i.nombreTienda || `Tienda ${cod}`,
          lider: 'Líder Zona B'
        }
      }
      porTiendaMap[cod].merma += i.mermaSoles
      porTiendaMap[cod].venta += (i.ventaSoles || 0)
      porTiendaMap[cod].count += 1
    })

    const rankingTiendas = Object.entries(porTiendaMap)
      .map(([codigo, val]) => {
        const ratio = val.venta > 0 ? (val.merma / val.venta) * 100 : 0
        return {
          codigo,
          nombre: val.nombre,
          lider: val.lider,
          merma: val.merma,
          venta: val.venta,
          count: val.count,
          ratio,
          cumple: ratio > 0 ? ratio <= meta : null
        }
      })
      .sort((a, b) => {
        // Ordenar por ratio o por merma descendente si no hay ventas
        if (a.ratio !== b.ratio && a.ratio > 0 && b.ratio > 0) return a.ratio - b.ratio
        return b.merma - a.merma
      })

    // Tiendas destacadas
    const tiendasConDatos = rankingTiendas.filter(t => t.merma > 0)
    const mejorTienda = tiendasConDatos.length > 0 ? tiendasConDatos[0] : null
    const mayorDesvio = tiendasConDatos.length > 0 ? tiendasConDatos[tiendasConDatos.length - 1] : null

    // Agrupación por Sección
    const porSeccionMap: Record<string, number> = {}
    itemsFiltrados.forEach(i => {
      const sec = i.seccion || 'General'
      porSeccionMap[sec] = (porSeccionMap[sec] || 0) + i.mermaSoles
    })
    const rankingSecciones = Object.entries(porSeccionMap)
      .map(([nombre, merma]) => ({ nombre, merma }))
      .sort((a, b) => b.merma - a.merma)

    return {
      totalMerma,
      totalVenta,
      ratioMerma,
      meta,
      cumpleMeta,
      rankingTiendas,
      rankingSecciones,
      mejorTienda,
      mayorDesvio,
      totalRegistros: itemsFiltrados.length
    }
  }, [itemsFiltrados, db])

  // Secciones únicas para el filtro
  const listaSecciones = useMemo(() => {
    if (!db?.itemsConsolidados) return []
    const set = new Set<string>()
    db.itemsConsolidados.forEach(i => {
      if (i.seccion) set.add(i.seccion)
    })
    return Array.from(set).sort()
  }, [db])

  // Copiar resumen ejecutivo para WhatsApp
  const handleCopiarWsp = () => {
    const periodoTexto = periodoSeleccionado === 'todos' 
      ? 'Acumulado Histórico (Octubre + Semanas)' 
      : (db?.lotes.find(l => l.id === periodoSeleccionado)?.nombreLote || 'Período')

    let txt = `📊 *REPORTE DE MERMA - ZONA B*\n`
    txt += `📅 *Período:* ${periodoTexto}\n`
    txt += `🎯 *Meta Zona B:* ${metricas.meta}%\n`
    txt += `💰 *Merma Total:* S/ ${metricas.totalMerma.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
    if (metricas.totalVenta > 0) {
      txt += `📈 *% Merma Real:* ${metricas.ratioMerma.toFixed(2)}% ${metricas.cumpleMeta ? '✅ (En Meta)' : '⚠️ (Desvío)'}\n`
    }
    txt += `\n📍 *Ranking por Tienda (Merma S/):*\n`
    metricas.rankingTiendas.filter(t => t.merma > 0).forEach((t, idx) => {
      const ratioTxt = t.ratio > 0 ? ` [${t.ratio.toFixed(2)}%]` : ''
      txt += `${idx + 1}. T-${t.codigo} ${t.nombre}: S/ ${t.merma.toLocaleString('es-PE', { maximumFractionDigits: 0 })}${ratioTxt}\n`
    })

    navigator.clipboard.writeText(txt)
    setCopiadoWsp(true)
    toast.success('¡Resumen para WhatsApp copiado al portapapeles!')
    setTimeout(() => setCopiadoWsp(false), 2500)
  }

  // Descargar a Excel
  const handleExportarExcel = () => {
    if (itemsFiltrados.length === 0) {
      toast.error('No hay registros para exportar')
      return
    }

    const data = itemsFiltrados.map(i => ({
      'Tienda': i.tienda,
      'Nombre Local': i.nombreTienda,
      'Sección': i.seccion || 'General',
      'Motivo': i.motivo || 'General',
      'SKU': i.sku || '',
      'Descripción': i.descripcion || '',
      'Merma (S/)': i.mermaSoles,
      'Venta (S/)': i.ventaSoles || '',
      '% Merma': i.porcentajeMerma ? `${i.porcentajeMerma.toFixed(2)}%` : '',
      'Período / Semana': i.semana || i.mes || ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Merma Zona B')
    XLSX.writeFile(wb, `Reporte_Merma_Zona_B_${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success('Archivo Excel descargado')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Barra de Encabezado Institucional */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center shadow-inner shrink-0">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Reporte Ejecutivo de Merma
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5">
                  ZONA B (11 Tiendas)
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Seguimiento consolidado mensual y acumulado semanal de tiendas Zona B
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
        {/* Banner de Estado General */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white p-5 rounded-2xl shadow-sm border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/50">
              <Sparkles className="w-3 h-3" />
              Consolidado Oficial Zona B
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Control de Merma Operativa
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Datos actualizados en línea. El objetivo presupuestado para la Zona B es de un ratio no mayor a <strong>{metricas.meta}%</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/10 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Meta Corporativa</div>
              <div className="text-xl font-black text-emerald-300">{metricas.meta}%</div>
              <div className="text-[10px] text-slate-400">Ratio sobre venta</div>
            </div>
          </div>
        </div>

        {/* Tarjetas de Resumen KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <Card className="border-slate-200/80 shadow-xs bg-white">
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
              <div className="text-[10px] text-slate-500 mt-1">
                {metricas.totalRegistros.toLocaleString()} registros procesados
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">% Merma Zona B</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${metricas.cumpleMeta ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  {metricas.cumpleMeta ? (
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
              </div>
              <div className={`text-xl sm:text-2xl font-black mt-1 ${metricas.cumpleMeta ? 'text-emerald-600' : 'text-amber-600'}`}>
                {metricas.ratioMerma > 0 ? `${metricas.ratioMerma.toFixed(2)}%` : 'Sin Venta'}
              </div>
              <div className="text-[10px] mt-1 font-medium">
                {metricas.ratioMerma > 0 ? (
                  metricas.cumpleMeta ? (
                    <span className="text-emerald-600 font-semibold">✓ En Objetivo (≤ {metricas.meta}%)</span>
                  ) : (
                    <span className="text-amber-600 font-semibold">⚠️ Desvío (+{(metricas.ratioMerma - metricas.meta).toFixed(2)}%)</span>
                  )
                ) : (
                  <span className="text-slate-400">Meta: {metricas.meta}%</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mejor Control</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Store className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">
                {metricas.mejorTienda ? `T-${metricas.mejorTienda.codigo} ${metricas.mejorTienda.nombre}` : 'Sin datos'}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                {metricas.mejorTienda ? `S/ ${metricas.mejorTienda.merma.toLocaleString('es-PE', { maximumFractionDigits: 0 })}` : '-'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mayor Volumen</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                  <PackageMinus className="w-4 h-4 text-rose-600" />
                </div>
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">
                {metricas.mayorDesvio ? `T-${metricas.mayorDesvio.codigo} ${metricas.mayorDesvio.nombre}` : 'Sin datos'}
              </div>
              <div className="text-[10px] text-rose-600 font-semibold mt-1">
                {metricas.mayorDesvio ? `S/ ${metricas.mayorDesvio.merma.toLocaleString('es-PE', { maximumFractionDigits: 0 })}` : '-'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros Interactivos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Selector de Período / Lote */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={periodoSeleccionado}
                onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-emerald-600"
              >
                <option value="todos">📅 Acumulado Total (Todos)</option>
                {db?.lotes.map((lote) => (
                  <option key={lote.id} value={lote.id}>
                    {lote.nombreLote} ({lote.tipo === 'mes' ? 'Mes' : 'Semana'})
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Tienda */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Store className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={tiendaFiltro}
                onChange={(e) => setTiendaFiltro(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-emerald-600"
              >
                <option value="todas">🏢 Todas las Tiendas (11)</option>
                {TIENDAS_ZONA_B_INFO.map((t) => (
                  <option key={t.codigo} value={t.codigo}>
                    {t.codigo} - {t.nombre.split(' - ')[1]}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Sección si hay disponibles */}
            {listaSecciones.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={seccionFiltro}
                  onChange={(e) => setSeccionFiltro(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-emerald-600"
                >
                  <option value="todas">📦 Todas las Secciones</option>
                  {listaSecciones.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Barra de búsqueda */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar tienda, motivo..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-emerald-600"
            />
          </div>
        </div>

        {/* Tabla Comparativa de las 11 Tiendas Zona B */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                Desempeño y Comparativa por Tienda (Zona B)
              </CardTitle>
              <span className="text-xs text-slate-500 font-medium">
                Meta establecida: <strong>{metricas.meta}%</strong>
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Tienda / Local</th>
                    <th className="p-3">Líder Responsable</th>
                    <th className="p-3 text-right">Merma S/</th>
                    <th className="p-3 text-right">Venta S/</th>
                    <th className="p-3 text-right">% Merma</th>
                    <th className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metricas.rankingTiendas.map((t, idx) => (
                    <tr key={t.codigo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{t.nombre}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Código {t.codigo}</div>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {t.lider}
                      </td>
                      <td className="p-3 text-right font-bold text-red-600">
                        {t.merma > 0 
                          ? `S/ ${t.merma.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : <span className="text-slate-300 font-normal">S/ 0.00</span>}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {t.venta > 0 
                          ? `S/ ${t.venta.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : <span className="text-slate-300 font-normal">-</span>}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {t.ratio > 0 ? (
                          <span className={t.ratio <= metricas.meta ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                            {t.ratio.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {t.merma === 0 ? (
                          <Badge variant="outline" className="bg-slate-50 text-slate-400 text-[10px]">
                            Sin carga
                          </Badge>
                        ) : t.cumple ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
                            ✓ En Objetivo
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-semibold">
                            Alerta Desvío
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Sección de desglose por área / rubro */}
        {metricas.rankingSecciones.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  Merma por Sección / Rubro
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {metricas.rankingSecciones.slice(0, 7).map((sec) => {
                  const pct = metricas.totalMerma > 0 ? (sec.merma / metricas.totalMerma) * 100 : 0
                  return (
                    <div key={sec.nombre} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-800">{sec.nombre}</span>
                        <span className="font-bold text-red-600">
                          S/ {sec.merma.toLocaleString('es-PE', { maximumFractionDigits: 0 })} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Detalle del Histórico de Cargas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Este reporte agrupa la base inicial de Octubre y se va sumando semanalmente desde la consola administrativa principal de Retail Ops.
                  </p>
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Períodos:</span>
                      <span className="font-bold text-slate-800">{db?.lotes.length || 0} lote(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Última Actualización:</span>
                      <span className="font-medium text-slate-700">
                        {db?.ultimaActualizacion ? new Date(db.ultimaActualizacion).toLocaleString('es-PE') : 'Sin registros'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Acceso:</span>
                      <span className="font-semibold text-emerald-700">Público y libre</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
