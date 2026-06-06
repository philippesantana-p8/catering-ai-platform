import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

const files = [
  'app/quotes/new/QuoteWizard.tsx',
  'app/quotes/[id]/page.tsx',
  'app/quotes/new/AddressAutocompleteFields.tsx',
  'app/quotes/page.tsx',
  'components/ThemeToggle.tsx',
]

const replacements = [
  [
    'bg-gradient-to-br from-cdl-accent/10 via-transparent to-transparent',
    'cdl-hero-glow',
  ],
  [
    'bg-gradient-to-br from-cdl-surface to-cdl-inset',
    'cdl-surface-gradient',
  ],
  ['bg-cdl-accent/10', 'bg-cdl-accent-soft'],
  ['bg-cdl-accent/5', 'bg-cdl-accent-soft'],
  ['bg-cdl-accent/20', 'bg-cdl-accent-muted'],
  ['hover:border-cdl-accent/40', 'hover:border-cdl-accent-border'],
  ['hover:border-cdl-accent/30', 'hover:border-cdl-accent-border'],
  ['focus:border-cdl-accent/50', 'focus:border-cdl-accent-border'],
  ['border-cdl-accent/50', 'border-cdl-accent-border'],
  ['border-cdl-accent/30', 'border-cdl-accent-border'],
  ['border-cdl-accent/40', 'border-cdl-accent-border'],
  ['shadow-[0_0_20px_rgba(246,208,0,0.15)]', 'shadow-cdl-accent'],
  ['shadow-2xl', 'shadow-cdl-popup'],
  ['shadow-lg', 'shadow-cdl'],
  [
    'rounded-3xl border border-cdl-border bg-cdl-surface px-6 py-10 sm:px-10 sm:py-14',
    'cdl-panel px-6 py-10 sm:px-10 sm:py-14',
  ],
  [
    'rounded-3xl border border-cdl-border bg-cdl-surface p-3 sm:p-4',
    'cdl-panel p-3 sm:p-4',
  ],
  [
    'rounded-3xl border-2 border-cdl-accent-border bg-cdl-surface-gradient p-6 sm:p-8',
    'cdl-panel border-2 border-cdl-accent-border cdl-surface-gradient p-6 sm:p-8',
  ],
]

for (const file of files) {
  const filePath = path.join(root, file)
  if (!fs.existsSync(filePath)) continue

  let content = fs.readFileSync(filePath, 'utf8')
  for (const [from, to] of replacements) {
    content = content.split(from).join(to)
  }
  fs.writeFileSync(filePath, content)
  console.log('polished', file)
}
