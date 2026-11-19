/**
 * Maintenance mode switch. Turn on in Vercel → Settings → Environment Variables:
 *   MAINTENANCE_MODE=true   (then Redeploy)
 * The public catalog shows a branded screen with a WhatsApp button and makes
 * no database calls. The admin panel keeps working.
 */
export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE?.trim().toLowerCase() === 'true'
}
