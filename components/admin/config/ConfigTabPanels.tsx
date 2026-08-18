'use client'

import { Input, Textarea } from '@/components/ui/Input'
import { CopInput } from '@/components/ui/CopInput'
import {
  Truck,
  CreditCard,
  Plus,
  Store,
  MapPin,
  Globe,
  Gift,
  Sparkles,
  Package,
} from 'lucide-react'
import {
  CONFIG_MAYORISTA_MINIMO,
  CONFIG_MAYORISTA_RECOMPRA,
} from '@/lib/catalog'
import MobilePaymentMethodCard from '@/components/admin/mobile/MobilePaymentMethodCard'
import ConfigPaymentMethodsDesktop from '@/components/admin/config/ConfigPaymentMethodsDesktop'
import { MobileEmptyState } from '@/components/admin/mobile/MobileAdminPrimitives'
import {
  Config,
  FormSection,
  InfoBanner,
  PaymentMethodsControls,
  TabId,
} from '@/components/admin/config/config-ui'

export type ConfigTabPanelsProps = {
  tab: TabId
  config: Config
  updateConfig: (clave: string, valor: string) => void
  pagoDetal: PaymentMethodsControls
  pagoMayoreo: PaymentMethodsControls
  variant?: 'desktop' | 'mobile'
}

