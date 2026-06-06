/**
 * Atualiza pacotes CDL no Supabase conforme CDLBBQBR 26.
 * Uso: node scripts/update-cdl-packages.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const env = readFileSync(envPath, 'utf8')
const get = (key) => env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim()

const supabase = createClient(
  get('NEXT_PUBLIC_SUPABASE_URL'),
  get('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
)

const PACKAGE_COMMON_ITEMS = [
  'Chimichurri',
  'Farofa',
  'Mel',
  'Goiabada',
  'Pimenta de bico',
  'Geleia de pimenta',
]

const SIDES_ITEMS = [
  'Arroz branco',
  'Feijão preto',
  'Maionese',
  'Vinagrete ou salada César',
  'Estrutura de mesa com rechauds e descartáveis: pratos, talheres e guardanapos',
]

function buildDescription(items, withSides) {
  const lines = [
    'Itens do pacote:',
    ...items.map((item) => `• ${item}`),
    '',
    'Todos os pacotes acompanham:',
    ...PACKAGE_COMMON_ITEMS.map((item) => `• ${item}`),
  ]
  if (withSides) {
    lines.push('', 'Guarnições inclusas (+$13/pessoa):', ...SIDES_ITEMS.map((item) => `• ${item}`))
  }
  return lines.join('\n')
}

const packages = [
  {
    package_key: 'BBQTRAD',
    label_pt: 'BBQ Tradicional',
    label_en: 'BBQ Traditional',
    label_es: 'BBQ Tradicional',
    price_per_person: 45,
    items: ['Picanha Angus', 'Linguiça tradicional', 'Frango sobrecoxa desossada', 'Pão de alho', 'Queijo coalho', 'Milho'],
    with_sides: false,
    display_order: 1,
  },
  {
    package_key: 'BBQSEL',
    label_pt: 'BBQ Select',
    label_en: 'BBQ Select',
    label_es: 'BBQ Select',
    price_per_person: 55,
    items: ['Picanha Angus', 'Costela de porco ou boi', 'Linguiça tradicional', 'Frango sobrecoxa desossada', 'Pão de alho', 'Queijo', 'Milho'],
    with_sides: false,
    display_order: 2,
  },
  {
    package_key: 'BBQCHO',
    label_pt: 'BBQ Choice',
    label_en: 'BBQ Choice',
    label_es: 'BBQ Choice',
    price_per_person: 65,
    items: ['Picanha Angus', 'Salmão ou camarão', 'Costela de porco ou boi', 'Linguiça', 'Frango sobrecoxa desossada', 'Pão de alho', 'Queijo', 'Milho'],
    with_sides: false,
    display_order: 3,
  },
  {
    package_key: 'BBQPRI',
    label_pt: 'BBQ Prime',
    label_en: 'BBQ Prime',
    label_es: 'BBQ Prime',
    price_per_person: 75,
    items: ['Picanha Angus', 'Salmão ou camarão', 'Costela de porco ou boi', 'Carré de cordeiro', 'Linguiça', 'Frango sobrecoxa desossada', 'Pão de alho', 'Queijo', 'Milho'],
    with_sides: false,
    display_order: 4,
  },
  {
    package_key: 'BBQTRAD+',
    label_pt: 'BBQ Tradicional com guarnições',
    label_en: 'BBQ Traditional with side dishes',
    label_es: 'BBQ Tradicional con guarniciones',
    price_per_person: 58,
    items: ['Picanha Angus', 'Linguiça tradicional', 'Frango sobrecoxa desossada', 'Pão de alho', 'Queijo coalho', 'Milho'],
    with_sides: true,
    display_order: 5,
  },
  {
    package_key: 'BBQSEL+',
    label_pt: 'BBQ Select com guarnições',
    label_en: 'BBQ Select with side dishes',
    label_es: 'BBQ Select con guarniciones',
    price_per_person: 68,
    items: ['Picanha Angus', 'Costela de porco ou boi', 'Linguiça tradicional', 'Frango sobrecoxa desossada', 'Pão de alho', 'Queijo', 'Milho'],
    with_sides: true,
    display_order: 6,
  },
  {
    package_key: 'BBQCHO+',
    label_pt: 'BBQ Choice com guarnições',
    label_en: 'BBQ Choice with side dishes',
    label_es: 'BBQ Choice con guarniciones',
    price_per_person: 78,
    items: ['Picanha Angus', 'Salmão ou camarão', 'Costela de porco ou boi', 'Linguiça', 'Frango sobrecoxa desossada', 'Pão de alho', 'Queijo', 'Milho'],
    with_sides: true,
    display_order: 7,
  },
  {
    package_key: 'BBQPRI+',
    label_pt: 'BBQ Prime com guarnições',
    label_en: 'BBQ Prime with side dishes',
    label_es: 'BBQ Prime con guarniciones',
    price_per_person: 88,
    items: ['Picanha Angus', 'Salmão ou camarão', 'Costela de porco ou boi', 'Carré de cordeiro', 'Linguiça', 'Frango sobrecoxa desossada', 'Pão de alho', 'Queijo', 'Milho'],
    with_sides: true,
    display_order: 8,
  },
]

for (const pkg of packages) {
  const description_pt = buildDescription(pkg.items, pkg.with_sides)
  const { error } = await supabase
    .from('packages')
    .update({
      label_pt: pkg.label_pt,
      label_en: pkg.label_en,
      label_es: pkg.label_es,
      package_name: pkg.label_pt,
      price_per_person: pkg.price_per_person,
      description: description_pt,
      description_pt,
      description_en: description_pt,
      description_es: description_pt,
      display_order: pkg.display_order,
      active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('package_key', pkg.package_key)

  if (error) {
    console.error(`Failed ${pkg.package_key}:`, error.message)
  } else {
    console.log(`Updated ${pkg.package_key} → $${pkg.price_per_person}/pessoa`)
  }
}

console.log('Done.')
