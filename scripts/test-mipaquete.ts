/**
 * Checks the Mipaquete connection from Sebastian's Mac (never touches the database).
 *   pnpm tsx --env-file=.env.local scripts/test-mipaquete.ts
 * Prints how many cities Mipaquete returns and a sample quote Quimbaya → Bogotá / Medellín.
 */
import { fetchShippingCities, quoteShipping } from '../lib/mipaquete'

async function main() {
  const cities = await fetchShippingCities()
  console.log(`Cities: ${cities.length}`)
  for (const name of ['Bogotá', 'Medellín', 'Armenia', 'Quimbaya']) {
    const found = cities.find(c => c.name.normalize('NFD').replace(/[̀-ͯ]/g, '').startsWith(name.normalize('NFD').replace(/[̀-ͯ]/g, '')))
    console.log(`  ${name}: ${found ? `${found.code} (${found.department})` : 'not found'}`)
  }
  for (const destinyCode of ['11001000', '05001000']) {
    const options = await quoteShipping({
      destinyCode,
      pkg: { weightKg: 1, lengthCm: 25, widthCm: 20, heightCm: 15 },
      declaredValue: 100_000,
    })
    console.log(`\nQuote to ${destinyCode}:`)
    options.forEach(o => console.log(`  ${o.carrier}: $${o.cost} · ${o.days ?? '?'} días`))
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
