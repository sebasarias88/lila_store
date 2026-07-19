export type Categoria = {
  id: string
  nombre: string
  slug: string
  imagen_url: string | null
  orden: number
  activa: boolean
  padre_id: string | null
  descuento_porcentaje: number
  descuento_activo: boolean
  descuento_fecha_fin: string | null
  descuento_porcentaje_mayoreo: number
  descuento_activo_mayoreo: boolean
  descuento_fecha_fin_mayoreo: string | null
  subcategorias?: Categoria[]
  created_at: string
  total_productos?: number
  total_detal?: number
  total_mayoreo?: number
}

export type MarcaDisponible = {
  marca: string
  total_productos: number
}

export type VariacionOpcion = {
  id: string
  tipo_id: string
  nombre: string
  valor_color: string | null
  disponible: boolean
  orden: number
}

export type VariacionTipo = {
  id: string
  producto_id: string
  nombre: string
  orden: number
  opciones?: VariacionOpcion[]
}

export type ProductoSeccion = {
  id: string
  producto_id: string
  titulo: string
  descripcion: string
  orden: number
}

export type Producto = {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  precio: number
  precio_antes: number | null
  precio_mayoreo: number | null
  precio_antes_mayoreo: number | null
  disponible: boolean
  disponible_detal: boolean
  disponible_mayoreo: boolean
  destacado: boolean
  marca: string | null
  categoria_id: string | null
  categoria?: Categoria
  categorias?: Categoria[]
  secciones?: ProductoSeccion[]
  imagenes: string[]
  sku: string | null
  orden: number
  created_at: string
  updated_at: string
}

export type Configuracion = {
  id: string
  clave: string
  valor: string
  descripcion: string | null
}

export type ItemCarrito = {
  producto: Producto
  cantidad: number
  /** tipo nombre → opción nombre */
  variacionesSeleccionadas?: Record<string, string>
  lineKey?: string
}

export type DatosCliente = {
  nombre: string
  celular: string
  direccion: string
  ciudad: string
  metodoPago: string
  notas: string
}

export type Banner = {
  id: string
  imagen_url: string
  titulo: string | null
  subtitulo: string | null
  texto_boton: string | null
  enlace_boton: string | null
  activo: boolean
  orden: number
  created_at: string
}

export type Promocion = {
  id: string
  titulo: string
  descripcion: string | null
  imagen_url: string | null
  badge_texto: string | null
  badge_color: string
  fecha_inicio: string | null
  fecha_fin: string | null
  activa: boolean
  orden: number
  enlace: string | null
  created_at: string
}
