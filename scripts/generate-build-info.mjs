import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outPath = path.join(root, 'Lib', 'buildInfo.generated.ts')

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const buildLabel = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
const buildTimeIso = now.toISOString()
const sha =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  'local'

const content = `// Gerado automaticamente por scripts/generate-build-info.mjs — não editar
export const BUILD_LABEL = ${JSON.stringify(buildLabel)}
export const BUILD_TIME_ISO = ${JSON.stringify(buildTimeIso)}
export const BUILD_SHA = ${JSON.stringify(sha)}
export const BUILD_NOTE = "package-full-inventory"
`

fs.writeFileSync(outPath, content, 'utf8')
console.log(`[build-info] ${buildLabel} (${sha.slice(0, 7)})`)
