# Plan de portabilidad — Optimización + mejoras recientes

Guía para replicar en el **proyecto hermano** (tienda clonada de belleza) lo que ya estabilizamos en **tienda-vm-fashion**.

> **Prioridad #1:** bajar Cached Egress / API egress de Supabase.  
> **Prioridad #2:** portar las mejoras de checkout, WhatsApp, búsqueda, descuentos y UX.  
> **Imágenes:** si en el proyecto nuevo ya suben WebP comprimido (mismo peso/formato que acá), **no hace falta** migrar/backfill de imágenes. El bypass de `next/image` solo si en producción aparece el error `402 Payment Required` en `/_next/image`.

---

## Cómo leer este documento

| Etiqueta | Significado |
|----------|-------------|
| **OBLIGATORIO** | Hay que hacerlo si el hermano aún no lo tiene (es lo que más impacta egress o bugs reales). |
| **RECOMENDADO** | Mejora fuerte de UX / consistencia; conviene portarlo junto. |
| **OPCIONAL** | Solo si aparece el mismo síntoma (p. ej. 402 de Vercel). |
| **NO COPIAR** | Scripts one-shot o cosas ya resueltas en el hermano. |

Archivos de referencia = rutas en **este** repo (`tienda-vm-fashion`). Compáralos 1:1 con el proyecto nuevo.

---

## Parte A — Optimización (Cached Egress / API) ★ PRIORIDAD

El egress se ataca en **3 capas**. No es “una sola magia de imágenes”.

```text
1) API egress     → selects livianos + ISR + menos Auth en catálogo
2) Storage egress → imágenes ya WebP al subir (si el hermano ya lo tiene → OK)
3) Vercel images  → solo si /_next/image da 402
```

### A1. Selects livianos de productos (OBLIGATORIO)

**Problema:** listados hacían `select('*')` o joins pesados → cada card traía descripción, video, variaciones completas, etc. Eso infla PostgREST y el JSON cacheado.

**Qué implementar en el hermano:**

1. Tener (o copiar) `lib/productQueries.ts` con:
   - `PRODUCTO_CARD_COLUMNS` — columnas explícitas de card (incluye `imagenes`, precios, flags, etc.)
   - `PRODUCTO_LIST_SELECT` — catálogo paginado
   - `PRODUCTO_SHELF_SELECT` — home / relacionados
   - `PRODUCTO_DETAIL_SELECT` — PDP (puede ser más completo)
   - `withCardImagenes()` — deja solo `imagenes[0]` en memoria para cards

2. Usarlos en:
   - `lib/catalog-productos.ts` (`getCatalogProductosPage`)
   - `lib/mapShelfProductos.ts` (home / shelf)
   - `app/(catalog)/page.tsx` y equivalente mayorista
   - `app/(catalog)/productos/page.tsx` (+ mayorista)

3. En cards/UI: mostrar siempre `producto.imagenes?.[0]`, nunca el array completo en listados.

**Referencia:** `lib/productQueries.ts`, `lib/catalog-productos.ts`, `lib/mapShelfProductos.ts`

**Checklist hermano:**
- [ ] Ningún listado de catálogo usa `select('*')` en productos
- [ ] Home / relacionados usan `PRODUCTO_SHELF_SELECT` + `mapShelfProductos`
- [ ] `withCardImagenes` se aplica antes de enviar datos a las cards

---

### A2. Variaciones livianas en listados (OBLIGATORIO si hay variaciones)

**Problema:** embed completo de `variacion_tipos → opciones` en cada card = payload enorme.

**Qué hacer:**
- En listados: solo `variacion_tipos(id)` (`PRODUCTO_VARIACIONES_FLAG_EMBED`)
- Mapear a `tiene_variaciones: boolean` con `withProductoVariacionesFlag`
- Cargar opciones completas **solo en PDP**

**Referencia:** `lib/variaciones.ts`, embeds en `lib/productQueries.ts`

**Checklist:**
- [ ] Cards no traen opciones de variación
- [ ] Existe flag `tiene_variaciones` en productos de listado

---

### A3. ISR + cliente público de Supabase (OBLIGATORIO)

**Problema:** cada request al catálogo pegaba a Supabase + Auth cookies → más API calls y peor cache.

**Qué hacer:**
1. `lib/supabase-public.ts` → `createSupabasePublic()` sin sesión (`persistSession: false`)
2. Páginas/layouts de catálogo (y mayorista si aplica):
   ```ts
   export const revalidate = 60
   ```
3. Usar el cliente público en lecturas de catálogo (no el cliente con cookies de usuario)

