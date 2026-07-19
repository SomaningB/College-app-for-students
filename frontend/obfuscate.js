import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import JavaScriptObfuscator from 'javascript-obfuscator'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = join(__dirname, 'dist', 'assets')

const files = readdirSync(dist).filter(f => f.endsWith('.js'))

for (const file of files) {
  const filePath = join(dist, file)
  const code = readFileSync(filePath, 'utf-8')
  const obfuscated = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 0.75,
    target: 'browser',
    transformObjectKeys: false,
    unicodeEscapeSequence: false
  }).getObfuscatedCode()

  writeFileSync(filePath, obfuscated, 'utf-8')
  console.log(`Obfuscated: ${file}`)
}

console.log('Obfuscation complete.')
