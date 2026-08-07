# Tema — lila-store

## Tema activo: claro (único)

La tienda usa un tema claro cosmético **lila-first**: fondos lavanda, acento principal lila, rosa suave como secundario y tipografía redondeada. Las variables viven en `app/globals.css` bajo `:root`.

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-base` | `#F9F6FF` | Fondo general |
| `--bg-surface` | `#FFFFFF` | Cards, paneles y modales |
| `--bg-muted` | `#F0EAFB` | Superficies secundarias |
| `--accent-primary` | `#A989E0` | Botones y estados activos |
| `--accent-secondary` | `#E8A0C8` | Badges, iconos y acentos dulces |
| `--accent-deep` | `#6E4FA8` | CTAs y precios destacados |
| `--text-primary` | `#2A2240` | Títulos y texto principal |
| `--text-muted` | `#6B6080` | Texto secundario |
| `--border` | `#E6DCF5` | Bordes |
| `--success` | `#8FD9B6` | Estados positivos |
| `--warning` | `#F4C77A` | Alertas |
| `--danger` | `#E8798A` | Errores y eliminación |

Baloo 2 se usa para títulos y marca; Nunito para cuerpo e interfaz. En componentes se deben preferir los tokens semánticos en lugar de valores hexadecimales.

No hay toggle de tema ni modo oscuro.