**Referencia:** `lib/supabase-public.ts`, `app/(catalog)/layout.tsx`, páginas home/productos

**Checklist:**
- [ ] Catálogo público usa cliente sin cookies
- [ ] `revalidate = 60` (o similar) en layout/páginas de vitrina

---

### A4. Middleware solo en admin (OBLIGATORIO)

**Problema:** `getUser()` en **todas** las rutas = Auth API en cada hit del catálogo.

**Qué hacer:** matcher del middleware limitado a admin:

```ts
matcher: ['/admin', '/admin/:path*']
```

**Referencia:** `middleware.ts`

**Checklist:**
- [ ] Middleware **no** corre en `/`, `/productos`, `/carrito`, etc.

---

### A5. Paginación y filtros por IDs (OBLIGATORIO)

**Qué hacer:**
- `CATALOG_PAGE_SIZE` razonable (acá: 24)
- Filtros de categoría/búsqueda: primero IDs (`select('id')` / RPC), luego query principal con `.in('id', ...)`
- Marcas: `select('marca')` mínimo, no filas enteras

**Referencia:** `lib/catalog-productos.ts`, `lib/catalog-data.ts`

---

### A6. Compresión al subir imágenes (VERIFICAR — probablemente ya OK)

Si el hermano **ya** sube WebP ~200KB con resize:

| Acción | ¿Hacer? |
|--------|---------|
| Copiar `lib/optimizeImage.ts` + `ImageUploader` | Solo si el admin aún sube JPG/PNG pesados |
| Correr `scripts/backfill-images.ts` | **NO** si todo ya está optimizado |
| `scripts/audit-storage-images.ts` | Opcional, solo diagnóstico |

**Si hay duda:** sube 1 producto nuevo y mira en Storage el peso. Si es WebP &lt; ~300KB → capa Storage ya está bien.

Constantes de referencia (si hay que alinear):
- Max input: 5MB
- Lado máximo: 1600px
- WebP quality: ~0.82

**Referencia:** `lib/optimizeImage.ts`, `components/admin/ImageUploader.tsx`

---

### A7. Bypass de `next/image` / Vercel 402 (OPCIONAL)

**Solo si en producción ves:**

```text
GET /_next/image?url=https://....supabase.co/...  →  402 Payment Required
```

**Entonces** sí portar:
1. `next.config.ts` → `images: { unoptimized: true }`
2. `components/catalog/CatalogImage.tsx` → `<img>` nativo desde CDN Supabase
3. `HeroBanner.tsx` → mismo patrón
4. Grep: eliminar imports de `next/image` en catálogo

**Si no hay 402:** puedes dejar `next/image` **siempre que** las imágenes en Storage ya estén comprimidas. El 402 es cuota del optimizador de Vercel, no de Supabase.

**Referencia:** `next.config.ts`, `components/catalog/CatalogImage.tsx`, `components/catalog/HeroBanner.tsx`

---

### A8. Resumen rápido — qué SÍ / NO copiar de “egress imágenes”

| Pieza | ¿Copiar al hermano? |
|-------|---------------------|
| Selects lean + `withCardImagenes` | **SÍ** |
| ISR + `createSupabasePublic` | **SÍ** |
| Middleware solo `/admin` | **SÍ** |
| Upload WebP (`optimizeImage` + ImageUploader) | Solo si aún no comprime |
| `backfill-images.ts` / audit old URLs | **NO** (one-shot / hostname viejo) |
| `images.unoptimized` + `<img>` | Solo si hay 402 |

---

## Parte B — Mejoras recientes (bugs + UX)

Orden sugerido de portabilidad (dependencias reales):

```text
1. SQL unaccent
2. Types + libs (variaciones, descuentos, productQueries, productSearch, cartCheckout, whatsapp, toast)
3. Admin stock / disponible
4. Cards + precios + categorías
5. Checkout WhatsApp + pantalla éxito + mobile
6. CSS toasts / mobile cart
7. (Opcional) next/image bypass
```

---

### B1. Variantes en pedido WhatsApp (RECOMENDADO / casi OBLIGATORIO)

**Problema:** productos con tallas/colores se agregaban desde la card sin opciones → el mensaje de WhatsApp salía incompleto.

**Qué portar:**

