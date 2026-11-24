/** Public origin of the site for redirects (works in preview deployments too). */
export function siteOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost) return `${proto}://${forwardedHost}`
  return new URL(request.url).origin
}
