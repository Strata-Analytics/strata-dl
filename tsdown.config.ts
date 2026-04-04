import { defineConfig } from 'tsdown'
import fs from 'node:fs'
import path from 'node:path'

const lambdaDir = './datalake/src/lambdas'
const entries = fs.readdirSync(lambdaDir)
  .filter(f => {
    const fullPath = path.join(lambdaDir, f);
    const isDirectory = fs.statSync(fullPath).isDirectory();
    const hasEntryFile = fs.existsSync(path.join(fullPath, 'index.ts'));
    return isDirectory && hasEntryFile;
  }).map(dir => ({
    entry: `${lambdaDir}/${dir}/index.ts`,
    minify: true,
    sourcemap: true,
    outDir: `${lambdaDir}/${dir}/dist`,
    deps: {
      neverBundle: [/^@aws-sdk\/.*/],
    }
  }))


export default defineConfig(entries)
