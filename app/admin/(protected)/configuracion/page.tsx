'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { AdminTableShell } from '@/components/admin/AdminTable'
import ConfigTabPanels from '@/components/admin/config/ConfigTabPanels'
import AdminConfigSaveBar from '@/components/admin/config/AdminConfigSaveBar'
import { CONFIG_TABS, Config, TabId } from '@/components/admin/config/config-ui'
import MobileConfigView from '@/components/admin/mobile/MobileConfigView'

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<Config>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [metodosPagoDetal, setMetodosPagoDetal] = useState<string[]>([])
  const [metodosPagoMayoreo, setMetodosPagoMayoreo] = useState<string[]>([])
  const [nuevoMetodoDetal, setNuevoMetodoDetal] = useState('')
  const [nuevoMetodoMayoreo, setNuevoMetodoMayoreo] = useState('')
  const [tab, setTab] = useState<TabId>('negocio')

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('configuracion').select('*')
    if (error) {
      toast.error('Error al cargar configuración')
      setLoading(false)
      return
    }

    const map: Config = {}
    data.forEach((row: { clave: string; valor: string }) => {
      map[row.clave] = row.valor
    })
    setConfig(map)

    const parseMetodos = (raw: string | undefined): string[] => {
      try {
        const parsed = JSON.parse(raw || '[]')
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    // Migración suave desde la clave antigua `metodos_pago`
    const legacy = parseMetodos(map['metodos_pago'])
    const detal = map['metodos_pago_detal'] !== undefined
      ? parseMetodos(map['metodos_pago_detal'])
      : legacy
    const mayoreo = map['metodos_pago_mayoreo'] !== undefined
      ? parseMetodos(map['metodos_pago_mayoreo'])
      : legacy

    setMetodosPagoDetal(detal)
    setMetodosPagoMayoreo(mayoreo)

    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchConfig()
  }, [fetchConfig])

  const updateConfig = (clave: string, valor: string) => {
    setConfig(prev => ({ ...prev, [clave]: valor }))
  }

  const agregarMetodoDetal = () => {
    const m = nuevoMetodoDetal.trim()
    if (!m) return
    if (metodosPagoDetal.includes(m)) {
      toast.error('Este método ya existe')
      return
    }
    setMetodosPagoDetal(prev => [...prev, m])
    setNuevoMetodoDetal('')
  }

  const quitarMetodoDetal = (metodo: string) => {
    setMetodosPagoDetal(prev => prev.filter(m => m !== metodo))
  }

  const agregarMetodoMayoreo = () => {
    const m = nuevoMetodoMayoreo.trim()
    if (!m) return
    if (metodosPagoMayoreo.includes(m)) {
      toast.error('Este método ya existe')
      return
    }
    setMetodosPagoMayoreo(prev => [...prev, m])
    setNuevoMetodoMayoreo('')
  }

  const quitarMetodoMayoreo = (metodo: string) => {
    setMetodosPagoMayoreo(prev => prev.filter(m => m !== metodo))
  }

  const handleGuardar = async () => {
    if (!config['whatsapp_numero']?.trim()) {
      toast.error('El número de WhatsApp es requerido')
      return
    }
    if (metodosPagoDetal.length === 0) {
      toast.error('Agrega al menos un método de pago para Detal')
      return
    }
    if (metodosPagoMayoreo.length === 0) {
      toast.error('Agrega al menos un método de pago para Mayorista')
      return
    }

    setSaving(true)

    const results = await Promise.all([
      ...Object.entries(config).map(([clave, valor]) =>
        supabase.from('configuracion').update({ valor }).eq('clave', clave),
      ),
      supabase.from('configuracion').upsert(
        { clave: 'metodos_pago_detal', valor: JSON.stringify(metodosPagoDetal) },
        { onConflict: 'clave' },
      ),
      supabase.from('configuracion').upsert(
        { clave: 'metodos_pago_mayoreo', valor: JSON.stringify(metodosPagoMayoreo) },
        { onConflict: 'clave' },
      ),
    ])

    const hasError = results.some(r => r.error)
    if (hasError) toast.error('Error al guardar algunos campos')
    else toast.success('Configuración guardada correctamente')

    setSaving(false)
  }

  const panelProps = {
    config,
    updateConfig,
    pagoDetal: {
      metodos: metodosPagoDetal,
      nuevo: nuevoMetodoDetal,
      setNuevo: setNuevoMetodoDetal,
      agregar: agregarMetodoDetal,
      quitar: quitarMetodoDetal,
    },
    pagoMayoreo: {
      metodos: metodosPagoMayoreo,
      nuevo: nuevoMetodoMayoreo,
      setNuevo: setNuevoMetodoMayoreo,
      agregar: agregarMetodoMayoreo,
      quitar: quitarMetodoMayoreo,
    },
  }

  if (loading) {
    return (
      <>
        <div className="hidden min-h-screen bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10 md:block">
          <div className="mb-10 flex justify-between border-b border-[rgba(232,136,181,0.16)] pb-8">
            <div>
              <div className="mb-3 h-3 w-20 animate-pulse rounded-xl bg-[var(--bg-muted)]" />
              <div className="h-9 w-64 animate-pulse rounded-xl bg-[var(--bg-muted)]" />
            </div>
          </div>
          <div className="h-80 animate-pulse rounded-xl border border-[rgba(232,136,181,0.1)] bg-[var(--bg-card)]" />
        </div>
        <div className="mobile-config-page px-4 py-5 md:hidden">
          <div className="mb-4 h-4 w-48 animate-pulse rounded bg-[var(--bg-muted)]" />
          <div className="mb-4 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-[var(--bg-card)]" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-xl bg-[var(--bg-card)]" />
        </div>
      </>
    )
  }

  return (
    <>
      <MobileConfigView
        tab={tab}
        onTabChange={setTab}
        saving={saving}
        onSave={handleGuardar}
        {...panelProps}
      />

      <div className="hidden min-h-screen bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10 md:block">
        <div className="mb-8 border-b border-[rgba(232,136,181,0.16)] pb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--accent-secondary)]" />
            <p className="text-[12px] font-bold text-[var(--accent-deep)]">
              Gestión
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-4xl">
            Configuración
          </h1>
          <p className="mt-2 text-[14px] font-medium text-[var(--text-secondary)]">
            Ajustes generales de la tienda, envíos y checkout
          </p>
        </div>

        <AdminTableShell className="overflow-hidden">
          <div className="flex flex-col">
            <nav className="grid grid-cols-2 gap-2 border-b border-[rgba(232,136,181,0.14)] bg-[color-mix(in_srgb,var(--bg-muted)_40%,var(--bg-card))] p-3 sm:grid-cols-4">
              {CONFIG_TABS.map(({ id, label, icon: Icon, desc }) => {
                const activo = tab === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`group relative flex items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition-all sm:gap-3 sm:px-3.5 sm:py-3.5 ${
                      activo
                        ? 'border-[rgba(232,136,181,0.42)] bg-[rgba(232,136,181,0.12)] shadow-[0_4px_20px_rgba(0,0,0,0.18)]'
                        : 'border-[rgba(232,136,181,0.12)] bg-[var(--bg-muted)] hover:border-[rgba(232,136,181,0.28)] hover:bg-[rgba(232,136,181,0.05)]'
                    }`}
                  >
                    {activo ? (
                      <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[var(--accent-secondary)] sm:inset-x-3.5" />
                    ) : null}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors sm:h-9 sm:w-9 ${
                        activo
                          ? 'border-[rgba(232,136,181,0.38)] bg-[rgba(232,136,181,0.18)]'
                          : 'border-[rgba(232,136,181,0.14)] bg-[rgba(232,136,181,0.06)] group-hover:border-[rgba(232,136,181,0.28)]'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={
                          activo
                            ? 'text-[var(--accent-secondary)]'
                            : 'text-[rgba(232,136,181,0.55)] group-hover:text-[var(--accent-secondary)]'
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[10px] font-light uppercase tracking-[1.2px] transition-colors sm:text-[11px] sm:tracking-[1.4px] ${
                          activo
                            ? 'text-[var(--accent-secondary)]'
                            : 'text-[var(--text-primary)] group-hover:text-[var(--accent-secondary)]'
                        }`}
                      >
                        {label}
                      </p>
                      <p className="mt-0.5 hidden text-[10px] font-light leading-snug text-[var(--text-subtle)] sm:mt-1 sm:block sm:text-[11px]">
                        {desc}
                      </p>
                    </div>
                  </button>
                )
              })}
            </nav>

            <div className="flex min-w-0 flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mobile-admin-form flex-1 space-y-8 p-6 sm:p-8"
                >
                  <ConfigTabPanels tab={tab} variant="desktop" {...panelProps} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </AdminTableShell>

        <AdminConfigSaveBar onSave={handleGuardar} saving={saving} />
      </div>
    </>
  )
}
