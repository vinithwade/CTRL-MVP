export interface DeployFile {
  name: string
  path: string
  content: string
  language: string
}

const BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5001'

export async function validateProject(files: DeployFile[]) {
  const res = await fetch(`${BASE_URL}/api/code/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files })
  })
  if (!res.ok) throw new Error('Validation failed')
  return res.json()
}

export async function lintProject(files: DeployFile[]) {
  const res = await fetch(`${BASE_URL}/api/code/lint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files })
  })
  if (!res.ok) throw new Error('Linting failed')
  return res.json()
}

export async function deployProject(files: DeployFile[], provider: 'local' | 'netlify' | 'vercel' = 'local', projectName = 'ctrl-generated-app') {
  const res = await fetch(`${BASE_URL}/api/code/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, provider, projectName })
  })
  if (!res.ok) throw new Error('Deployment failed')
  return res.json()
}


