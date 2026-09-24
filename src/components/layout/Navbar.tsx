'use client'

import Link from 'next/link'
import { ClipboardList, Camera, BarChart3, Users } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
        if (data?.rol === 'admin') setIsAdmin(true)
      }
    }
    checkAdmin()
  }, [])

  if (pathname === '/login') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-8 pt-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:sticky md:top-0 md:left-0 md:h-screen md:w-64 md:bg-[#25282c] md:border-none md:pb-0 md:pt-6 md:flex md:flex-col md:text-slate-300">
      <div className="max-w-md mx-auto md:max-w-none px-4 md:px-0 w-full h-full flex flex-col">
        {/* Desktop Header */}
        <div className="hidden md:block px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white tracking-wide text-lg">Retail Ops</span>
          </div>
        </div>

        <ul className="flex justify-between items-center h-16 md:flex-col md:items-start md:h-auto md:space-y-1 md:px-3 md:flex-1">
          <li className="md:w-full">
            <Link href="/" className={`flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-green-600 active:text-green-700 transition-colors md:flex-row md:justify-start md:py-3 md:px-4 md:rounded-lg ${pathname === '/' ? 'md:bg-green-600 md:text-white' : 'md:text-slate-400 md:hover:bg-slate-800 md:hover:text-slate-200'}`}>
              <ClipboardList className={`h-6 w-6 mb-1 md:mb-0 md:mr-3 md:h-5 md:w-5 ${pathname === '/' ? 'md:text-white' : ''}`} />
              <span className="text-[10px] font-medium md:text-sm md:font-semibold">Pendientes</span>
            </Link>
          </li>
          
          <li className="-mt-6 md:mt-4 md:w-full md:order-first md:mb-4">
            <Link href="/nueva" className="flex flex-col items-center justify-center md:block">
              <div className="bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 active:bg-green-800 transition-colors md:rounded-md md:py-3 md:px-4 md:flex md:items-center md:justify-center md:gap-2">
                <Camera className="h-7 w-7 md:h-5 md:w-5" />
                <span className="hidden md:inline font-bold">NUEVO TICKET</span>
              </div>
              <span className="text-[10px] font-medium text-slate-700 mt-1 md:hidden">Nueva</span>
            </Link>
          </li>
          
          <li className="md:w-full">
            <Link href="/kpis" className={`flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-green-600 active:text-green-700 transition-colors md:flex-row md:justify-start md:py-3 md:px-4 md:rounded-lg ${pathname === '/kpis' ? 'md:bg-green-600 md:text-white' : 'md:text-slate-400 md:hover:bg-slate-800 md:hover:text-slate-200'}`}>
              <BarChart3 className={`h-6 w-6 mb-1 md:mb-0 md:mr-3 md:h-5 md:w-5 ${pathname === '/kpis' ? 'md:text-white' : ''}`} />
              <span className="text-[10px] font-medium md:text-sm md:font-semibold">KPIs</span>
            </Link>
          </li>

          {isAdmin && (
            <li className="md:w-full">
              <Link href="/admin/usuarios" className={`flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-green-600 active:text-green-700 transition-colors md:flex-row md:justify-start md:py-3 md:px-4 md:rounded-lg ${pathname === '/admin/usuarios' ? 'md:bg-green-600 md:text-white' : 'md:text-slate-400 md:hover:bg-slate-800 md:hover:text-slate-200'}`}>
                <Users className={`h-6 w-6 mb-1 md:mb-0 md:mr-3 md:h-5 md:w-5 ${pathname === '/admin/usuarios' ? 'md:text-white' : ''}`} />
                <span className="text-[10px] font-medium md:text-sm md:font-semibold">Usuarios</span>
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
            <div className="truncate">
              <p className="font-medium text-slate-200 truncate">{isAdmin ? 'Admin' : 'Jefe Área'}</p>
              <p className="text-xs text-slate-500 truncate">Soporte</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
