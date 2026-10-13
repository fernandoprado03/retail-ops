'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  CalendarDays,
  Download,
  Plus,
  Trash2,
  Search,
  Copy,
  Check,
  Save,
  Filter,
  Eye,
  Lock,
  RotateCcw,
  Sparkles,
  ClipboardPaste,
  Building2,
  Users,
  ChevronRight,
  Info,
  X
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { createClient } from '@/utils/supabase/client'
import { normalizarPermisos } from '@/types/permisos'

// Definición de días para la plantilla (2 semanas / 16 días según el formato comercial)
export interface DiaColumna {
  id: string
  diaNombre: string // lunes, martes, ...
  fechaStr: string  // 04-may, 05-may, ...
}

export const DIAS_DEFAULT: DiaColumna[] = [
  { id: 'd01', diaNombre: 'lunes', fechaStr: '04-may' },
  { id: 'd02', diaNombre: 'martes', fechaStr: '05-may' },
  { id: 'd03', diaNombre: 'miércoles', fechaStr: '06-may' },
  { id: 'd04', diaNombre: 'jueves', fechaStr: '07-may' },
  { id: 'd05', diaNombre: 'viernes', fechaStr: '08-may' },
  { id: 'd06', diaNombre: 'sábado', fechaStr: '09-may' },
  { id: 'd07', diaNombre: 'domingo', fechaStr: '10-may' },
  { id: 'd08', diaNombre: 'lunes', fechaStr: '11-may' },
  { id: 'd09', diaNombre: 'martes', fechaStr: '12-may' },
  { id: 'd10', diaNombre: 'miércoles', fechaStr: '13-may' },
  { id: 'd11', diaNombre: 'jueves', fechaStr: '14-may' },
  { id: 'd12', diaNombre: 'viernes', fechaStr: '15-may' },
  { id: 'd13', diaNombre: 'sábado', fechaStr: '16-may' },
  { id: 'd14', diaNombre: 'domingo', fechaStr: '17-may' },
  { id: 'd15', diaNombre: 'lunes', fechaStr: '18-may' },
  { id: 'd16', diaNombre: 'martes', fechaStr: '19-may' },
]

export interface FilaColaborador {
  id: string
  colaborador: string
  pasillo: string
  turnos: Record<string, string> // key: diaId ('d01', 'd02', etc.)
}

