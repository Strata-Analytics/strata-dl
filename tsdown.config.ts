import { defineConfig } from 'tsdown'
import fs from 'node:fs'
import path from 'node:path'

const lambdaDir = './lambdas'
const entries = fs.readdirSync(lambdaDir)
  .filter(f => {
    const fullPath = path.join(lambdaDir, f);
    const isDirectory = fs.statSync(fullPath).isDirectory();
    const hasEntryFile = fs.existsSync(path.join(fullPath, 'index.ts'));
    return isDirectory && hasEntryFile;
  }).map(dir => ({
    entry: `lambdas/${dir}/index.ts`,
    minify: true,
    sourcemap: true,
    outDir: `lambdas/${dir}/dist`,
    deps: {
      neverBundle: [/^@aws-sdk\/.*/],
    }
  }))


export default defineConfig(entries)
