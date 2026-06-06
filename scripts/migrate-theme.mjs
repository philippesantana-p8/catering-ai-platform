import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

const files = [
  'app/quotes/new/QuoteWizard.tsx',
  'app/quotes/[id]/page.tsx',
  'app/quotes/new/AddressAutocompleteFields.tsx',
]

const replacements = [
  ['border-2 border-[#f6d000]/40', 'border-2 border-cdl-accent/40'],
  ['border-2 border-[#f6d000]/30', 'border-2 border-cdl-accent/30'],
  ['focus:border-[#f6d000]/50', 'focus:border-cdl-accent/50'],
  ['hover:border-[#f6d000]/40', 'hover:border-cdl-accent/40'],
  ['hover:border-[#f6d000]/30', 'hover:border-cdl-accent/30'],
  ['border-[#f6d000]/50', 'border-cdl-accent/50'],
  ['border-[#f6d000]/40', 'border-cdl-accent/40'],
  ['border-[#f6d000]/30', 'border-cdl-accent/30'],
  ['from-[#f6d000]/10', 'from-cdl-accent/10'],
  ['bg-[#f6d000]/10', 'bg-cdl-accent/10'],
  ['bg-[#f6d000]/5', 'bg-cdl-accent/5'],
  [
    'bg-gradient-to-br from-[#111] to-[#0a0a0a]',
    'bg-gradient-to-br from-cdl-surface to-cdl-inset',
  ],
  ['text-black/70', 'text-cdl-on-accent/70'],
  ['text-black/60', 'text-cdl-on-accent/60'],
  ['bg-black/20', 'bg-cdl-on-accent/20'],
  ['placeholder:text-[#555]', 'placeholder:text-cdl-faint'],
  ['hover:bg-[#161616]', 'hover:bg-cdl-hover'],
  ['hover:text-[#f6d000]', 'hover:text-cdl-accent'],
  ['border-[#2a2a2a]', 'border-cdl-border-subtle'],
  ['bg-[#0a0a0a]', 'bg-cdl-inset'],
  ['bg-[#161616]', 'bg-cdl-hover'],
  ['bg-[#1a1a1a]', 'bg-cdl-muted-bg'],
  ['bg-[#111]', 'bg-cdl-surface'],
  ['bg-[#222]', 'bg-cdl-image'],
  ['border-[#333]', 'border-cdl-border'],
  ['border-[#f6d000]', 'border-cdl-accent'],
  ['text-[#f6d000]', 'text-cdl-accent'],
  ['bg-[#f6d000]', 'bg-cdl-accent'],
  ['text-[#888]', 'text-cdl-muted'],
  ['text-[#ccc]', 'text-cdl-text-secondary'],
  ['text-[#ddd]', 'text-cdl-text-secondary'],
  ['text-[#666]', 'text-cdl-subtle'],
  ['text-[#555]', 'text-cdl-faint'],
  ['text-white', 'text-cdl-fg'],
  ['text-black', 'text-cdl-on-accent'],
  ['bg-black', 'bg-cdl-bg'],
  ['accent-[#f6d000]', 'accent-cdl-accent'],
]

for (const file of files) {
  const filePath = path.join(root, file)
  if (!fs.existsSync(filePath)) {
    console.log('skip', file)
    continue
  }

  let content = fs.readFileSync(filePath, 'utf8')
  for (const [from, to] of replacements) {
    content = content.split(from).join(to)
  }
  fs.writeFileSync(filePath, content)
  console.log('updated', file)
}