// Datos iniciales fieles a la captura de Cusco 357
export const COLABORADORES_CUSCO_357: FilaColaborador[] = [
  {
    id: 'c01',
    colaborador: 'Apaza Valverde Dave Eduardo',
    pasillo: 'Bodega',
    turnos: {
      d01: '08:30 - 17:30',
      d02: '06:15-15:15',
      d03: '06:15-15:15',
      d04: '06:15-15:15',
      d05: '06:15-15:15',
      d06: 'LIBRE',
      d07: '06:15-15:15',
      d08: '06:15-15:15',
      d09: '06:15-15:15',
      d10: '06:15-15:15',
      d11: '06:15-15:15',
      d12: '06:15-15:15',
      d13: '06:15-15:15',
      d14: 'LIBRE',
      d15: '06:15-15:15',
      d16: '06:15-15:15'
    }
  },
  {
    id: 'c02',
    colaborador: 'Anccasi Laurente Alex Paolo',
    pasillo: 'Bodega',
    turnos: {
      d01: '07:00 - 18:00',
      d02: '06:15-15:15',
      d03: 'LIBRE',
      d04: '07:00 - 18:00',
      d05: '07:00 - 16:00',
      d06: '11:00 - 20:00',
      d07: '11:00 - 20:00',
      d08: '07:00 - 16:00',
      d09: '07:00 - 16:00',
      d10: 'LIBRE',
      d11: '07:00 - 16:00',
      d12: '07:00 - 16:00',
      d13: '07:00 - 18:00',
      d14: '07:00 - 16:00',
      d15: '07:00 - 16:00',
      d16: '07:00 - 18:00'
    }
  },
  {
    id: 'c03',
    colaborador: 'Condori Nina Hugo',
    pasillo: 'Decoración / Ambientación - Textil Hogar - Organizadores',
    turnos: {
      d01: '13:30 - 22:30',
      d02: '13:30 - 22:30',
      d03: '13:30 - 22:30',
      d04: 'LIBRE',
      d05: '06:15-15:15',
      d06: '06:15-15:15',
      d07: '06:15-15:15',
      d08: '06:15-15:15',
      d09: '06:15-15:15',
      d10: '06:15-15:15',
      d11: 'LIBRE',
      d12: '13:30 - 22:30',
      d13: '13:30 - 22:30',
      d14: '13:30 - 22:30',
      d15: '13:30 - 22:30',
      d16: '13:30 - 22:30'
    }
  },
  {
    id: 'c04',
    colaborador: 'Neyra Andrade Pocho Adriel',
    pasillo: 'Menaje',
    turnos: {
      d01: '06:15-15:15',
      d02: '06:15-15:15',
      d03: '06:15-15:15',
      d04: '06:15-15:15',
      d05: 'LIBRE',
      d06: '13:30 - 22:30',
      d07: '13:30 - 22:30',
      d08: '13:30 - 22:30',
      d09: '13:30 - 22:30',
      d10: '13:30 - 22:30',
      d11: '13:30 - 22:30',
      d12: 'LIBRE',
      d13: '06:15-15:15',
      d14: '06:15-15:15',
      d15: '06:15-15:15',
      d16: '06:15-15:15'
    }
  },
  {
    id: 'c05',
    colaborador: 'Mamani Ramos Yesica',
    pasillo: 'Juguetería',
    turnos: {
      d01: '06:15-15:15',
      d02: '06:15-15:15',
      d03: '13:30 - 22:30',
      d04: '13:30 - 22:30',
      d05: '13:30 - 22:30',
      d06: '13:30 - 22:30',
      d07: 'LIBRE',
      d08: '13:30 - 22:30',
      d09: 'LIBRE',
      d10: '06:15-15:15',
      d11: '06:15-15:15',
      d12: '06:15-15:15',
      d13: '06:15-15:15',
      d14: '06:15-15:15',
      d15: '06:15-15:15',
      d16: 'LIBRE'
    }
  },
  {
    id: 'c06',
    colaborador: 'Ptiño Casa Yeison Meison',
    pasillo: 'Librería - Cotillón - Artículos de santo',
    turnos: {
      d01: '13:30 - 22:30',
      d02: 'LIBRE',
      d03: '06:15-15:15',
      d04: '06:15-15:15',
      d05: '06:15-15:15',
      d06: '06:15-15:15',
      d07: '13:30 - 22:30',
      d08: 'LIBRE',
      d09: '13:30 - 22:30',
      d10: '13:30 - 22:30',
      d11: '13:30 - 22:30',
      d12: '13:30 - 22:30',
      d13: '13:30 - 22:30',
      d14: '13:30 - 22:30',
      d15: 'LIBRE',
      d16: '06:15-15:15'
    }
  },
  {
    id: 'c07',
    colaborador: 'Erquiño Champi Nicolás Andriu',
    pasillo: 'Regalería - Deportes - Ferretería - Maletería - Entretenimiento',
    turnos: {
      d01: '13:00 - 22:00',
      d02: '06:15-15:15',
      d03: '06:15-15:15',
      d04: '06:15-15:15',
      d05: '06:15-15:15',
      d06: '06:15-15:15',
      d07: 'LIBRE',
      d08: '13:00 - 22:00',
      d09: '13:00 - 22:00',
      d10: '13:00 - 22:00',
      d11: 'LIBRE',
      d12: '06:15-15:15',
      d13: '06:15-15:15',
      d14: '06:15-15:15',
      d15: '06:15-15:15',
      d16: '06:15-15:15'
    }
  },
  {
    id: 'c08',
    colaborador: 'Porras Joaquin Claudio',
    pasillo: 'Bodega',
    turnos: {
      d01: '13:00 - 22:00',
      d02: '08:30 - 17:30',
      d03: '06:15-15:15',
      d04: '06:15-15:15',
      d05: 'LIBRE',
      d06: '06:15-15:15',
      d07: '06:15-15:15',
      d08: '06:15-15:15',
      d09: 'LIBRE',
      d10: '13:00 - 22:00',
      d11: '13:00 - 22:00',
      d12: '13:00 - 22:00',
      d13: '13:00 - 22:00',
      d14: '13:00 - 22:00',
      d15: '13:00 - 22:00',
      d16: '13:00 - 22:00'
    }
  },
  {
    id: 'c09',
    colaborador: 'Rivera Zamora Evander',
    pasillo: 'Adultos - Juvenil',
    turnos: {
      d01: '06:15-15:15',
      d02: '06:15-15:15',
      d03: 'LIBRE',
      d04: '13:00 - 22:00',
      d05: '13:00 - 22:00',
      d06: '13:00 - 22:00',
      d07: '13:00 - 22:00',
      d08: '13:00 - 22:00',
      d09: '13:00 - 22:00',
      d10: 'LIBRE',
      d11: '06:15-15:15',
      d12: '06:15-15:15',
      d13: '06:15-15:15',
      d14: '06:15-15:15',
      d15: '06:15-15:15',
      d16: '06:15-15:15'
    }
  },
  {
    id: 'c10',
    colaborador: 'Sallo Huaranca Katherine Ruth',
    pasillo: 'Bebes - Niños - Tinos',
    turnos: {
      d01: '13:00 - 22:00',
      d02: '13:00 - 22:00',
      d03: '13:00 - 22:00',
      d04: '13:00 - 22:00',
      d05: '13:00 - 22:00',
      d06: '13:00 - 22:00',
      d07: 'LIBRE',
      d08: '06:15-15:15',
      d09: '06:15-15:15',
      d10: '06:15-15:15',
      d11: '06:15-15:15',
      d12: 'LIBRE',
      d13: '06:15-15:15',
      d14: '06:15-15:15',
      d15: '06:15-15:15',
      d16: '06:15-15:15'
    }
  },
  {
    id: 'c11',
    colaborador: 'Oviedo Jimenez Silvana Antonia',
    pasillo: 'Calzado',
    turnos: {
      d01: '13:00 - 22:00',
      d02: '13:00 - 22:00',
      d03: '13:00 - 22:00',
      d04: 'LIBRE',
      d05: '06:15-15:15',
      d06: '06:15-15:15',
      d07: '06:15-15:15',
      d08: '06:15-15:15',
      d09: '06:15-15:15',
      d10: '06:15-15:15',
      d11: 'LIBRE',
      d12: '06:15-15:15',
      d13: '13:00 - 22:00',
      d14: '13:00 - 22:00',
      d15: '13:00 - 22:00',
      d16: '13:00 - 22:00'
    }
  },
  {
    id: 'c12',
    colaborador: 'Shwyla',
    pasillo: 'Lencería - Bazar bebes',
    turnos: {}
  },
  {
    id: 'c13',
    colaborador: 'Roxana',
    pasillo: 'Caja / Apoyo',
    turnos: {}
  }
]

