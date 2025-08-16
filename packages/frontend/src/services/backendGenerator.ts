import { Component, Screen } from '@/contexts/DesignContext'

export type BackendFramework = 'express' | 'fastify' | 'nest' | 'django' | 'spring'

interface BackendGenerationOptions {
  framework: BackendFramework
  language: 'typescript' | 'javascript'
  database: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite'
  features: {
    authentication: boolean
    authorization: boolean
    validation: boolean
    testing: boolean
    documentation: boolean
    caching: boolean
  }
}

interface GeneratedBackend {
  files: Array<{
    name: string
    path: string
    content: string
    language: string
  }>
}

export class BackendGenerator {
  private options: BackendGenerationOptions

  constructor(options: BackendGenerationOptions) {
    this.options = options
  }

  generateBackend(components: Component[], screens: Screen[]): GeneratedBackend {
    switch (this.options.framework) {
      case 'express':
      default:
        return this.generateExpressBackend(components, screens)
    }
  }

  private generateExpressBackend(components: Component[], screens: Screen[]): GeneratedBackend {
    const files: GeneratedBackend['files'] = []

    // server.ts
    const serverTs = this.generateExpressServer()
    files.push({ name: 'server.ts', path: '/backend/src/server.ts', content: serverTs, language: 'typescript' })

    // routes
    const routesIndex = this.generateRoutesIndex()
    files.push({ name: 'index.ts', path: '/backend/src/routes/index.ts', content: routesIndex, language: 'typescript' })

    // health route
    const healthRoute = this.generateHealthRoute()
    files.push({ name: 'health.ts', path: '/backend/src/routes/health.ts', content: healthRoute, language: 'typescript' })

    // components CRUD based on design components
    const entities = this.deriveEntitiesFromComponents(components)
    const entitiesRoute = this.generateEntitiesRoute(entities)
    files.push({ name: 'entities.ts', path: '/backend/src/routes/entities.ts', content: entitiesRoute, language: 'typescript' })

    // simple README
    const readme = this.generateBackendReadme(entities, screens)
    files.push({ name: 'README.md', path: '/backend/README.md', content: readme, language: 'markdown' })

    // tsconfig
    const tsconfig = this.generateTsconfig()
    files.push({ name: 'tsconfig.json', path: '/backend/tsconfig.json', content: tsconfig, language: 'json' })

    // package.json (minimal for preview)
    const pkg = this.generatePackageJson()
    files.push({ name: 'package.json', path: '/backend/package.json', content: pkg, language: 'json' })

    return { files }
  }

  private generateExpressServer(): string {
    return `import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import healthRouter from './routes/health'
import entitiesRouter from './routes/entities'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.use('/api/health', healthRouter)
app.use('/api/entities', entitiesRouter)

app.get('/', (_req, res) => {
  res.json({ name: 'CTRL Generated Backend', status: 'OK' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log('Generated backend listening on port', PORT)
})
`
  }

  private generateRoutesIndex(): string {
    return `export { default as health } from './health'
export { default as entities } from './entities'
`
  }

  private generateHealthRoute(): string {
    return `import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

export default router
`
  }

  private deriveEntitiesFromComponents(components: Component[]): Array<{ name: string; fields: Array<{ name: string; type: string }> }> {
    // Naive mapping: group components by type and generate example fields
    const typeCounts: Record<string, number> = {}
    components.forEach(c => {
      typeCounts[c.type] = (typeCounts[c.type] || 0) + 1
    })

    const entities = Object.keys(typeCounts).map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      fields: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'createdAt', type: 'string' }
      ]
    }))

    return entities
  }

  private generateEntitiesRoute(entities: Array<{ name: string; fields: Array<{ name: string; type: string }> }>): string {
    const routes = entities.map(e => {
      const base = e.name.toLowerCase()
      return `// ${e.name} endpoints
router.get('/${base}', (_req, res) => res.json({ items: [] }))
router.get('/${base}/:id', (req, res) => res.json({ id: req.params.id }))
router.post('/${base}', (req, res) => res.status(201).json({ ...req.body, id: Date.now().toString() }))
router.put('/${base}/:id', (req, res) => res.json({ id: req.params.id, ...req.body }))
router.delete('/${base}/:id', (req, res) => res.json({ success: true }))
`
    }).join('\n')

    return `import { Router } from 'express'

const router = Router()

${routes}

export default router
`
  }

  private generateBackendReadme(entities: Array<{ name: string }>, screens: Screen[]): string {
    return `# CTRL Generated Backend (Express)

This backend was generated based on your design. It includes:

- Health endpoint: \`GET /api/health\`
- Entity endpoints: ${entities.map(e => e.name).join(', ') || 'none'}
- Screens: ${screens.map(s => s.name).join(', ') || 'none'}

Run locally:

\`\`\`bash
npm install
npm run dev
\`\`\`
`
  }

  private generateTsconfig(): string {
    return `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "strict": true
  },
  "include": ["src"]
}`
  }

  private generatePackageJson(): string {
    return JSON.stringify({
      name: 'ctrl-generated-backend',
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'tsx src/server.ts',
        build: 'tsc',
        start: 'node dist/server.js'
      },
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        helmet: '^7.1.0',
        morgan: '^1.10.0'
      },
      devDependencies: {
        typescript: '^5.0.0',
        tsx: '^4.6.0',
        '@types/express': '^4.17.21'
      }
    }, null, 2)
  }
}


