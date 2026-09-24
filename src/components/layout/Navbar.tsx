'use client'

import Link from 'next/link'
import { ClipboardList, Camera, BarChart3, Users } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-8 pt-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:top-0 md:bottom-auto md:border-b md:border-t-0 md:pb-0 md:pt-0">
      <div className="max-w-md mx-auto md:max-w-4xl px-4">
        <ul className="flex justify-between items-center h-16">
          <li>
            <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-green-600 active:text-green-700 transition-colors">
              <ClipboardList className="h-6 w-6 mb-1" />
              <span className="text-[10px] font-medium">Pendientes</span>
            </Link>
          </li>
          
          <li className="-mt-6">
            <Link href="/nueva" className="flex flex-col items-center justify-center">
              <div className="bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 active:bg-green-800 transition-colors">
                <Camera className="h-7 w-7" />
              </div>
              <span className="text-[10px] font-medium text-slate-700 mt-1 md:hidden">Nueva</span>
            </Link>
          </li>
          
          <li>
            <Link href="/kpis" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-green-600 active:text-green-700 transition-colors">
              <BarChart3 className="h-6 w-6 mb-1" />
              <span className="text-[10px] font-medium">KPIs</span>
            </Link>
          </li>

          {isAdmin && (
            <li>
              <Link href="/admin/usuarios" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-green-600 active:text-green-700 transition-colors">
                <Users className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-medium">Usuarios</span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}