// Lista de pestañas inferiores idéntica a Excel
export const PESTANAS_EXCEL = [
  'Procesados',
  'No Procesados',
  'PGC',
  'Non Food',
  'Electro',
  'Actividades',
  'Vacaciones Jefes',
  'Vacaciones NF',
  'CALENDARIO'
]

// Opciones frecuentes de turnos para autocompletar
export const TURNOS_RAPIDOS = [
  '06:15-15:15',
  '07:00 - 16:00',
  '07:00 - 18:00',
  '08:30 - 17:30',
  '11:00 - 20:00',
  '13:00 - 22:00',
  '13:30 - 22:30',
  'LIBRE',
  'VAC',
  'DESCANSO'
]

// Función que asigna estilos visuales a la celda según su valor
export function getCeldaClaseEstilo(valor: string | undefined): string {
  if (!valor || !valor.trim()) return 'bg-white text-slate-400 hover:bg-slate-50'
  const v = valor.toUpperCase().trim()

  if (v.includes('LIBRE') || v.includes('DESC')) {
    return 'bg-[#bfbfbf] text-slate-900 font-bold'
  }
  if (v.includes('VAC')) {
    return 'bg-[#a9d08e] text-slate-900 font-bold'
  }
  // Turno mañana (empieza con 06, 07, 08, 09, o contiene mañ)
  if (v.startsWith('06') || v.startsWith('07') || v.startsWith('08') || v.startsWith('09') || v.includes('MAÑ')) {
    return 'bg-[#ffff00] text-black font-semibold'
  }
  // Turno tarde / cierre (empieza con 11, 12, 13, 14, 15, 16 o contiene tar)
  if (v.startsWith('11') || v.startsWith('12') || v.startsWith('13') || v.startsWith('14') || v.startsWith('15') || v.includes('TAR')) {
    return 'bg-[#00b0f0] text-black font-semibold'
  }

  return 'bg-amber-100 text-slate-800'
}

