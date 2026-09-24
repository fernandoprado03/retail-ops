import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin text-green-500 mb-4" />
      <p className="text-sm font-medium animate-pulse">Cargando información...</p>
    </div>
  )
}
