import express from 'express'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import { transform } from 'esbuild'

interface IncomingFile {
  name: string
  path: string
  content: string
  language: string
}

const router = express.Router()

// Normalize and basic sanitize of paths
function normalizeSafePath(filePath: string): string {
  const normalized = path.posix.normalize(filePath.replace(/\\/g, '/'))
  if (normalized.startsWith('..')) throw new Error('Invalid path traversal')
  return normalized.startsWith('/') ? normalized.slice(1) : normalized
}

router.post('/validate', async (req, res) => {
  try {
    const files: IncomingFile[] = Array.isArray(req.body?.files) ? req.body.files : []
    if (files.length === 0) return res.status(400).json({ success: false, error: 'No files provided' })

    const results = [] as Array<{ path: string; errors: any[]; warnings: any[] }>

    for (const file of files) {
      const filePath = normalizeSafePath(file.path || file.name)
      const language = (file.language || '').toLowerCase()
      const content = file.content ?? ''
      const sizeOk = Buffer.byteLength(content, 'utf8') <= 1024 * 1024 // 1MB limit per file
      if (!sizeOk) {
        results.push({ path: filePath, errors: [{ text: 'File too large (>1MB)' }], warnings: [] })
        continue
      }

      try {
        if ([
          'ts', 'tsx', 'typescript',
          'js', 'jsx', 'javascript'
        ].includes(language)) {
          const loader = language.includes('tsx') || language === 'tsx' ? 'tsx' : language.includes('ts') ? 'ts' : language.includes('jsx') ? 'jsx' : 'js'
          const result = await transform(content, { loader: loader as any, jsx: 'transform', sourcemap: false, logLevel: 'silent' })
          // esbuild throws for syntax errors, otherwise we can collect warnings from result.warnings
          results.push({ path: filePath, errors: [], warnings: (result.warnings || []).map(w => ({ text: w.text })) })
        } else if (language === 'json') {
          try {
            JSON.parse(content)
            results.push({ path: filePath, errors: [], warnings: [] })
          } catch (e: any) {
            results.push({ path: filePath, errors: [{ text: e.message }], warnings: [] })
          }
        } else {
          // For css/html/others, basic non-empty validation
          if (content.trim().length === 0) {
            results.push({ path: filePath, errors: [{ text: 'Empty file' }], warnings: [] })
          } else {
            results.push({ path: filePath, errors: [], warnings: [] })
          }
        }
      } catch (e: any) {
        const message = e?.message || 'Validation failed'
        results.push({ path: filePath, errors: [{ text: message }], warnings: [] })
      }
    }

    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0)

    return res.json({ success: true, totalErrors, totalWarnings, results })
  } catch (error) {
    console.error('Validate error', error)
    return res.status(500).json({ success: false, error: 'Validation failed' })
  }
})

router.post('/lint', async (req, res) => {
  try {
    const files: IncomingFile[] = Array.isArray(req.body?.files) ? req.body.files : []
    if (files.length === 0) return res.status(400).json({ success: false, error: 'No files provided' })

    // Very lightweight lint rules
    const lintResults = files.map((f) => {
      const filePath = normalizeSafePath(f.path || f.name)
      const content = f.content ?? ''
      const messages: Array<{ severity: 'warning' | 'error'; message: string; line?: number }> = []

      if (content.trim().length === 0) messages.push({ severity: 'error', message: 'Empty file' })
      const lines = content.split('\n')
      lines.forEach((line, idx) => {
        if (/\s+$/.test(line)) messages.push({ severity: 'warning', message: 'Trailing whitespace', line: idx + 1 })
        if (line.length > 180) messages.push({ severity: 'warning', message: 'Line exceeds 180 characters', line: idx + 1 })
      })
      if (/eval\s*\(/.test(content)) messages.push({ severity: 'error', message: 'Avoid eval()' })
      if (/document\.write\s*\(/.test(content)) messages.push({ severity: 'warning', message: 'Avoid document.write()' })

      return { path: filePath, messages }
    })

    const errorCount = lintResults.reduce((sum, r) => sum + r.messages.filter(m => m.severity === 'error').length, 0)
    const warningCount = lintResults.reduce((sum, r) => sum + r.messages.filter(m => m.severity === 'warning').length, 0)

    return res.json({ success: true, errorCount, warningCount, results: lintResults })
  } catch (error) {
    console.error('Lint error', error)
    return res.status(500).json({ success: false, error: 'Linting failed' })
  }
})

router.post('/deploy', async (req, res) => {
  try {
    const files: IncomingFile[] = Array.isArray(req.body?.files) ? req.body.files : []
    const provider: string = req.body?.provider || 'local'
    const projectName: string = (req.body?.projectName || 'ctrl-generated-app').toString()
    if (files.length === 0) return res.status(400).json({ success: false, error: 'No files provided' })

    // For now only local zip deployment is supported unless provider creds are set
    const deploymentsDir = path.resolve(process.cwd(), 'deployments')
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true })

    const zip = new AdmZip()
    for (const f of files) {
      const safePath = normalizeSafePath(f.path || f.name)
      zip.addFile(safePath, Buffer.from(f.content ?? '', 'utf8'))
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const zipName = `${projectName}-${timestamp}.zip`
    const zipPath = path.join(deploymentsDir, zipName)
    zip.writeZip(zipPath)

    // Build a URL to download the artifact
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const downloadUrl = `${baseUrl}/api/code/deployments/${encodeURIComponent(zipName)}`

    return res.json({ success: true, provider, artifact: { name: zipName, url: downloadUrl, size: fs.statSync(zipPath).size } })
  } catch (error) {
    console.error('Deploy error', error)
    return res.status(500).json({ success: false, error: 'Deployment failed' })
  }
})

export default router