function ZoneCard({
  icon: Icon,
  title,
  subtitle,
  children,
  mobile,
}: {
  icon: typeof MapPin
  title: string
  subtitle: string
  children: React.ReactNode
  mobile?: boolean
}) {
  return (
    <div
      className={`admin-form-panel mobile-admin-field transition-colors ${mobile ? 'p-4' : 'p-5'}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[rgba(169,137,224,0.2)] bg-[rgba(169,137,224,0.1)] md:rounded-xl">
          <Icon size={16} className="text-[var(--accent-secondary)]" />
        </div>
        <div>
          <p className="text-[12px] uppercase tracking-[1px] text-[var(--text-primary)]">
            {title}
          </p>
          <p className="text-[10px] text-[var(--text-subtle)]">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function MobilePaymentGroup({
  label,
  controls,
}: {
  label: string
  controls: PaymentMethodsControls
}) {
  return (
    <>
      <FormSection title={`${label} — Métodos activos`}>
        {controls.metodos.length === 0 ? (
          <MobileEmptyState
            icon={CreditCard}
            title="Sin métodos de pago"
            description="Agrega al menos uno abajo"
          />
        ) : (
          <div className="space-y-2.5">
            {controls.metodos.map(metodo => (
              <MobilePaymentMethodCard
                key={metodo}
                metodo={metodo}
                onRemove={() => controls.quitar(metodo)}
              />
            ))}
          </div>
        )}
      </FormSection>

      <FormSection title={`${label} — Agregar método`}>
        <div className="pb-6">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-input)] bg-[var(--bg-muted)] py-1.5 pl-4 pr-1.5">
            <input
              type="text"
              value={controls.nuevo}
              onChange={e => controls.setNuevo(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  controls.agregar()
                }
              }}
              placeholder="Ej: Nequi, Bancolombia, Efectivo..."
              className="mobile-config-add-input min-h-[2.75rem] min-w-0 flex-1 border-0 bg-transparent py-2 text-[13px] font-light text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none"
            />
            <button
              type="button"
              onClick={controls.agregar}
              disabled={!controls.nuevo.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(169,137,224,0.35)] bg-[var(--accent-secondary)] text-[var(--bg-base)] transition-opacity disabled:opacity-35"
              aria-label="Agregar método"
            >
              <Plus size={17} strokeWidth={2} />
            </button>
          </div>
        </div>
      </FormSection>
    </>
  )
}

export default function ConfigTabPanels({
  tab,
  config,
  updateConfig,
  pagoDetal,
  pagoMayoreo,
  variant = 'desktop',
}: ConfigTabPanelsProps) {
  const mobile = variant === 'mobile'

  if (tab === 'negocio') {
    return (
      <>
        <InfoBanner icon={Store} compact={mobile}>
          El WhatsApp de consultas (flotante, footer, nosotros). El resumen del
          pedido del carrito siempre usa el número de pedidos (310 424 4912).
        </InfoBanner>
        <FormSection title="Datos del negocio">
          <div className={`grid grid-cols-1 gap-4 ${mobile ? '' : 'md:grid-cols-2'}`}>
            <Input
              label="Nombre del negocio"
              value={config['nombre_negocio'] || ''}
              onChange={e => updateConfig('nombre_negocio', e.target.value)}
              placeholder="lila-store"
            />
            <Input
              label="WhatsApp de consultas *"
              value={config['whatsapp_numero'] || ''}
              onChange={e => updateConfig('whatsapp_numero', e.target.value)}
              placeholder="573178928174"
              hint="Con código de país, sin espacios. Ej: 573178928174"
            />
          </div>
        </FormSection>
      </>
    )
  }

  if (tab === 'contenido') {
    return (
      <>
        <InfoBanner icon={Sparkles} compact={mobile}>
          Textos visibles en la página de inicio y la sección nosotros.
        </InfoBanner>
        <FormSection title="Hero — Página de inicio">
          <div className={`grid grid-cols-1 gap-4 ${mobile ? '' : 'lg:grid-cols-2'}`}>
            <Input
              label="Título del inicio"
              value={config['hero_titulo'] || ''}
              onChange={e => updateConfig('hero_titulo', e.target.value)}
              placeholder="Belleza y cuidado capilar"
            />
            <Input
              label="Subtítulo del inicio"
              value={config['hero_subtitulo'] || ''}
              onChange={e => updateConfig('hero_subtitulo', e.target.value)}
              placeholder="Productos profesionales para cada tipo de cabello..."
            />
          </div>
        </FormSection>
        <FormSection title="Sección Nosotros">
          <Textarea
            label="Texto descriptivo"
            value={config['texto_nosotros'] || ''}
            onChange={e => updateConfig('texto_nosotros', e.target.value)}
            placeholder="Somos lila-store, tu aliada de belleza en el Quindío. En nuestras tiendas de Armenia y Quimbaya encuentras maquillaje, skincare y cuidados con atención cercana, y también te acompañamos con asesoría y envíos a toda Colombia."
            rows={mobile ? 6 : 5}
          />
        </FormSection>
        <FormSection title="SEO — Motores de búsqueda">
          <div className={`grid grid-cols-1 gap-4 ${mobile ? '' : 'lg:grid-cols-2'}`}>
            <Textarea
              label="Meta descripción"
              value={config['seo_descripcion'] || ''}
              onChange={e => updateConfig('seo_descripcion', e.target.value)}
              placeholder="Descripción que aparece en Google y al compartir el enlace del sitio."
              rows={mobile ? 4 : 3}
              hint="Máximo recomendado: 160 caracteres"
            />
            <Input
              label="Palabras clave"
              value={config['seo_keywords'] || ''}
              onChange={e => updateConfig('seo_keywords', e.target.value)}
              placeholder="belleza, cuidado capilar, Armenia"
              hint="Separadas por comas"
            />
          </div>
        </FormSection>
      </>
    )
  }

  if (tab === 'envios') {
    return (
      <>
        <InfoBanner icon={Truck} compact={mobile}>
          Armenia usa tarifa local; el resto del país, tarifa nacional.
        </InfoBanner>
        <FormSection title="Tarifas por zona">
          <div className={`grid grid-cols-1 gap-4 ${mobile ? '' : 'sm:grid-cols-2'}`}>
            <ZoneCard icon={MapPin} title="Armenia" subtitle="Entrega local" mobile={mobile}>
              <div className="space-y-4">
                <CopInput
                  label="Costo (COP)"
                  value={config['envio_armenia'] || ''}
                  onChange={value => updateConfig('envio_armenia', value)}
                  placeholder="5.000"
                />
                <Input
                  label="Tiempo de entrega"
                  value={config['tiempo_entrega_armenia'] || ''}
                  onChange={e => updateConfig('tiempo_entrega_armenia', e.target.value)}
                  placeholder="El mismo día"
                />
              </div>
            </ZoneCard>
            <ZoneCard icon={Globe} title="Resto del país" subtitle="Envío nacional" mobile={mobile}>
              <div className="space-y-4">
                <CopInput
                  label="Costo (COP)"
                  value={config['envio_nacional'] || ''}
                  onChange={value => updateConfig('envio_nacional', value)}
                  placeholder="0"
                  hint="0 = A convenir con el cliente"
                />
                <Input
                  label="Tiempo de entrega"
                  value={config['tiempo_entrega_nacional'] || ''}
                  onChange={e => updateConfig('tiempo_entrega_nacional', e.target.value)}
                  placeholder="2 a 3 días hábiles"
                />
              </div>
            </ZoneCard>
          </div>
        </FormSection>
        <FormSection title="Promoción de envío">
          <div className={`admin-form-panel mobile-admin-field ${mobile ? 'p-4' : 'p-5'}`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[rgba(169,137,224,0.25)] bg-[rgba(169,137,224,0.12)] md:rounded-xl">
                <Gift size={16} className="text-[var(--accent-secondary)]" />
              </div>
              <div>
                <p className="text-[12px] font-light uppercase tracking-[1px] text-[var(--text-primary)]">
                  Envío gratis
                </p>
                <p className="text-[10px] font-light text-[var(--text-subtle)]">
                  Monto mínimo para aplicar
                </p>
              </div>
            </div>
            <CopInput
              label="Aplicar envío gratis desde (COP)"
              value={config['envio_gratis_desde'] || ''}
              onChange={value => updateConfig('envio_gratis_desde', value)}
              placeholder="0"
              hint="0 = Desactivado. Ej: 100.000"
            />
          </div>
        </FormSection>
        <FormSection title="Catálogo mayorista — mínimos">
          <div className={`admin-form-panel mobile-admin-field space-y-4 ${mobile ? 'p-4' : 'p-5'}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[rgba(169,137,224,0.25)] bg-[rgba(169,137,224,0.12)] md:rounded-xl">
                <Package size={16} className="text-[var(--accent-secondary)]" />
              </div>
              <div>
                <p className="text-[12px] font-light uppercase tracking-[1px] text-[var(--text-primary)]">
                  Pedido mínimo
                </p>
                <p className="text-[10px] font-light text-[var(--text-subtle)]">
                  Se valida al confirmar el pedido mayorista
                </p>
              </div>
            </div>
            <div className={`grid grid-cols-1 gap-4 ${mobile ? '' : 'sm:grid-cols-2'}`}>
              <CopInput
                label="Valor mínimo de primera compra (mayorista)"
                value={config[CONFIG_MAYORISTA_MINIMO] || ''}
                onChange={value => updateConfig(CONFIG_MAYORISTA_MINIMO, value)}
                placeholder="200.000"
                hint="Bloquea el checkout si el subtotal es menor"
              />
              <CopInput
                label="Valor sugerido de recompra (mayorista)"
                value={config[CONFIG_MAYORISTA_RECOMPRA] || ''}
                onChange={value => updateConfig(CONFIG_MAYORISTA_RECOMPRA, value)}
                placeholder="100.000"
                hint="Solo informativo. 0 = no se muestra"
              />
            </div>
          </div>
        </FormSection>
      </>
    )
  }

  return (
    <>
      <InfoBanner icon={CreditCard} compact={mobile}>
        Opciones en el paso de pago del carrito. Configura cada catálogo por
        separado y agrega al menos uno en cada uno.
      </InfoBanner>

      {mobile ? (
        <>
          <MobilePaymentGroup label="Detal" controls={pagoDetal} />
          <MobilePaymentGroup label="Mayorista" controls={pagoMayoreo} />
        </>
      ) : (
        <div className="space-y-10">
          <FormSection title="Métodos de pago — Detal">
            <ConfigPaymentMethodsDesktop controls={pagoDetal} />
          </FormSection>
          <FormSection title="Métodos de pago — Mayorista">
            <ConfigPaymentMethodsDesktop controls={pagoMayoreo} />
          </FormSection>
        </div>
      )}
    </>
  )
}
