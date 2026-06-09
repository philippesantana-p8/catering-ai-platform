/**
 * Lista colunas de packages, rules, additional_items via Postgres (se DATABASE_URL existir).
 * Uso: node scripts/inspect-schema.mjs
 */
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')

function loadEnv() {
  try {
    const env = readFileSync(envPath, 'utf8')
    const get = (key) => env.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim()
    return {
      databaseUrl:
        get('DATABASE_URL') ||
        get('DIRECT_URL') ||
        get('POSTGRES_URL') ||
        get('SUPABASE_DB_URL') ||
        '',
    }
  } catch {
    return { databaseUrl: '' }
  }
}

const SQL = `
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('packages', 'rules', 'additional_items')
order by table_name, ordinal_position;
`

async function main() {
  const { databaseUrl } = loadEnv()
  if (!databaseUrl) {
    console.error(
      'DATABASE_URL (ou DIRECT_URL) não encontrado em .env.local. ' +
        'Rode a query no Supabase SQL Editor ou adicione a connection string.',
    )
    process.exit(1)
  }

  let pg
  try {
    pg = await import('pg')
  } catch {
    console.error('Pacote pg não instalado. Instale com: npm install pg')
    process.exit(1)
  }

  const client = new pg.default.Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    const { rows } = await client.query(SQL)
    if (rows.length === 0) {
      console.log('Nenhuma coluna encontrada para packages, rules ou additional_items.')
      return
    }
    console.log('table_name\tcolumn_name\tdata_type')
    for (const row of rows) {
      console.log(`${row.table_name}\t${row.column_name}\t${row.data_type}`)
    }
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
