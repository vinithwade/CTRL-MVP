import express from 'express';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { transform } from 'esbuild';
const router = express.Router();
function normalizeSafePath(filePath) {
    const normalized = path.posix.normalize(filePath.replace(/\\/g, '/'));
    if (normalized.startsWith('..'))
        throw new Error('Invalid path traversal');
    return normalized.startsWith('/') ? normalized.slice(1) : normalized;
}
router.post('/validate', async (req, res) => {
    try {
        const files = Array.isArray(req.body?.files) ? req.body.files : [];
        if (files.length === 0)
            return res.status(400).json({ success: false, error: 'No files provided' });
        const results = [];
        for (const file of files) {
            const filePath = normalizeSafePath(file.path || file.name);
            const language = (file.language || '').toLowerCase();
            const content = file.content ?? '';
            const sizeOk = Buffer.byteLength(content, 'utf8') <= 1024 * 1024;
            if (!sizeOk) {
                results.push({ path: filePath, errors: [{ text: 'File too large (>1MB)' }], warnings: [] });
                continue;
            }
            try {
                if ([
                    'ts', 'tsx', 'typescript',
                    'js', 'jsx', 'javascript'
                ].includes(language)) {
                    const loader = language.includes('tsx') || language === 'tsx' ? 'tsx' : language.includes('ts') ? 'ts' : language.includes('jsx') ? 'jsx' : 'js';
                    const result = await transform(content, { loader: loader, jsx: 'transform', sourcemap: false, logLevel: 'silent' });
                    results.push({ path: filePath, errors: [], warnings: (result.warnings || []).map(w => ({ text: w.text })) });
                }
                else if (language === 'json') {
                    try {
                        JSON.parse(content);
                        results.push({ path: filePath, errors: [], warnings: [] });
                    }
                    catch (e) {
                        results.push({ path: filePath, errors: [{ text: e.message }], warnings: [] });
                    }
                }
                else {
                    if (content.trim().length === 0) {
                        results.push({ path: filePath, errors: [{ text: 'Empty file' }], warnings: [] });
                    }
                    else {
                        results.push({ path: filePath, errors: [], warnings: [] });
                    }
                }
            }
            catch (e) {
                const message = e?.message || 'Validation failed';
                results.push({ path: filePath, errors: [{ text: message }], warnings: [] });
            }
        }
        const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
        const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
        return res.json({ success: true, totalErrors, totalWarnings, results });
    }
    catch (error) {
        console.error('Validate error', error);
        return res.status(500).json({ success: false, error: 'Validation failed' });
    }
});
router.post('/lint', async (req, res) => {
    try {
        const files = Array.isArray(req.body?.files) ? req.body.files : [];
        if (files.length === 0)
            return res.status(400).json({ success: false, error: 'No files provided' });
        const lintResults = files.map((f) => {
            const filePath = normalizeSafePath(f.path || f.name);
            const content = f.content ?? '';
            const messages = [];
            if (content.trim().length === 0)
                messages.push({ severity: 'error', message: 'Empty file' });
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (/\s+$/.test(line))
                    messages.push({ severity: 'warning', message: 'Trailing whitespace', line: idx + 1 });
                if (line.length > 180)
                    messages.push({ severity: 'warning', message: 'Line exceeds 180 characters', line: idx + 1 });
            });
            if (/eval\s*\(/.test(content))
                messages.push({ severity: 'error', message: 'Avoid eval()' });
            if (/document\.write\s*\(/.test(content))
                messages.push({ severity: 'warning', message: 'Avoid document.write()' });
            return { path: filePath, messages };
        });
        const errorCount = lintResults.reduce((sum, r) => sum + r.messages.filter(m => m.severity === 'error').length, 0);
        const warningCount = lintResults.reduce((sum, r) => sum + r.messages.filter(m => m.severity === 'warning').length, 0);
        return res.json({ success: true, errorCount, warningCount, results: lintResults });
    }
    catch (error) {
        console.error('Lint error', error);
        return res.status(500).json({ success: false, error: 'Linting failed' });
    }
});
router.post('/deploy', async (req, res) => {
    try {
        const files = Array.isArray(req.body?.files) ? req.body.files : [];
        const provider = req.body?.provider || 'local';
        const projectName = (req.body?.projectName || 'ctrl-generated-app').toString();
        if (files.length === 0)
            return res.status(400).json({ success: false, error: 'No files provided' });
        const deploymentsDir = path.resolve(process.cwd(), 'deployments');
        if (!fs.existsSync(deploymentsDir))
            fs.mkdirSync(deploymentsDir, { recursive: true });
        const zip = new AdmZip();
        for (const f of files) {
            const safePath = normalizeSafePath(f.path || f.name);
            zip.addFile(safePath, Buffer.from(f.content ?? '', 'utf8'));
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipName = `${projectName}-${timestamp}.zip`;
        const zipPath = path.join(deploymentsDir, zipName);
        zip.writeZip(zipPath);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const downloadUrl = `${baseUrl}/api/code/deployments/${encodeURIComponent(zipName)}`;
        return res.json({ success: true, provider, artifact: { name: zipName, url: downloadUrl, size: fs.statSync(zipPath).size } });
    }
    catch (error) {
        console.error('Deploy error', error);
        return res.status(500).json({ success: false, error: 'Deployment failed' });
    }
});
export default router;
//# sourceMappingURL=code.js.map