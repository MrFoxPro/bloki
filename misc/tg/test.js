import path from 'node:path'
import { fileURLToPath } from 'node:url'
console.log(path.resolve('.'), fileURLToPath(import.meta.url))
