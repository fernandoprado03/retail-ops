'use client'

import Link from 'next/link'
import { ClipboardList, Camera, BarChart3, Users, CalendarRange, Menu, FileSpreadsheet, CalendarDays, AlertTriangle, TrendingDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { PermisosUsuario, normalizarPermisos, PERMISOS_DEFAULT_ADMIN } from '@/types/permisos'

export function Navbar() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [permisos, setPermisos] = useState<PermisosUsuario | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('perfiles').select('rol, permisos').eq('id', user.id).single()
        if (data?.rol === 'admin') {
          setIsAdmin(true)
          setPermisos(PERMISOS_DEFAULT_ADMIN)
        } else {
          setPermisos(normalizarPermisos(data?.permisos, data?.rol))
        }
      }
    }
    checkUser()
  }, [])

  if (pathname === '/login' || pathname?.startsWith('/merma-zona-b')) return null

  // Si aún no cargó permisos, por defecto mostramos elementos básicos para evitar layout shift
  const canSeeKpis = isAdmin || (permisos ? permisos.kpis.ver : true)
  const canSeeHorarios = isAdmin || (permisos ? permisos.horarios_pro.ver : true)
  const canSeeMultifuncional = isAdmin || (permisos ? (permisos.malla_multifuncional?.ver ?? permisos.apoyo?.ver ?? true) : true)
  const canSeeComercial = isAdmin || (permisos ? (permisos.horario_comercial?.ver ?? true) : true)
  const canSeeBoletin = isAdmin || (permisos ? permisos.boletin_j06.ver : true)

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-8 pt-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:sticky md:top-0 md:left-0 md:h-screen ${isSidebarOpen ? 'md:w-64' : 'md:w-20'} md:bg-[#25282c] md:border-none md:pb-0 md:pt-6 md:flex md:flex-col md:text-slate-300 transition-all duration-300`}>
      <div className="max-w-md mx-auto md:max-w-none px-4 md:px-0 w-full h-full flex flex-col">
        {/* Desktop Header */}
        <div className="hidden md:flex px-6 mb-8 items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center shrink-0">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white tracking-wide text-lg whitespace-nowrap">Retail Ops</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <ul className="flex justify-around items-center h-16 md:flex-col md:items-start md:justify-start md:h-auto md:space-y-2 md:px-3 md:flex-1 overflow-x-auto gap-1">
          {canSeeMultifuncional && (
            <li className="shrink-0 md:w-full">
              <Link href="/malla-multifuncional" className={`flex flex-col items-center justify-center py-1 px-1.5 md:py-3 md:px-4 text-slate-500 hover:text-green-600 active:text-green-700 transition-colors md:flex-row md:justify-start md:rounded-lg ${pathname === '/malla-multifuncional' || pathname === '/apoyo' ? 'text-green-600 md:bg-green-600 md:text-white font-semibold' : 'md:text-slate-400 md:hover:bg-slate-800 md:hover:text-slate-200'}`}>
                <Users className={`h-5 w-5 mb-0.5 md:mb-0 shrink-0 ${pathname === '/malla-multifuncional' || pathname === '/apoyo' ? 'text-green-600 md:text-white' : ''} ${isSidebarOpen ? 'md:mr-3' : 'md:mr-0 md:mx-auto'}`} />
                <span className={`text-[9px] font-medium md:text-sm md:font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'md:w-auto md:opacity-100' : 'md:w-0 md:opacity-0 md:hidden'}`}>Multifuncional</span>
              </Link>
            </li>
          )}

          {canSeeComercial && (
            <li className="shrink-0 md:w-full">
              <Link href="/horario-comercial" className={`flex flex-col items-center justify-center py-1 px-1.5 md:py-3 md:px-4 text-slate-500 hover:text-green-600 active:text-green-700 transition-colors md:flex-row md:justify-start md:rounded-lg ${pathname === '/horario-comercial' ? 'text-green-600 md:bg-green-600 md:text-white font-semibold' : 'md:text-slate-400 md:hover:bg-slate-800 md:hover:text-slate-200'}`}>
                <CalendarDays className={`h-5 w-5 mb-0.5 md:mb-0 shrink-0 ${pathname === '/horario-comercial' ? 'text-green-600 md:text-white' : ''} ${isSidebarOpen ? 'md:mr-3' : 'md:mr-0 md:mx-auto'}`} />
                <span className={`text-[9px] font-medium md:text-sm md:font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'md:w-auto md:opacity-100' : 'md:w-0 md:opacity-0 md:hidden'}`}>H. Comercial</span>
              </Link>
            </li>
          )}

          {canSeeHorarios && (
            <li className="shrink-0 md:w-full">
              <Link href="/horarios-pro" className={`flex flex-col items-center justify-center py-1 px-1.5 md:py-3 md:px-4 text-slate-500 hover:text-green-600 active:text-green-700 transition-colors md:flex-row md:justify-start md:rounded-lg ${pathname === '/horarios-pro' ? 'text-green-600 md:bg-green-600 md:text-white font-semibold' : 'md:text-slate-400 md:hover:bg-slate-800 md:hover:text-slate-200'}`}>
                <CalendarRange className={`h-5 w-5 mb-0.5 md:mb-0 shrink-0 ${pathname === '/horarios-pro' ? 'text-green-600 md:text-white' : ''} ${isSidebarOpen ? 'md:mr-3' : 'md:mr-0 md:mx-auto'}`} />
                <span className={`text-[9px] font-medium md:text-sm md:font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'md:w-auto md:opacity-100' : 'md:w-0 md:opacity-0 md:hidden'}`}>Malla Pro</span>
              </Link>
            </li>
          )}

          {canSeeBoletin && (
            <li className="shrink-0 md:w-full">
              <Link href="/boletin-j06" className={`flex flex-col items-center justify-center py-1 px-1.5 md:py-3 md:px-4 text-slate-500 hover:text-green-600 active:text-green-700 transition-colors md:flex-row md:justify-start md:rounded-lg ${pathname === '/boletin-j06' ? 'text-green-600 md:bg-green-600 md:text-white font-semibold' : 'md:text-slate-400 md:hover:bg-slate-800 md:hover:text-slate-200'}`}>
                <FileSpreadsheet className={`h-5 w-5 mb-0.5 md:mb-0 shrink-0 ${pathname === '/boletin-j06' ? 'text-green-600 md:text-white' : ''} ${isSidebarOpen ? 'md:mr-3' : 'md:mr-0 md:mx-auto'}`} />
                <span className={`text-[9px] font-medium md:text-sm md:font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'md:w-auto md:opacity-100' : 'md:w-0 md:opacity-0 md:hidden'}`}>Boletín</span>
              </Link>
            </li>
          )}

          {canSeeKpis && (
            <li className="shrink-0 md:w-full">
              <Link href="/kpis" className={`flex flex-col items-center justify-center py-1 px-1.5 md:py-3 md:px-4 text-slate-500 hover:text-green-600 active:text-green-700 transition-colors md:flex-row md:justify-start md:rounded-lg ${pathname === '/kpis' ? 'text-green-600 md:bg-green-600 md:text-white font-semibold' : 'md:text-slate-400 md:hover:bg-slate-800 md:hover:text-slate-200'}`}>
                <BarChart3 className={`h-5 w-5 mb-0.5 md:mb-0 shrink-0 ${pathname === '/kpis' ? 'text-green-600 md:text-white' : ''} ${isSidebarOpen ? 'md:mr-3' : 'md:mr-0 md:mx-auto'}`} />
                <span className={`text-[9px] font-medium md:text-sm md:font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'md:w-auto md:opacity-100' : 'md:w-0 md:opacity-0 md:hidden'}`}>KPIs</span>
              </Link>
            </li>
          )}

          {isAdmin && (
            <li className="shrink-0 md:w-full">
              <Link href="/" className={`flex flex-col items-center justify-center py-1 px-1.5 md:py-3 md:px-4 text-slate-500 hover:text-green-600 active:text-green-700 transition-colors md:flex-row md:justify-start md:rounded-lg ${pathname === '/' ? 'text-green-600 md:bg-green-600 md:text-white font-semibold' : 'md:text-slate-400 md:hover:bg-slate-800 md:hover:text-slate-200'}`}>
                <AlertTriangle className={`h-5 w-5 mb-0.5 md:mb-0 shrink-0 ${pathname === '/' ? 'text-green-600 md:text-white' : ''} ${isSidebarOpen ? 'md:mr-3' : 'md:mr-0 md:mx-auto'}`} />
                <span className={`text-[9px] font-medium md:text-sm md:font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'md:w-auto md:opacity-100' : 'md:w-0 md:opacity-0 md:hidden'}`}>Incidencias</span>
              </Link>
            </li>
          )}

          {isAdmin && (
            <li className="shrink-0 md:w-full">
              <Link href="/merma" className={`flex flex-col items-center justify-center py-1 px-1.5 md:py-3 md:px-4 text-slate-500 hover:text-green-600 active:text-green-700 transition-colors md:flex-row md:justify-start md:rounded-lg ${pathname === '/merma' ? 'text-green-600 md:bg-green-600 md:text-white font-semibold' : 'md:text-slate-400 md:hover:bg-slate-800 md:hover:text-slate-200'}`}>
                <TrendingDown className={`h-5 w-5 mb-0.5 md:mb-0 shrink-0 ${pathname === '/merma' ? 'text-green-600 md:text-white' : ''} ${isSidebarOpen ? 'md:mr-3' : 'md:mr-0 md:mx-auto'}`} />
                <span className={`text-[9px] font-medium md:text-sm md:font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'md:w-auto md:opacity-100' : 'md:w-0 md:opacity-0 md:hidden'}`}>Merma</span>
              </Link>
            </li>
          )}

          {isAdmin && (
            <li className="shrink-0 md:w-full">
              <Link href="/admin/usuarios" className={`flex flex-col items-center justify-center py-1 px-1.5 md:py-3 md:px-4 text-slate-500 hover:text-green-600 active:text-green-700 transition-colors md:flex-row md:justify-start md:rounded-lg ${pathname === '/admin/usuarios' ? 'text-green-600 md:bg-green-600 md:text-white font-semibold' : 'md:text-slate-400 md:hover:bg-slate-800 md:hover:text-slate-200'}`}>
                <Users className={`h-5 w-5 mb-0.5 md:mb-0 shrink-0 ${pathname === '/admin/usuarios' ? 'text-green-600 md:text-white' : ''} ${isSidebarOpen ? 'md:mr-3' : 'md:mr-0 md:mx-auto'}`} />
                <span className={`text-[9px] font-medium md:text-sm md:font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'md:w-auto md:opacity-100' : 'md:w-0 md:opacity-0 md:hidden'}`}>Usuarios</span>
              </Link>
            </li>
          )}
        </ul>

        {/* User profile section at bottom for desktop */}
        <div className="hidden md:block mt-auto p-4 border-t border-slate-800 text-sm">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-slate-300" />
            </div>
            <div className={`truncate transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
              <p className="font-medium text-slate-200 truncate">{isAdmin ? 'Admin' : 'Jefe Área'}</p>
              <p className="text-xs text-slate-500 truncate">Soporte</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
