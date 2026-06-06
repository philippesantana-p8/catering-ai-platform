import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const files = [
  'app/quotes/new/QuoteWizard.tsx',
  'app/quotes/[id]/page.tsx',
  'app/quotes/page.tsx',
  'app/page.tsx',
]

const replacements = [
  [
    '<h2 className="mb-6 border-b border-cdl-border-subtle pb-3 text-xl font-bold text-cdl-accent sm:text-2xl">',
    '<h2 className="mb-6 border-b border-cdl-border-subtle pb-3 text-xl font-bold text-cdl-title sm:text-2xl">',
  ],
  [
    '<h2 className="mb-5 border-b border-cdl-border-subtle pb-3 text-lg font-bold text-cdl-accent">',
    '<h2 className="mb-5 border-b border-cdl-border-subtle pb-3 text-lg font-bold text-cdl-title">',
  ],
  [
    '<h1 className="mt-6 text-4xl font-black tracking-tight text-cdl-accent sm:text-5xl">',
    '<h1 className="mt-6 text-4xl font-black tracking-tight text-cdl-title sm:text-5xl">',
  ],
  [
    '<h1 className="mt-6 text-5xl font-black tracking-tight text-cdl-accent sm:text-6xl">',
    '<h1 className="mt-6 text-5xl font-black tracking-tight text-cdl-title sm:text-6xl">',
  ],
  [
    '<h1 className="text-4xl font-black text-cdl-accent sm:text-5xl">',
    '<h1 className="text-4xl font-black text-cdl-title sm:text-5xl">',
  ],
  [
    '<h1 className="text-2xl font-bold text-cdl-accent">',
    '<h1 className="text-2xl font-bold text-cdl-title">',
  ],
  [
    '<h2 className="text-lg font-bold text-cdl-accent">',
    '<h2 className="text-lg font-bold text-cdl-title">',
  ],
  [
    '<span className="text-lg font-bold text-cdl-accent sm:text-xl">',
    '<span className="text-lg font-bold text-cdl-title sm:text-xl">',
  ],
]

for (const file of files) {
  const filePath = path.join(root, file)
  let content = fs.readFileSync(filePath, 'utf8')
  for (const [from, to] of replacements) {
    content = content.split(from).join(to)
  }
  fs.writeFileSync(filePath, content)
  console.log('updated', file)
}
