'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { crearIncidencia } from '@/actions/incidencias'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function NuevaIncidencia() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [areas, setAreas] = useState<any[]>([])
  const [isLoadingAreas, setIsLoadingAreas] = useState(true)
  
  useEffect(() => {
    async function fetchAreas() {
      try {
        const { data, error } = await supabase.from('areas').select('id, nombre_area').order('nombre_area')
        if (error) {
          console.error("Error fetching areas:", error)
          alert("Error conectando con la base de datos. Verifica Supabase.")
        } else if (data) {
          setAreas(data)
        }
      } catch (err) {
        console.error("Fetch error:", err)
      } finally {
        setIsLoadingAreas(false)
      }
    }
    fetchAreas()
  }, [])

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      const objectUrl = URL.createObjectURL(selectedFile)
      setPhotoPreview(objectUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) {
      alert("Debes tomar una foto de la incidencia.")
      return
    }

    const formData = new FormData(e.currentTarget)
    
    setIsUploading(true)
    setUploadProgress(10)
    
    try {
      // 1. Subir a Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `antes/${fileName}`
      
      setUploadProgress(40)
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('evidencias-supermercado')
        .upload(filePath, file)
        
      if (uploadError) {
        throw new Error(`Error subiendo imagen: ${uploadError.message}`)
      }
      
      setUploadProgress(70)
      
      const { data: { publicUrl } } = supabase.storage
        .from('evidencias-supermercado')
        .getPublicUrl(filePath)
        
      setUploadProgress(90)
      
      // 2. Guardar en Base de Datos
      formData.append('fotoUrl', publicUrl)
      
      const result = await crearIncidencia(formData)
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      setUploadProgress(100)
      
      // Simular un pequeño delay de éxito
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 500)
      
    } catch (error: any) {
      console.error(error)
      alert(error.message)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva Incidencia</h1>
        <p className="text-sm text-slate-500">Registra un nuevo hallazgo en el piso de venta.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-sm bg-white ring-1 ring-slate-100 overflow-hidden mb-6">
          <div 
            className="w-full aspect-video bg-slate-100 relative flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium flex items-center gap-2">
                    <Camera className="w-5 h-5" /> Cambiar foto
                  </span>
                </div>
              </>
            ) : (
              <div className="text-slate-400 flex flex-col items-center gap-3">
                <div className="bg-white p-4 rounded-full shadow-sm">
                  <Camera className="w-8 h-8 text-blue-500" />
                </div>
                <span className="font-medium text-slate-600">Tomar Foto (Antes)</span>
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

          <CardContent className="p-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="area">Área / Departamento</Label>
              <Select name="area_id" required>
                <SelectTrigger id="area" className="w-full bg-slate-50">
                  <SelectValue placeholder="Selecciona el área" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingAreas ? (
                    <SelectItem value="loading" disabled>Cargando áreas...</SelectItem>
                  ) : areas.length === 0 ? (
                    <SelectItem value="empty" disabled>No hay áreas disponibles</SelectItem>
                  ) : (
                    areas.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.nombre_area}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Falla</Label>
                <Select name="tipo_incidencia" required>
                  <SelectTrigger id="tipo" className="bg-slate-50">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Precios y Flejes">Precios y Flejes</SelectItem>
                    <SelectItem value="Quiebre de Stock">Quiebre de Stock</SelectItem>
                    <SelectItem value="Limpieza">Limpieza</SelectItem>
                    <SelectItem value="Merchandising">Merchandising</SelectItem>
                    <SelectItem value="Mobiliario Averiado">Mobiliario Averiado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select name="prioridad" defaultValue="Media">
                  <SelectTrigger id="prioridad" className="bg-slate-50">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">
                      <span className="flex items-center text-red-600 font-medium">Alta</span>
                    </SelectItem>
                    <SelectItem value="Media">
                      <span className="flex items-center text-yellow-600 font-medium">Media</span>
                    </SelectItem>
                    <SelectItem value="Baja">
                      <span className="flex items-center text-green-600 font-medium">Baja</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción Breve</Label>
              <Textarea 
                id="descripcion" 
                name="descripcion" 
                placeholder="Ej. Faltan precios en la cabecera de góndola..." 
                className="resize-none bg-slate-50 h-24"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={!file || isUploading} 
          className={`w-full h-14 text-lg font-medium shadow-md transition-all ${isUploading ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isUploading ? (
            <div className="w-full flex items-center justify-center gap-3">
              <Upload className="w-5 h-5 animate-bounce" />
              <span>Subiendo... {uploadProgress}%</span>
            </div>
          ) : (
            <>Generar Ticket</>
          )}
        </Button>
      </form>
    </div>
  )
}
