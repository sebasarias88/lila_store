'use client'

import { Save, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'

type AdminConfigSaveBarProps = {
  onSave: () => void
  saving: boolean
}

export default function AdminConfigSaveBar({ onSave, saving }: AdminConfigSaveBarProps) {
  return (
    <>
      <div aria-hidden className="hidden h-[5.5rem] md:block" />
      <div className="admin-config-save-bar pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden md:block">
        <div className="ml-64 flex justify-end px-6 pb-6 pt-2 sm:px-8 lg:px-10">
          <div className="admin-config-save-bar__panel pointer-events-auto flex items-center gap-4 sm:gap-5">
            <p className="admin-config-save-bar__hint hidden items-center gap-2 sm:flex">
              <Clock size={14} strokeWidth={1.75} />
              Un guardado aplica todos los tabs
            </p>
            <Button
              type="button"
              onClick={onSave}
              loading={saving}
              size="sm"
              className="admin-config-save-bar__btn shrink-0"
            >
              <Save size={14} />
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
