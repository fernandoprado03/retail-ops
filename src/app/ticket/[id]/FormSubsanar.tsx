'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { subsanarIncidencia } from '@/actions/incidencias'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export default function FormSubsanar({ incidenciaId }: { incidenciaId: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPhotoPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) {
      alert("Debes tomar una foto como evidencia de la solución.")
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.append('id', incidenciaId)
    setIsUploading(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${incidenciaId}_${Date.now()}.${fileExt}`
      const filePath = `despues/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('evidencias-supermercado')
        .upload(filePath, file)
        
      if (uploadError) throw new Error(uploadError.message)
      
      const { data: { publicUrl } } = supabase.storage
        .from('evidencias-supermercado')
        .getPublicUrl(filePath)
        
      formData.append('fotoUrl', publicUrl)
      
      const result = await subsanarIncidencia(formData)
      if (!result.success) throw new Error(result.error)
      
      router.refresh()
    } catch (error: any) {
      alert(error.message)
      setIsUploading(false)
    }
  }

  return (
    <Card className="border-0 shadow-md bg-white border-t-4 border-t-blue-500 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-500" /> Resolver Incidencia
        </h3>
        <p className="text-xs text-slate-500 mt-1">Sube la evidencia fotográfica de la solución.</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div 
          className="w-full aspect-video bg-slate-100 relative flex flex-col items-center justify-center cursor-pointer border-b border-slate-100"
          onClick={() => fileInputRef.current?.click()}
        >
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-slate-400 flex flex-col items-center gap-3">
              <div className="bg-white p-4 rounded-full shadow-sm">
                <Camera className="w-8 h-8 text-blue-500" />
              </div>
              <span className="font-medium text-slate-600">Tomar Foto (Después)</span>
            </div>
          )}
        </div>
        
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handlePhotoCapture}
        />

        <CardContent className="p-5 space-y-4">
          <Textarea 
            name="comentario" 
            placeholder="Comentario sobre la solución implementada..." 
            className="resize-none bg-slate-50 min-h-[100px]"
            required
          />
          
          <Button 
            type="submit" 
            disabled={!file || isUploading} 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 shadow-md text-base"
          >
            {isUploading ? (
              <span className="flex items-center gap-2"><Upload className="w-4 h-4 animate-bounce" /> Guardando...</span>
            ) : "Enviar Solución"}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
