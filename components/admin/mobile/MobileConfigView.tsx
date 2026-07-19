'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Save } from 'lucide-react'
import Button from '@/components/ui/Button'
import ConfigTabPanels, { ConfigTabPanelsProps } from '@/components/admin/config/ConfigTabPanels'
import { CONFIG_TABS, TabId } from '@/components/admin/config/config-ui'

type MobileConfigViewProps = Omit<ConfigTabPanelsProps, 'variant' | 'tab'> & {
  tab: TabId
  onTabChange: (tab: TabId) => void
  saving: boolean
  onSave: () => void
}

export default function MobileConfigView({
  tab,
  onTabChange,
  saving,
  onSave,
  ...panelProps
}: MobileConfigViewProps) {
  const activeTab = CONFIG_TABS.find(t => t.id === tab)

  return (
    <div className="mobile-config-page px-4 md:hidden">
      <p className="mb-1 text-[12px] font-light leading-relaxed text-[var(--text-muted)]">
        Ajustes de tienda, envíos y checkout
      </p>
      {activeTab ? (
        <p className="mb-4 text-[11px] text-[var(--text-subtle)]">{activeTab.desc}</p>
      ) : null}

      <nav className="mb-5 -mx-4 px-4">
        <div className="mobile-config-tabs-scroll scrollbar-hide flex gap-2 overflow-x-auto pb-0.5">
          {CONFIG_TABS.map(({ id, label, icon: Icon }) => {
            const activo = tab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2.5 text-[11px] uppercase tracking-[0.7px] transition-colors ${
                  activo
                    ? 'border-[rgba(232,136,181,0.45)] bg-[rgba(232,136,181,0.14)] text-[var(--accent-primary)]'
                    : 'border-[var(--border-input)] bg-[var(--bg-card)] text-[var(--text-muted)]'
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                {label}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="mobile-config-body mobile-admin-form space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            <ConfigTabPanels tab={tab} variant="mobile" {...panelProps} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        aria-hidden
        className="h-[calc(6.75rem+env(safe-area-inset-bottom,0px))]"
      />

      <div className="mobile-config-fab pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
        <Button
          onClick={onSave}
          loading={saving}
          className="mobile-config-fab-btn pointer-events-auto !h-12 w-full max-w-[20rem] !rounded-full shadow-lg"
        >
          <Save size={15} />
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
