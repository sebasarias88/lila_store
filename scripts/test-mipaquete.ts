/**
 * Checks the Mipaquete connection from Sebastian's Mac (never touches the database).
 *   pnpm tsx --env-file=.env.local scripts/test-mipaquete.ts
 * Prints how many cities Mipaquete returns and a sample quote Quimbaya → Bogotá / Medellín.
 */
import { fetchShippingCities, quoteShipping } from '../lib/mipaquete'

async function main() {
  const cities = await fetchShippingCities()
  console.log(`Cities: ${cities.length}`)
  console.log('First 3:', JSON.stringify(cities.slice(0, 3)))
  const plain = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  for (const code of ['11001000', '05001000', '63001000', '63594000']) {
    const found = cities.find(c => c.code === code)
    console.log(`  ${code}: ${found ? JSON.stringify(found) : 'not found'}`)
  }
  console.log('  search "bogota":', cities.filter(c => plain(c.name).includes('bogota')).slice(0, 3).map(c => c.name))
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
