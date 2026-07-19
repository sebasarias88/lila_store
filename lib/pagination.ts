export const ADMIN_TABLE_PAGE_SIZE = 10

export function getTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) return 1
  return Math.ceil(totalItems / pageSize)
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export function clampPage(page: number, totalItems: number, pageSize: number): number {
  const totalPages = getTotalPages(totalItems, pageSize)
  return Math.min(Math.max(1, page), totalPages)
}

/** Rango de páginas con elipsis — máximo ~5 números visibles. */
export function getPaginationRange(
  current: number,
  total: number,
): (number | 'ellipsis')[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 3) {
    return [1, 2, 3, 4, 'ellipsis', total]
  }

  if (current >= total - 2) {
    return [1, 'ellipsis', total - 3, total - 2, total - 1, total]
  }

  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total]
}

/**
 * Ventana fija de N páginas consecutivas (ej. 1–5, 6–10, 11–15…).
 * La ventana cambia según el bloque en el que cae la página actual.
 */
export function getPaginationChunk(
  current: number,
  total: number,
  chunkSize = 5,
): number[] {
  if (total <= 0) return []
  if (total <= chunkSize) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const page = Math.min(Math.max(1, current), total)
  const chunkIndex = Math.floor((page - 1) / chunkSize)
  const start = chunkIndex * chunkSize + 1
  const end = Math.min(start + chunkSize - 1, total)

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export function getPaginationBounds(
  page: number,
  pageSize: number,
  totalItems: number,
): { start: number; end: number } {
  if (totalItems === 0) return { start: 0, end: 0 }
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  return { start, end }
}
