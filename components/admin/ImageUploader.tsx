'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { optimizeImage } from '@/lib/optimizeImage'
import { ImageIcon, X, Loader2, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'

type ImageUploaderProps = {
  imagenes: string[]
  onChange: (imagenes: string[]) => void
}

export default function ImageUploader({ imagenes, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = async (file: File): Promise<string | null> => {
    const optimized = await optimizeImage(file)
    if (!optimized.ok) {
      toast.error(optimized.message)
      return null
    }
    const toUpload = optimized.file
    const ext = toUpload.name.split('.').pop() || 'webp'
    const path = `productos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('productos')
      .upload(path, toUpload, {
        upsert: true,
        contentType: toUpload.type || 'image/webp',
      })

    if (error) return null

    const { data } = supabase.storage.from('productos').getPublicUrl(path)
    return data.publicUrl
  }

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    if (imagenes.length + arr.length > 6) {
      toast.error('Máximo 6 imágenes por producto')
      return
    }

    setUploading(true)
    const urls: string[] = []

    for (const file of arr) {
      const url = await uploadFile(file)
      if (url) urls.push(url)
    }

    if (urls.length) {
      onChange([...imagenes, ...urls])
      toast.success(`${urls.length} imagen${urls.length > 1 ? 'es' : ''} subida${urls.length > 1 ? 's' : ''}`)
    } else {
      toast.error('Error al subir imágenes')
    }
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const eliminarImagen = async (url: string) => {
    const path = url.split('/productos/')[1]
    if (path) {
      await supabase.storage.from('productos').remove([`productos/${path}`])
    }
    onChange(imagenes.filter(i => i !== url))
    toast.success('Imagen eliminada')
  }

  const moverImagen = (from: number, to: number) => {
    const arr = [...imagenes]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    onChange(arr)
  }

  return (
    <div className="space-y-3">
      <label className="admin-form-label">
        Imágenes del producto
        <span className="ml-2 normal-case tracking-normal text-[var(--text-subtle)]">
          ({imagenes.length}/6)
        </span>
      </label>

      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        {imagenes.length > 0 && (
          <div className="grid shrink-0 grid-cols-3 gap-2 sm:grid-cols-4 md:w-[9.75rem] md:grid-cols-2 md:content-start">
            <AnimatePresence>
              {imagenes.map((url, i) => (
                <motion.div
                  key={url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative aspect-square"
                >
                  <img
                    src={url}
                    alt={`Imagen ${i + 1}`}
                    className="h-full w-full rounded-lg border border-[rgba(169,137,224,0.28)] bg-white object-cover md:rounded-xl"
                  />

                  {i === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-[var(--accent-secondary)] px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[1px] text-[var(--text-on-gold)]">
                      Principal
                    </span>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-lg bg-black/55 opacity-100 md:rounded-xl md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => moverImagen(i, i - 1)}
                        className="rounded-lg bg-[rgba(169,137,224,0.92)] p-1.5 text-[var(--text-on-gold)] transition-colors hover:bg-[var(--accent-secondary)] md:rounded-xl"
                        title="Mover a principal"
                      >
                        <GripVertical size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => eliminarImagen(url)}
                      className="rounded-lg bg-[rgba(248,113,113,0.92)] p-1.5 text-white transition-colors hover:bg-red-500 md:rounded-xl"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {imagenes.length < 6 && (
          <label
            onDragOver={e => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`admin-upload-zone min-h-[10rem] md:min-h-[9.5rem] ${
              dragOver ? 'admin-upload-zone--active' : ''
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-[var(--text-muted)]">
                <Loader2 size={16} className="animate-spin text-[var(--accent-secondary)]" />
                <span className="text-[11px] tracking-[0.04em]">Subiendo imágenes...</span>
              </div>
            ) : (
              <>
                <ImageIcon size={20} className="mb-2 text-[rgba(169,137,224,0.72)]" />
                <p className="admin-upload-zone__title">
                  Arrastra imágenes aquí o{' '}
                  <span className="text-[var(--accent-secondary)]">haz clic para seleccionar</span>
                </p>
                <p className="admin-upload-zone__meta">JPG, PNG, WEBP — Máx. 5MB</p>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
    </div>
  )
}
