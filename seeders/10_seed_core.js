import fs from 'fs'
import path from 'path'

export async function init({ pool }) {
  const backendDir = path.join(process.cwd(), 'backend')
  const dataDir = path.join(backendDir, 'data')
  const catsPath = path.join(dataDir, 'categories.json')
  const gamesPath = path.join(dataDir, 'games.json')

  try {
    const rawCats = fs.readFileSync(catsPath, 'utf-8')
    const categories = JSON.parse(rawCats)
    for (const c of categories) {
      const exists = await pool.query('SELECT id FROM categories WHERE id = $1 OR slug = $2', [c.id, c.slug])
      if (exists.rowCount === 0) {
        await pool.query(
          'INSERT INTO categories (id, name, slug, description, image, gradient, icon) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [c.id, c.name, c.slug, c.description, c.image, c.gradient, c.icon]
        )
      } else {
        await pool.query(
          'UPDATE categories SET name = $1, description = $2, image = $3, gradient = $4, icon = $5 WHERE slug = $6',
          [c.name, c.description, c.image, c.gradient, c.icon, c.slug]
        )
      }
    }
  } catch {}

  try {
    const rawGames = fs.readFileSync(gamesPath, 'utf-8')
    const games = JSON.parse(rawGames)
    for (const g of games) {
      const exists = await pool.query('SELECT id FROM games WHERE id = $1 OR slug = $2', [g.id, g.slug])
      const priceNum = Number(g.price) || 0
      const packages = Array.isArray(g.packages) ? g.packages : []
      const packagePrices = Array.isArray(g.packagePrices) ? g.packagePrices : []
      if (exists.rowCount === 0) {
        await pool.query(
          'INSERT INTO games (id, name, slug, description, price, old_price, currency, image, category, is_popular, stock, packages, package_prices) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
          [g.id, g.name, g.slug, g.description, priceNum, null, g.currency || 'EGP', g.image, g.category, !!g.isPopular, Number(g.stock)||0, JSON.stringify(packages), JSON.stringify(packagePrices)]
        )
      } else {
        await pool.query(
          'UPDATE games SET name=$1, description=$2, price=$3, currency=$4, image=$5, category=$6, is_popular=$7, stock=$8, packages=$9, package_prices=$10 WHERE slug=$11',
          [g.name, g.description, priceNum, g.currency || 'EGP', g.image, g.category, !!g.isPopular, Number(g.stock)||0, JSON.stringify(packages), JSON.stringify(packagePrices), g.slug]
        )
      }
    }
  } catch {}
}
