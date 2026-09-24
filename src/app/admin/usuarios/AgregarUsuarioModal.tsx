'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { agregarUsuario } from '@/actions/usuarios'

export default function AgregarUsuarioModal({ areas }: { areas: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await agregarUsuario(formData)
    
    if (result.success) {
      setIsOpen(false)
    } else {
      alert(result.error)
    }
    setIsLoading(false)
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 h-9 px-4 rounded-md shadow-sm">
        <Plus className="w-4 h-4" /> Agregar Usuario
      </Button>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-xl shadow-2xl z-50 p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-slate-900">Nuevo Jefe de Área</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
            <input 
              name="nombre" 
              required 
              type="text" 
              placeholder="Ej. Juan Pérez"
              className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo (Google)</label>
            <input 
              name="email" 
              required 
              type="email" 
              placeholder="juan.perez@empresa.com"
              className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Área Asignada (Opcional)</label>
            <select 
              name="area_id" 
              className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
            >
              <option value="">-- Seleccionar Área --</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.nombre_area}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Si seleccionas un área, este usuario será el responsable de recibir sus incidencias.</p>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white h-11">
              {isLoading ? 'Guardando...' : 'Registrar y Autorizar'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
