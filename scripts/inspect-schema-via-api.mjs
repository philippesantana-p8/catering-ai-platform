/**
 * Infere colunas via Supabase REST (select * limit 1).
 * Não retorna data_type — use inspect-schema.mjs com DATABASE_URL para isso.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const env = readFileSync(envPath, 'utf8')
const get = (key) => env.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim()

const supabase = createClient(
  get('NEXT_PUBLIC_SUPABASE_URL'),
  get('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
)

const TABLES = ['packages', 'rules', 'additional_items', 'commercial_rules']

async function probeTable(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1)
  if (error) {
    return { table, error: error.message, columns: [] }
  }
  const row = data?.[0]
  const columns = row ? Object.keys(row).sort() : []
  return { table, error: null, columns, empty: !row }
}

async function main() {
  for (const table of TABLES) {
    const result = await probeTable(table)
    console.log(`\n## ${result.table}`)
    if (result.error) {
      console.log(`ERROR: ${result.error}`)
      continue
    }
    if (result.empty) {
      console.log('(tabela acessível, mas sem linhas — colunas não inferidas)')
      continue
    }
    for (const col of result.columns) {
      const val = (await supabase.from(table).select(col).limit(1)).data?.[0]?.[col]
      const t = val === null ? 'null' : Array.isArray(val) ? 'array' : typeof val
      console.log(`${col}\t(inferred: ${t})`)
    }
  }
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