export default function HorarioComercialPage() {
  const [pestañaActiva, setPestañaActiva] = useState<string>('Procesados')
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<string>('357 - Cusco La Cultura')
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('Mayo 2026 (Semana 19 - 21)')
  
  // Datos por pestaña (guardados en estado)
  const [datosPorPestana, setDatosPorPestana] = useState<Record<string, FilaColaborador[]>>({
    'Procesados': COLABORADORES_CUSCO_357
  })

  // Permisos
  const [permisoVer, setPermisoVer] = useState<boolean>(true)
  const [permisoEditar, setPermisoEditar] = useState<boolean>(true)
  const [cargandoPermisos, setCargandoPermisos] = useState<boolean>(true)

  // Filtro de búsqueda
  const [busqueda, setBusqueda] = useState<string>('')

  // Celda activa en edición
  const [celdaEditando, setCeldaEditando] = useState<{ filaId: string; colId: string } | null>(null)
  const [valorTemp, setValorTemp] = useState<string>('')

  // Modal para pegar datos desde Excel
  const [mostrarModalPegar, setMostrarModalPegar] = useState(false)
  const [textoPegar, setTextoPegar] = useState('')

  // Carga inicial y persistencia
  useEffect(() => {
    const checkPermisos = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol, permisos')
            .eq('id', user.id)
            .single()
          
          if (perfil) {
            if (perfil.rol === 'admin') {
              setPermisoVer(true)
              setPermisoEditar(true)
            } else {
              const p = normalizarPermisos(perfil.permisos, perfil.rol)
              setPermisoVer(p.horario_comercial?.ver ?? true)
              setPermisoEditar(p.horario_comercial?.editar ?? true)
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setCargandoPermisos(false)
      }
    }
    checkPermisos()

    // Recuperar datos de localStorage si existen
    const guardado = localStorage.getItem('horario_comercial_datos_v1')
    if (guardado) {
      try {
        setDatosPorPestana(JSON.parse(guardado))
      } catch (e) {}
    }
  }, [])

  // Guardar en localStorage
  const guardarEnStorage = (nuevosDatos: Record<string, FilaColaborador[]>) => {
    setDatosPorPestana(nuevosDatos)
    localStorage.setItem('horario_comercial_datos_v1', JSON.stringify(nuevosDatos))
  }

  // Lista de colaboradores de la pestaña activa
  const colaboradoresActuales = useMemo(() => {
    return datosPorPestana[pestañaActiva] || []
  }, [datosPorPestana, pestañaActiva])

  // Filtrado
  const colaboradoresFiltrados = useMemo(() => {
    if (!busqueda.trim()) return colaboradoresActuales
    const q = busqueda.toLowerCase()
    return colaboradoresActuales.filter(
      c => c.colaborador.toLowerCase().includes(q) || c.pasillo.toLowerCase().includes(q)
    )
  }, [colaboradoresActuales, busqueda])

  // Actualizar turno de una celda
  const actualizarTurno = (filaId: string, colId: string, nuevoValor: string) => {
    if (!permisoEditar) return
    const listaActual = [...colaboradoresActuales]
    const idx = listaActual.findIndex(c => c.id === filaId)
    if (idx < 0) return

    listaActual[idx] = {
      ...listaActual[idx],
      turnos: {
        ...listaActual[idx].turnos,
        [colId]: nuevoValor.trim()
      }
    }

    const nuevosDatos = {
      ...datosPorPestana,
      [pestañaActiva]: listaActual
    }
    guardarEnStorage(nuevosDatos)
  }

  // Actualizar nombre o pasillo
  const actualizarTextoFila = (filaId: string, campo: 'colaborador' | 'pasillo', nuevoValor: string) => {
    if (!permisoEditar) return
    const listaActual = [...colaboradoresActuales]
    const idx = listaActual.findIndex(c => c.id === filaId)
    if (idx < 0) return

    listaActual[idx] = {
      ...listaActual[idx],
      [campo]: nuevoValor
    }

    const nuevosDatos = {
      ...datosPorPestana,
      [pestañaActiva]: listaActual
    }
    guardarEnStorage(nuevosDatos)
  }

  // Agregar nuevo colaborador
  const agregarColaborador = () => {
    if (!permisoEditar) return
    const nuevo: FilaColaborador = {
      id: 'c_' + Date.now(),
      colaborador: 'Nuevo Colaborador',
      pasillo: 'Pasillo',
      turnos: {}
    }
    const listaActual = [...colaboradoresActuales, nuevo]
    guardarEnStorage({
      ...datosPorPestana,
      [pestañaActiva]: listaActual
    })
    toast.success('Colaborador agregado')
  }

  // Eliminar colaborador
  const eliminarColaborador = (filaId: string) => {
    if (!permisoEditar) return
    const listaActual = colaboradoresActuales.filter(c => c.id !== filaId)
    guardarEnStorage({
      ...datosPorPestana,
      [pestañaActiva]: listaActual
    })
    toast.success('Colaborador eliminado')
  }

  // Restablecer a plantilla oficial
  const restablecerPlantilla = () => {
    if (!confirm('¿Deseas restablecer los datos de esta pestaña con la plantilla oficial de Cusco 357?')) return
    guardarEnStorage({
      ...datosPorPestana,
      [pestañaActiva]: COLABORADORES_CUSCO_357
    })
    toast.success('Plantilla restablecida con éxito')
  }

  // Procesar pegado de Excel
  const procesarPegarExcel = () => {
    if (!textoPegar.trim()) return
    const lineas = textoPegar.trim().split('\n')
    const nuevasFilas: FilaColaborador[] = []

    for (let i = 0; i < lineas.length; i++) {
      const celdas = lineas[i].split('\t').map(c => c.trim())
      if (celdas.length >= 2) {
        const colaborador = celdas[0] || 'Sin Nombre'
        const pasillo = celdas[1] || 'General'
        const turnos: Record<string, string> = {}

        // Mapear los siguientes campos a los días
        DIAS_DEFAULT.forEach((d, dIdx) => {
          const valTurno = celdas[2 + dIdx]
          if (valTurno) turnos[d.id] = valTurno
        })

        nuevasFilas.push({
          id: `paste_${Date.now()}_${i}`,
          colaborador,
          pasillo,
          turnos
        })
      }
    }

    if (nuevasFilas.length > 0) {
      guardarEnStorage({
        ...datosPorPestana,
        [pestañaActiva]: nuevasFilas
      })
      setMostrarModalPegar(false)
      setTextoPegar('')
      toast.success(`Se importaron ${nuevasFilas.length} colaboradores desde Excel`)
    } else {
      toast.error('No se detectaron datos tabulares válidos')
    }
  }

  // Exportar a Excel
  const exportarAExcel = () => {
    const wb = XLSX.utils.book_new()

    PESTANAS_EXCEL.forEach(tab => {
      const rows = datosPorPestana[tab] || (tab === 'Procesados' ? COLABORADORES_CUSCO_357 : [])
      const wsData: any[][] = []

      // Fila 1: Títulos de días
      const row1 = ['', 'Colaborador', 'PASILLO', ...DIAS_DEFAULT.map(d => d.diaNombre)]
      const row2 = ['', '', '', ...DIAS_DEFAULT.map(d => d.fechaStr)]
      wsData.push(row1)
      wsData.push(row2)

      // Filas de datos
      rows.forEach((r, idx) => {
        const row = [
          idx + 1,
          r.colaborador,
          r.pasillo,
          ...DIAS_DEFAULT.map(d => r.turnos[d.id] || '')
        ]
        wsData.push(row)
      })

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, tab.substring(0, 31))
    })

    XLSX.writeFile(wb, `Horarios_Comercial_${tiendaSeleccionada.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`)
    toast.success('Archivo Excel descargado exitosamente')
  }

  // Estadísticas del día
  const statsPorDia = useMemo(() => {
    const stats: Record<string, { mañana: number; tarde: number; libres: number }> = {}
    DIAS_DEFAULT.forEach(d => {
      stats[d.id] = { mañana: 0, tarde: 0, libres: 0 }
    })

    colaboradoresActuales.forEach(c => {
      DIAS_DEFAULT.forEach(d => {
        const val = (c.turnos[d.id] || '').toUpperCase()
        if (val.includes('LIBRE') || val.includes('DESC')) {
          stats[d.id].libres++
        } else if (val.startsWith('06') || val.startsWith('07') || val.startsWith('08') || val.startsWith('09')) {
          stats[d.id].mañana++
        } else if (val.startsWith('11') || val.startsWith('12') || val.startsWith('13') || val.startsWith('14') || val.startsWith('15')) {
          stats[d.id].tarde++
        }
      })
    })

    return stats
  }, [colaboradoresActuales])

  if (!cargandoPermisos && !permisoVer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso Restringido</h1>
        <p className="text-slate-500 max-w-md">
          Tu cuenta no tiene permisos para ver el módulo de Horario Comercial. Contacta a un Administrador en el panel de usuarios para habilitar el acceso.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      {/* Banner de solo lectura si no tiene permiso de edición */}
      {!cargandoPermisos && !permisoEditar && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-amber-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs font-medium">
              <strong>Modo Solo Lectura:</strong> Puedes consultar todos los horarios de la tienda y descargar el Excel oficial. La edición de celdas está deshabilitada por el Administrador.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 px-2 py-0.5 rounded text-amber-800 shrink-0">
            Solo Lectura
          </span>
        </div>
      )}

      {/* Cabecera Principal y Barra de Herramientas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#002060] text-white flex items-center justify-center shrink-0 shadow-md">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Horario Comercial
                </h1>
                <Badge variant="outline" className="bg-blue-50 text-[#002060] border-blue-200 font-semibold text-xs">
                  Excel Online
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>{tiendaSeleccionada}</span>
                <span>•</span>
                <span>{periodoSeleccionado}</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Autoguardado
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarModalPegar(true)}
              disabled={!permisoEditar}
              className="h-8 text-xs flex items-center gap-1.5 shadow-none border-slate-200"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-slate-500" />
              Pegar desde Excel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={restablecerPlantilla}
              disabled={!permisoEditar}
              className="h-8 text-xs flex items-center gap-1.5 shadow-none border-slate-200 text-slate-600"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer
            </Button>

            <Button
              size="sm"
              onClick={exportarAExcel}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar .xlsx Oficial
            </Button>
          </div>
        </div>

        {/* Barra de Filtro y Acciones Rápidas */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar colaborador o pasillo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full h-8 pl-9 pr-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#002060]/20 focus:border-[#002060]"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#ffff00] border border-black/20"></span>
                Mañana
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#00b0f0] border border-black/20"></span>
                Tarde
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#bfbfbf] border border-black/20"></span>
                Libre
              </span>
            </div>

            {permisoEditar && (
              <Button
                size="sm"
                onClick={agregarColaborador}
                className="h-8 text-xs bg-[#002060] hover:bg-[#001746] text-white flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Fila
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* GRILLA DE HORARIOS INTERACTIVA ESTILO EXCEL */}
      <div className="bg-white border border-slate-300 shadow-md rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-xs border-collapse select-none min-w-[1400px]">
            {/* ENCABEZADOS FIJOS ESTILO EXCEL */}
            <thead className="sticky top-0 z-20">
              {/* Fila 1: Días de la semana */}
              <tr className="bg-[#002060] text-white">
                <th className="w-10 border border-slate-700 p-2 text-center text-[10px] font-mono text-slate-300">
                  #
                </th>
                <th className="w-64 border border-slate-700 p-2 text-left font-bold text-xs uppercase tracking-wide">
                  Colaborador
                </th>
                <th className="w-56 border border-slate-700 p-2 text-left font-bold text-xs uppercase tracking-wide">
                  PASILLO
                </th>
                {DIAS_DEFAULT.map(d => (
                  <th
                    key={d.id}
                    className="w-28 border border-slate-700 p-1.5 text-center font-bold text-[11px] capitalize"
                  >
                    {d.diaNombre}
                  </th>
                ))}
                {permisoEditar && <th className="w-12 border border-slate-700 p-2 text-center text-xs">Acción</th>}
              </tr>

              {/* Fila 2: Fechas del calendario */}
              <tr className="bg-[#001a4e] text-slate-200">
                <th className="border border-slate-700 p-1 text-center text-[10px]"></th>
                <th className="border border-slate-700 p-1.5 text-left text-[11px] font-normal text-slate-300">
                  Total: {colaboradoresFiltrados.length} colaboradores
                </th>
                <th className="border border-slate-700 p-1.5 text-left text-[11px] font-normal text-slate-300">
                  Ubicación en tienda
                </th>
                {DIAS_DEFAULT.map(d => (
                  <th
                    key={d.id + '_f'}
                    className="border border-slate-700 p-1 text-center font-mono text-[10px] text-blue-200"
                  >
                    {d.fechaStr}
                  </th>
                ))}
                {permisoEditar && <th className="border border-slate-700 p-1"></th>}
              </tr>
            </thead>

            {/* CUERPO DE DATOS */}
            <tbody className="divide-y divide-slate-200">
              {colaboradoresFiltrados.map((c, filaIdx) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                  {/* Número de fila */}
                  <td className="border border-slate-200 bg-slate-100 text-center font-mono text-[10px] text-slate-500 font-semibold p-1">
                    {filaIdx + 1}
                  </td>

                  {/* Nombre Colaborador */}
                  <td className="border border-slate-200 p-1.5 font-bold text-slate-900 bg-white">
                    {permisoEditar ? (
                      <input
                        type="text"
                        value={c.colaborador}
                        onChange={e => actualizarTextoFila(c.id, 'colaborador', e.target.value)}
                        className="w-full bg-transparent border-none p-0 outline-none text-xs font-semibold focus:ring-1 focus:ring-blue-500 rounded px-1"
                      />
                    ) : (
                      <span>{c.colaborador}</span>
                    )}
                  </td>

                  {/* Pasillo / Sección */}
                  <td className="border border-slate-200 p-1.5 text-blue-800 text-[11px] font-medium bg-blue-50/20">
                    {permisoEditar ? (
                      <input
                        type="text"
                        value={c.pasillo}
                        onChange={e => actualizarTextoFila(c.id, 'pasillo', e.target.value)}
                        className="w-full bg-transparent border-none p-0 outline-none text-[11px] text-blue-900 font-medium focus:ring-1 focus:ring-blue-500 rounded px-1"
                      />
                    ) : (
                      <span>{c.pasillo}</span>
                    )}
                  </td>

                  {/* Celdas de Turnos */}
                  {DIAS_DEFAULT.map(d => {
                    const valor = c.turnos[d.id] || ''
                    const claseColor = getCeldaClaseEstilo(valor)
                    const estaEditando = celdaEditando?.filaId === c.id && celdaEditando?.colId === d.id

                    return (
                      <td
                        key={d.id}
                        onClick={() => {
                          if (permisoEditar && !estaEditando) {
                            setCeldaEditando({ filaId: c.id, colId: d.id })
                            setValorTemp(valor)
                          }
                        }}
                        className={`border border-black/20 text-center p-1 cursor-pointer transition-all relative ${claseColor} hover:ring-2 hover:ring-blue-500 hover:z-10`}
                        title="Haz clic para editar turno"
                      >
                        {estaEditando ? (
                          <div className="relative">
                            <input
                              autoFocus
                              type="text"
                              value={valorTemp}
                              onChange={e => setValorTemp(e.target.value)}
                              onBlur={() => {
                                actualizarTurno(c.id, d.id, valorTemp)
                                setCeldaEditando(null)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  actualizarTurno(c.id, d.id, valorTemp)
                                  setCeldaEditando(null)
                                } else if (e.key === 'Escape') {
                                  setCeldaEditando(null)
                                }
                              }}
                              className="w-full text-center bg-white border border-blue-600 outline-none font-bold text-xs p-1 shadow-lg rounded"
                            />
                            {/* Menú rápido flotante de sugerencias */}
                            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1 w-36 text-left max-h-48 overflow-y-auto">
                              <p className="text-[9px] font-bold text-slate-400 uppercase px-2 py-0.5">
                                Sugerencias
                              </p>
                              {TURNOS_RAPIDOS.map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onMouseDown={() => {
                                    actualizarTurno(c.id, d.id, t)
                                    setCeldaEditando(null)
                                  }}
                                  className="w-full text-left px-2 py-1 text-[10px] font-semibold hover:bg-blue-50 rounded text-slate-800"
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="block truncate text-[11px] leading-tight py-0.5">
                            {valor || '-'}
                          </span>
                        )}
                      </td>
                    )
                  })}

                  {/* Botón eliminar fila */}
                  {permisoEditar && (
                    <td className="border border-slate-200 text-center p-1 bg-white">
                      <button
                        onClick={() => eliminarColaborador(c.id)}
                        className="text-slate-300 hover:text-red-600 transition-colors p-1 rounded"
                        title="Eliminar colaborador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>

            {/* FILA DE RESUMEN Y TOTALES POR DÍA */}
            <tfoot className="bg-slate-100 font-bold sticky bottom-0 z-10 border-t-2 border-slate-400">
              {/* Turnos Mañana */}
              <tr className="bg-amber-50/80 text-amber-950 text-[10px]">
                <td colSpan={3} className="border border-slate-300 p-1.5 text-right font-bold">
                  ☀️ Turnos Mañana (Apertura)
                </td>
                {DIAS_DEFAULT.map(d => (
                  <td key={d.id + '_m'} className="border border-slate-300 p-1 text-center font-mono font-bold">
                    {statsPorDia[d.id]?.mañana || 0}
                  </td>
                ))}
                {permisoEditar && <td className="border border-slate-300"></td>}
              </tr>

              {/* Turnos Tarde */}
              <tr className="bg-blue-50/80 text-blue-950 text-[10px]">
                <td colSpan={3} className="border border-slate-300 p-1.5 text-right font-bold">
                  🌙 Turnos Tarde (Cierre)
                </td>
                {DIAS_DEFAULT.map(d => (
                  <td key={d.id + '_t'} className="border border-slate-300 p-1 text-center font-mono font-bold">
                    {statsPorDia[d.id]?.tarde || 0}
                  </td>
                ))}
                {permisoEditar && <td className="border border-slate-300"></td>}
              </tr>

              {/* Libres */}
              <tr className="bg-slate-200/80 text-slate-800 text-[10px]">
                <td colSpan={3} className="border border-slate-300 p-1.5 text-right font-bold">
                  🏖️ Colaboradores Libres
                </td>
                {DIAS_DEFAULT.map(d => (
                  <td key={d.id + '_l'} className="border border-slate-300 p-1 text-center font-mono font-bold">
                    {statsPorDia[d.id]?.libres || 0}
                  </td>
                ))}
                {permisoEditar && <td className="border border-slate-300"></td>}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* PESTAÑAS INFERIORES ESTILO EXCEL */}
        <div className="bg-slate-100 border-t border-slate-300 px-3 py-1.5 flex items-center gap-1 overflow-x-auto select-none">
          {PESTANAS_EXCEL.map(tab => {
            const esActiva = pestañaActiva === tab

            return (
              <button
                key={tab}
                onClick={() => setPestañaActiva(tab)}
                className={`px-3 py-1.5 rounded-t text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                  esActiva
                    ? tab === 'Procesados'
                      ? 'bg-[#ffff00] text-black border-amber-600 shadow-sm'
                      : tab === 'Non Food'
                      ? 'bg-[#a9d08e] text-black border-green-700 shadow-sm'
                      : 'bg-white text-[#002060] border-[#002060] shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200 border-transparent'
                }`}
              >
                <span>{tab}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* MODAL PARA PEGAR DESDE EXCEL */}
      {mostrarModalPegar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#002060] flex items-center justify-center font-bold">
                  <ClipboardPaste className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pegar Celdas desde Excel</h3>
                  <p className="text-xs text-slate-500">Copia tus filas en Excel y pégalas directamente aquí</p>
                </div>
              </div>
              <button onClick={() => setMostrarModalPegar(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Formato esperado:</strong> Columna 1: <em>Nombre Colaborador</em>, Columna 2: <em>Pasillo</em>, Columnas siguientes: <em>Turnos por día</em> separados por tabulación (el formato por defecto que genera Excel al copiar con Ctrl+C).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Texto copiado de Excel (Ctrl + V):
                </label>
                <textarea
                  rows={8}
                  value={textoPegar}
                  onChange={e => setTextoPegar(e.target.value)}
                  placeholder={`Apaza Valverde Dave Eduardo\tBodega\t08:30 - 17:30\t06:15-15:15\t06:15-15:15...`}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs font-mono outline-none focus:ring-2 focus:ring-[#002060]/20 focus:border-[#002060]"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setMostrarModalPegar(false)} className="h-9 px-4 text-xs">
                Cancelar
              </Button>
              <Button size="sm" onClick={procesarPegarExcel} className="h-9 px-5 text-xs bg-[#002060] hover:bg-[#001746] text-white">
                Importar a la Grilla
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