| Pieza | Archivo referencia | Qué hace |
|-------|--------------------|----------|
| Flag en listados | `lib/variaciones.ts` → `withProductoVariacionesFlag` | `tiene_variaciones` |
| Embed liviano | `lib/productQueries.ts` | `variacion_tipos(id)` |
| Card | `ProductCard.tsx`, `ProductCardMobile.tsx` | Si tiene variaciones → ir a PDP (“Elegir opciones”), no quick-add |
| Validación carrito | `lib/cartCheckout.ts` | `findItemsSinVariaciones`, `getProductIdsWithVariaciones` |
| Checkout | `app/(catalog)/carrito/page.tsx` | Bloquear envío si faltan variaciones; precargar IDs en paso resumen |
| Mensaje | `lib/whatsapp.ts` → `generarMensajeWhatsApp` | Incluir resumen de variaciones |

**Checklist:**
- [ ] No se puede quick-add un producto con variaciones
- [ ] No se envía WhatsApp si alguna línea no tiene opciones
- [ ] El mensaje incluye color/talla/etc.

---

### B2. Búsqueda sin acentos (RECOMENDADO)

**Problema:** “mascara” no encontraba “máscara”.

**Qué portar:**
1. Correr en Supabase SQL Editor del **proyecto hermano**:
   - `scripts/setup-unaccent-search.sql`
2. `lib/productSearch.ts` → `productIdsMatchingSearch` (con fallback si el RPC no existe)
3. Integrar en `lib/catalog-productos.ts` y admin `productos/page.tsx`

**Checklist:**
- [ ] SQL ejecutado en el Supabase del hermano
- [ ] Catálogo + admin usan RPC (o fallback ilike)

---

### B3. Consistencia Agotado / disponible (RECOMENDADO)

**Problema:** flag global `disponible` vs `disponible_detal` / `disponible_mayoreo` desalineados; el form podía pisar cambios del listado.

**Qué portar:**
- `productoAgotadoEnCatalogo` en `lib/variaciones.ts`
- `ProductForm.tsx`: toggle Stock global + Detal + Mayorista; al encender catalogo → `disponible: true`; al guardar sin tocar stock → re-leer `disponible` de DB
- Admin list: toggles Stock / Detal / Mayorista
- Cards/PDP usan `productoAgotadoEnCatalogo`

**Checklist:**
- [ ] Activar Detal/Mayorista también deja stock global en true
- [ ] Editar producto no pisa un toggle hecho desde la tabla

---

### B4. Pantalla de éxito del carrito tras WhatsApp (RECOMENDADO)

**Problema:** se abría WhatsApp, al volver el carrito ya estaba vacío (o vacío + stuck en “continuar”).

**Qué portar:**
- Nuevo step `'exito'`
- Componente `components/catalog/cart/CartCheckoutSuccess.tsx`
- `handleEnviarWhatsApp` → abre WA + `setStep('exito')` **sin vaciar** aún
- Vaciar solo en “Ya envié el mensaje” (`handleConfirmarPedidoEnviado`)
- Botones: Reabrir WhatsApp / Volver al resumen / Seguir comprando
- Mobile: `CarritoMobile.tsx`, `MobileCartSteps.tsx` (ocultar stepper en éxito)

**Checklist:**
- [ ] Tras “Enviar por WhatsApp” se ve pantalla de éxito
- [ ] El carrito sigue intacto hasta confirmar envío
- [ ] Se puede reabrir WhatsApp con el mismo mensaje

---

### B5. WhatsApp mobile al primer click + padding (RECOMENDADO)

**Problema:** en móvil el primer tap no abría WA (popup bloqueado por async/`window.open`); la pantalla éxito sin padding.

**Qué portar:**
- `abrirWhatsApp` con `<a>` + `.click()` (no `window.open` diferido)
- Precargar variantes **antes** del click (en step resumen) para que el handler sea síncrono
- Padding safe-area en éxito / sticky bar (`CartCheckoutSuccess`, `CarritoMobile`, CSS `.mobile-cart-*`)

**Referencia:** `lib/whatsapp.ts`, `carrito/page.tsx`, `CarritoMobile.tsx`, `app/globals.css`

---

### B6. Toasts con nombres largos (RECOMENDADO)

**Problema:** nombres de producto reventaban el toast.

**Qué portar:**
- `lib/toastCatalog.tsx` → `toastProductoAgregado` (truncate ~40 chars)
- CSS `.app-toast-producto*` en `globals.css`
- Reemplazar `toast.success('X agregado...')` en cards/PDP

---

### B7. Descuentos de categoría con herencia del padre (RECOMENDADO si usan descuentos)

**Problema:** descuento en subcategoría (o en padre) no se veía en catálogo; productos multi-categoría solo miraban la primaria.

