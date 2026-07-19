'use client'

import { CreditCard, Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { PaymentMethodsControls } from '@/components/admin/config/config-ui'

type ConfigPaymentMethodsDesktopProps = {
  controls: PaymentMethodsControls
}

export default function ConfigPaymentMethodsDesktop({
  controls,
}: ConfigPaymentMethodsDesktopProps) {
  const {
    metodos: metodosPago,
    nuevo: nuevoMetodo,
    setNuevo: setNuevoMetodo,
    agregar: agregarMetodo,
    quitar: quitarMetodo,
  } = controls
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      agregarMetodo()
    }
  }

  return (
    <div className="space-y-6">
      <div className="admin-config-pay-panel">
        <div className="admin-config-pay-panel__header">
          <div>
            <p className="admin-config-pay-panel__title">Métodos activos</p>
            <p className="admin-config-pay-panel__meta">
              {metodosPago.length === 0
                ? 'Agrega al menos uno para el checkout'
                : `${metodosPago.length} método${metodosPago.length !== 1 ? 's' : ''} en el carrito`}
            </p>
          </div>
          {metodosPago.length > 0 ? (
            <span className="admin-config-pay-panel__count">{metodosPago.length}</span>
          ) : null}
        </div>

        {metodosPago.length === 0 ? (
          <div className="admin-config-pay-empty">
            <div className="admin-config-pay-empty__icon" aria-hidden>
              <CreditCard size={22} strokeWidth={1.5} />
            </div>
            <p className="admin-config-pay-empty__title">Sin métodos de pago</p>
            <p className="admin-config-pay-empty__desc">
              Usa el formulario de abajo para agregar el primero
            </p>
          </div>
        ) : (
          <ul className="admin-config-pay-list">
            {metodosPago.map((metodo, i) => (
              <li key={metodo} className="admin-config-pay-row group">
                <span className="admin-config-pay-row__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="admin-config-pay-row__icon" aria-hidden>
                  <CreditCard size={14} strokeWidth={1.75} />
                </span>
                <span className="admin-config-pay-row__name" title={metodo}>
                  {metodo}
                </span>
                <button
                  type="button"
                  onClick={() => quitarMetodo(metodo)}
                  className="admin-config-pay-row__remove"
                  aria-label={`Quitar ${metodo}`}
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                  <span>Quitar</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="admin-config-pay-add">
        <div className="admin-config-pay-add__header">
          <p className="admin-config-pay-add__title">Agregar método</p>
          <p className="admin-config-pay-add__meta">Nequi, Bancolombia, efectivo, etc.</p>
        </div>
        <div className="admin-config-pay-add__form">
          <input
            type="text"
            value={nuevoMetodo}
            onChange={e => setNuevoMetodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Nequi, Bancolombia, Efectivo..."
            className="admin-input admin-config-pay-add__input"
          />
          <Button
            type="button"
            onClick={agregarMetodo}
            size="sm"
            disabled={!nuevoMetodo.trim()}
            className="admin-config-pay-add__btn shrink-0"
          >
            <Plus size={14} />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  )
}
