/**
 * One-time: shrink photos that were uploaded before auto-compression existed.
 * Safe to re-run (already-small images barely change). Run from apps/api:
 *   pnpm --filter api exec tsx scripts/compress-existing-images.ts
 * On the server, UPLOAD_DIR points at the live uploads dir (apps/api/.env).
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { compressImageInPlace } from '../src/middleware/upload'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p))
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) out.push(p)
  }
  return out
}

const mb = (n: number) => (n / 1024 / 1024).toFixed(1)

async function main() {
  const root = path.join(UPLOAD_DIR, 'ornaments')
  const files = walk(root)
  console.log(`Found ${files.length} image(s) under ${root}`)
  let before = 0
  let after = 0
  let done = 0
  for (const f of files) {
    before += fs.statSync(f).size
    await compressImageInPlace(f)
    after += fs.statSync(f).size
    done++
    if (done % 25 === 0 || done === files.length) {
      console.log(`  ${done}/${files.length} processed`)
    }
  }
  console.log(`Done. ${files.length} images: ${mb(before)}MB -> ${mb(after)}MB`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