**Qué portar (núcleo):** `lib/descuentos.ts`
- `resolveDescuentoCategoria` (propio o hereda de `padre`)
- `resolveDescuentoProducto` (mejor % entre todas las categorías del producto)
- Embeds: `CATEGORIA_PADRE_EMBED`, `PRODUCTO_CATEGORIAS_EMBED` en queries
- UI: `ProductoPrecio`, `ProductCard*`, `CategoriasGrid`, admin `CategoriaGrupoCard`

**Checklist:**
- [ ] Descuento en padre aplica a productos de subcategorías
- [ ] Descuento directo en subcategoría también se ve
- [ ] Badge % en grid de categorías refleja el mejor descuento del grupo

---

## Parte C — Orden de trabajo sugerido (1–2 días)

### Día 1 — Optimización (lo que más te interesa)

1. Diff `middleware.ts` → solo admin  
2. Diff `lib/supabase-public.ts` + `revalidate` en layouts/páginas catálogo  
3. Portar / alinear `productQueries` + `catalog-productos` + `mapShelfProductos`  
4. Verificar que listados no traigan descripciones/variaciones completas  
5. Verificar uploads WebP (si ya OK → no tocar backfill)  
6. Build + smoke: home, listado, PDP, 1 imagen de Storage  

### Día 2 — Mejoras funcionales

1. SQL `setup-unaccent-search.sql` en Supabase del hermano  
2. Variantes: cards + `cartCheckout` + carrito  
3. Pantalla éxito + `abrirWhatsApp` mobile-safe  
4. Toasts  
5. Agotado/admin (si aplica)  
6. Descuentos con padre (si el admin ya carga %)  
7. Solo si hay 402 → bypass `next/image`  

---

## Parte D — Criterios de “ya quedó”

### Optimización
- [ ] Dashboard Supabase: API requests / Cached Egress bajan o se estabilizan tras tráfico real  
- [ ] Network tab: respuestas de listado mucho más chicas (sin `descripcion`/`video`/opciones)  
- [ ] Catálogo no dispara Auth en cada pageview  

### Funcional
- [ ] Pedido WhatsApp con variaciones completas  
- [ ] Tras enviar WA → pantalla éxito, carrito no se borra solo  
- [ ] Toast no se desborda  
- [ ] Búsqueda encuentra con/sin tilde  
- [ ] Descuentos visibles en cards si hay % en padre o hija  

---

## Parte E — Archivos “copiar casi tal cual” (checklist)

### Optimización / base
- [ ] `middleware.ts`
- [ ] `lib/supabase-public.ts`
- [ ] `lib/productQueries.ts`
- [ ] `lib/catalog-productos.ts`
- [ ] `lib/mapShelfProductos.ts`
- [ ] `lib/optimizeImage.ts` *(solo si falta compresión al subir)*
- [ ] `components/admin/ImageUploader.tsx` *(idem)*

### Mejoras recientes
- [ ] `scripts/setup-unaccent-search.sql` *(ejecutar en SQL Editor)*
- [ ] `lib/productSearch.ts`
- [ ] `lib/cartCheckout.ts`
- [ ] `lib/toastCatalog.tsx`
- [ ] `lib/variaciones.ts` *(flag + agotado)*
- [ ] `lib/descuentos.ts`
- [ ] `lib/whatsapp.ts`
- [ ] `components/catalog/cart/CartCheckoutSuccess.tsx`
- [ ] `app/(catalog)/carrito/page.tsx` *(máquina de steps + handlers)*
- [ ] `components/catalog/mobile/cart/CarritoMobile.tsx`
- [ ] `components/catalog/mobile/cart/MobileCartSteps.tsx`
- [ ] `components/catalog/ProductCard.tsx` + `ProductCardMobile.tsx`
- [ ] `components/admin/ProductForm.tsx` + `app/admin/(protected)/productos/page.tsx`
- [ ] Bloques CSS toast + mobile-cart en `app/globals.css`

### Opcional (402 Vercel)
- [ ] `next.config.ts` (`images.unoptimized`)
- [ ] `components/catalog/CatalogImage.tsx`
- [ ] `components/catalog/HeroBanner.tsx`

### No copiar
- [ ] ~~`scripts/backfill-images.ts`~~ (migración one-shot)
- [ ] ~~`scripts/audit-old-storage-urls.ts`~~ (hostname viejo de este proyecto)
- [ ] ~~Plan files / agent transcripts~~

---

## Nota final

Este repo y el hermano comparten base: **no reimplementes de cero**. Diff archivo por archivo contra esta lista, porta en el orden de la Parte C, y mide egress después de un día de tráfico real.

Si quieres el siguiente paso en Cursor: abre el repo hermano en el workspace y pide “implementar Parte A de `docs/plan-port-proyecto-hermano.md`” (o solo A1–A4).
