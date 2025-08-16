import { Component, Screen } from '@/contexts/DesignContext'

export type Framework = 'react' | 'vue' | 'angular' | 'svelte' | 'vanilla'

interface CodeGenerationOptions {
  framework: Framework
  language: 'typescript' | 'javascript'
  styling: 'css' | 'tailwind' | 'styled-components' | 'scss'
  bundler: 'vite' | 'webpack' | 'parcel'
  features: {
    typescript: boolean
    testing: boolean
    linting: boolean
    formatting: boolean
  }
}

interface GeneratedCode {
  files: Array<{
    name: string
    path: string
    content: string
    language: string
  }>
  dependencies: Record<string, string>
  scripts: Record<string, string>
}

export class CodeGenerator {
  private options: CodeGenerationOptions

  constructor(options: CodeGenerationOptions) {
    this.options = options
  }

  generateProject(components: Component[], screens: Screen[]): GeneratedCode {
    const files = []
    const dependencies: Record<string, string> = {}
    const scripts: Record<string, string> = {}

    // Generate framework-specific files
    switch (this.options.framework) {
      case 'react':
        files.push(...this.generateReactFiles(components, screens))
        dependencies['react'] = '^18.0.0'
        dependencies['react-dom'] = '^18.0.0'
        break
      case 'vue':
        files.push(...this.generateVueFiles(components, screens))
        dependencies['vue'] = '^3.0.0'
        break
      case 'angular':
        files.push(...this.generateAngularFiles(components, screens))
        dependencies['@angular/core'] = '^15.0.0'
        dependencies['@angular/common'] = '^15.0.0'
        dependencies['@angular/platform-browser'] = '^15.0.0'
        break
      case 'svelte':
        files.push(...this.generateSvelteFiles(components, screens))
        dependencies['svelte'] = '^4.0.0'
        break
      case 'vanilla':
        files.push(...this.generateVanillaFiles(components, screens))
        break
    }

    // Add common dependencies
    this.addCommonDependencies(dependencies)

    // Generate configuration files
    files.push(...this.generateConfigFiles())

    // Generate package.json
    files.push(this.generatePackageJson(dependencies, scripts))

    return { files, dependencies, scripts }
  }

  private generateReactFiles(components: Component[], screens: Screen[]) {
    const files = []

    // Generate main App component
    const appComponent = this.generateReactAppComponent(components, screens)
    files.push({
      name: 'App.tsx',
      path: '/src/App.tsx',
      content: appComponent,
      language: 'typescript'
    })

    // Generate individual components
    components.forEach(component => {
      const componentCode = this.generateReactComponent(component)
      files.push({
        name: `${component.name}.tsx`,
        path: `/src/components/${component.name}.tsx`,
        content: componentCode,
        language: 'typescript'
      })
    })

    // Generate styles
    const styles = this.generateStyles(components)
    files.push({
      name: 'styles.css',
      path: '/src/styles.css',
      content: styles,
      language: 'css'
    })

    // Generate main entry point
    const mainTsx = this.generateReactMainTsx()
    files.push({
      name: 'main.tsx',
      path: '/src/main.tsx',
      content: mainTsx,
      language: 'typescript'
    })

    return files
  }

  // Provide missing helpers referenced above
  private generateReactMainTsx(): string {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`
  }

  private generateVueFiles(components: Component[], screens: Screen[]) {
    const files = []

    // Generate main App component
    const appComponent = this.generateVueAppComponent(components, screens)
    files.push({
      name: 'App.vue',
      path: '/src/App.vue',
      content: appComponent,
      language: 'vue'
    })

    // Generate individual components
    components.forEach(component => {
      const componentCode = this.generateVueComponent(component)
      files.push({
        name: `${component.name}.vue`,
        path: `/src/components/${component.name}.vue`,
        content: componentCode,
        language: 'vue'
      })
    })

    // Generate main entry point
    const mainTs = this.generateVueMainTs()
    files.push({
      name: 'main.ts',
      path: '/src/main.ts',
      content: mainTs,
      language: 'typescript'
    })

    return files
  }

  private generateVueMainTs(): string {
    return `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
`
  }

  private generateAngularFiles(components: Component[], screens: Screen[]) {
    const files = []

    // Generate main App component
    const appComponent = this.generateAngularAppComponent(components, screens)
    files.push({
      name: 'app.component.ts',
      path: '/src/app/app.component.ts',
      content: appComponent,
      language: 'typescript'
    })

    // Generate individual components
    components.forEach(component => {
      const componentCode = this.generateAngularComponent(component)
      files.push({
        name: `${component.name}.component.ts`,
        path: `/src/app/components/${component.name}.component.ts`,
        content: componentCode,
        language: 'typescript'
      })
    })

    // Generate module
    const appModule = this.generateAngularModule(components)
    files.push({
      name: 'app.module.ts',
      path: '/src/app/app.module.ts',
      content: appModule,
      language: 'typescript'
    })

    return files
  }

  private generateAngularModule(components: Component[]): string {
    const declarations = components.map(c => `${c.name}Component`).join(', ')
    return `import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { AppComponent } from './app.component'
${components.map(c => `import { ${c.name}Component } from './components/${c.name}.component'`).join('\n')}

@NgModule({
  declarations: [AppComponent${declarations ? ', ' + declarations : ''}],
  imports: [BrowserModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
`
  }

  private generateSvelteFiles(components: Component[], screens: Screen[]) {
    const files = []

    // Generate main App component
    const appComponent = this.generateSvelteAppComponent(components, screens)
    files.push({
      name: 'App.svelte',
      path: '/src/App.svelte',
      content: appComponent,
      language: 'svelte'
    })

    // Generate individual components
    components.forEach(component => {
      const componentCode = this.generateSvelteComponent(component)
      files.push({
        name: `${component.name}.svelte`,
        path: `/src/components/${component.name}.svelte`,
        content: componentCode,
        language: 'svelte'
      })
    })

    return files
  }

  private generateVanillaFiles(components: Component[], screens: Screen[]) {
    const files = []

    // Generate main HTML file
    const htmlContent = this.generateVanillaHTML(components, screens)
    files.push({
      name: 'index.html',
      path: '/index.html',
      content: htmlContent,
      language: 'html'
    })

    // Generate JavaScript
    const jsContent = this.generateVanillaJS(components, screens)
    files.push({
      name: 'app.js',
      path: '/src/app.js',
      content: jsContent,
      language: 'javascript'
    })

    // Generate styles
    const styles = this.generateStyles(components)
    files.push({
      name: 'styles.css',
      path: '/src/styles.css',
      content: styles,
      language: 'css'
    })

    return files
  }

  private generateReactAppComponent(components: Component[], screens: Screen[]): string {
    const componentImports = components.map(c => `import { ${c.name} } from './components/${c.name}'`).join('\n')
    const componentJSX = components.map(c => this.generateReactComponentJSX(c)).join('\n')

    return `import React from 'react'
import './styles.css'

${componentImports}

function App() {
  return (
    <div className="app">
      <div className="screen-container">
        ${componentJSX}
      </div>
    </div>
  )
}

export default App`
  }

  private generateReactComponent(component: Component): string {
    const props = this.generateComponentProps(component)
    const styles = this.generateComponentStyles(component)
    const content = this.generateComponentContent(component)

    return `import React from 'react'

interface ${component.name}Props {
  ${props}
}

export const ${component.name}: React.FC<${component.name}Props> = ({ ${Object.keys(component.props || {}).join(', ') }) => {
  return (
    <div className="${component.type}-component" style={${styles}}>
      ${content}
    </div>
  )
}`
  }

  private generateVueAppComponent(components: Component[], screens: Screen[]): string {
    const componentImports = components.map(c => `import ${c.name} from './components/${c.name}.vue'`).join('\n')
    const componentTemplate = components.map(c => this.generateVueComponentTemplate(c)).join('\n')

    return `<template>
  <div class="app">
    <div class="screen-container">
      ${componentTemplate}
    </div>
  </div>
</template>

<script setup lang="ts">
${componentImports}
</script>

<style scoped>
.app {
  width: 100%;
  height: 100vh;
}

.screen-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>`
  }

  private generateVueComponent(component: Component): string {
    const props = this.generateComponentProps(component)
    const styles = this.generateComponentStyles(component)
    const content = this.generateComponentContent(component)

    return `<template>
  <div class="${component.type}-component" :style="${styles}">
    ${content}
  </div>
</template>

<script setup lang="ts">
interface Props {
  ${props}
}

const props = defineProps<Props>()
</script>

<style scoped>
.${component.type}-component {
  /* Component styles */
}
</style>`
  }

  private generateAngularAppComponent(components: Component[], screens: Screen[]): string {
    const componentImports = components.map(c => `import { ${c.name}Component } from './components/${c.name}.component'`).join('\n')
    const componentTemplate = components.map(c => this.generateAngularComponentTemplate(c)).join('\n')

    return `import { Component } from '@angular/core'
${componentImports}

@Component({
  selector: 'app-root',
  template: \`
    <div class="app">
      <div class="screen-container">
        ${componentTemplate}
      </div>
    </div>
  \`,
  styles: [\`
    .app {
      width: 100%;
      height: 100vh;
    }
    .screen-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
  \`]
})
export class AppComponent {
  title = 'Generated App'
}`
  }

  private generateAngularComponent(component: Component): string {
    const props = this.generateComponentProps(component)
    const styles = this.generateComponentStyles(component)
    const content = this.generateComponentContent(component)

    return `import { Component, Input } from '@angular/core'

@Component({
  selector: 'app-${component.type}',
  template: \`
    <div class="${component.type}-component" [style]="${styles}">
      ${content}
    </div>
  \`,
  styles: [\`
    .${component.type}-component {
      /* Component styles */
    }
  \`]
})
export class ${component.name}Component {
  ${Object.entries(component.props || {}).map(([key, value]) => `@Input() ${key}: ${typeof value} = ${JSON.stringify(value)}`).join('\n  ')}
}`
  }

  private generateSvelteAppComponent(components: Component[], screens: Screen[]): string {
    const componentImports = components.map(c => `import ${c.name} from './components/${c.name}.svelte'`).join('\n')
    const componentTemplate = components.map(c => this.generateSvelteComponentTemplate(c)).join('\n')

    return `<script lang="ts">
${componentImports}
</script>

<div class="app">
  <div class="screen-container">
    ${componentTemplate}
  </div>
</div>

<style>
.app {
  width: 100%;
  height: 100vh;
}

.screen-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>`
  }

  private generateSvelteComponent(component: Component): string {
    const props = this.generateComponentProps(component)
    const styles = this.generateComponentStyles(component)
    const content = this.generateComponentContent(component)

    return `<script lang="ts">
interface Props {
  ${props}
}

export let ${Object.keys(component.props || {}).join(', ')}
</script>

<div class="${component.type}-component" style="${styles}">
  ${content}
</div>

<style>
.${component.type}-component {
  /* Component styles */
}
</style>`
  }

  private generateVanillaHTML(components: Component[], screens: Screen[]): string {
    const componentElements = components.map(c => this.generateVanillaHTMLElement(c)).join('\n')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
  <link rel="stylesheet" href="src/styles.css">
</head>
<body>
  <div class="app">
    <div class="screen-container">
      ${componentElements}
    </div>
  </div>
  <script src="src/app.js"></script>
</body>
</html>`
  }

  private generateVanillaJS(components: Component[], screens: Screen[]): string {
    const componentInitializations = components.map(c => this.generateVanillaJSComponent(c)).join('\n')

    return `// Generated JavaScript
document.addEventListener('DOMContentLoaded', () => {
  ${componentInitializations}
})`
  }

  private generateComponentProps(component: Component): string {
    if (!component.props) return ''
    return Object.entries(component.props)
      .map(([key, value]) => `${key}: ${typeof value}`)
      .join('\n  ')
  }

  private generateComponentStyles(component: Component): string {
    const styles = []
    
    if (component.position) {
      styles.push(`position: 'absolute'`)
      styles.push(`left: '${component.position.x}px'`)
      styles.push(`top: '${component.position.y}px'`)
    }
    
    if (component.size) {
      styles.push(`width: '${component.size.width}px'`)
      styles.push(`height: '${component.size.height}px'`)
    }
    
    if (component.backgroundColor) {
      styles.push(`backgroundColor: '${component.backgroundColor}'`)
    }
    
    if (component.zIndex) {
      styles.push(`zIndex: ${component.zIndex}`)
    }
    
    return `{${styles.join(', ')}}`
  }

  private generateComponentContent(component: Component): string {
    switch (component.type) {
      case 'button':
        return `<button class="btn">${component.name}</button>`
      case 'input':
        return `<input type="text" placeholder="${component.name}" class="input" />`
      case 'text':
        return `<h3>${component.name}</h3><p>${component.props?.content || 'Text content'}</p>`
      case 'image':
        return `<img src="${component.props?.src || 'placeholder.jpg'}" alt="${component.name}" class="image" />`
      case 'form':
        return `<form class="form"><input type="text" placeholder="Name" /><button type="submit">Submit</button></form>`
      default:
        return `<div class="${component.type}">${component.name}</div>`
    }
  }

  private generateReactComponentJSX(component: Component): string {
    const styles = this.generateComponentStyles(component)
    const content = this.generateComponentContent(component)
    
    return `<${component.name} style={${styles}} />`
  }

  private generateVueComponentTemplate(component: Component): string {
    const styles = this.generateComponentStyles(component)
    
    return `<${component.name} :style="${styles}" />`
  }

  private generateAngularComponentTemplate(component: Component): string {
    const styles = this.generateComponentStyles(component)
    
    return `<app-${component.type} [style]="${styles}"></app-${component.type}>`
  }

  private generateSvelteComponentTemplate(component: Component): string {
    const styles = this.generateComponentStyles(component)
    
    return `<${component.name} style="${styles}" />`
  }

  private generateVanillaHTMLElement(component: Component): string {
    const styles = this.generateComponentStyles(component)
    const content = this.generateComponentContent(component)
    
    return `<div class="${component.type}-component" style="${styles}">${content}</div>`
  }

  private generateVanillaJSComponent(component: Component): string {
    return `// Initialize ${component.name} component
const ${component.name.toLowerCase()} = document.querySelector('.${component.type}-component')
if (${component.name.toLowerCase()}) {
  // Add event listeners and functionality
}`
  }

  private generateStyles(components: Component[]): string {
    return `/* Generated Styles */
.app {
  width: 100%;
  height: 100vh;
  font-family: Arial, sans-serif;
}

.screen-container {
  position: relative;
  width: 100%;
  height: 100%;
}

${components.map(c => `
.${c.type}-component {
  position: absolute;
  left: ${c.position?.x || 0}px;
  top: ${c.position?.y || 0}px;
  width: ${c.size?.width || 100}px;
  height: ${c.size?.height || 100}px;
  ${c.backgroundColor ? `background-color: ${c.backgroundColor};` : ''}
  ${c.zIndex ? `z-index: ${c.zIndex};` : ''}
}`).join('\n')}`
  }

  private generateConfigFiles() {
    const files = []

    // Generate framework-specific config files
    switch (this.options.framework) {
      case 'react':
        files.push({
          name: 'vite.config.ts',
          path: '/vite.config.ts',
          content: this.generateViteConfig(),
          language: 'typescript'
        })
        break
      case 'vue':
        files.push({
          name: 'vite.config.ts',
          path: '/vite.config.ts',
          content: this.generateVueViteConfig(),
          language: 'typescript'
        })
        break
      case 'angular':
        files.push({
          name: 'angular.json',
          path: '/angular.json',
          content: this.generateAngularConfig(),
          language: 'json'
        })
        break
    }

    return files
  }

  private generateViteConfig(): string {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`
  }

  private generateVueViteConfig(): string {
    return `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  }
})`
  }

  private generateAngularConfig(): string {
    return `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "generated-app": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/generated-app",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ],
            "styles": [
              "src/styles.css"
            ],
            "scripts": []
          }
        }
      }
    }
  }
}`
  }

  private generatePackageJson(dependencies: Record<string, string>, scripts: Record<string, string>): any {
    return {
      name: 'package.json',
      path: '/package.json',
      content: JSON.stringify({
        name: 'generated-app',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
          ...scripts
        },
        dependencies,
        devDependencies: {
          '@types/node': '^18.0.0',
          'typescript': '^5.0.0',
          'vite': '^4.0.0'
        }
      }, null, 2),
      language: 'json'
    }
  }

  private addCommonDependencies(dependencies: Record<string, string>) {
    // Add common dependencies based on options
    if (this.options.features.typescript) {
      dependencies['typescript'] = '^5.0.0'
    }
    
    if (this.options.styling === 'tailwind') {
      dependencies['tailwindcss'] = '^3.0.0'
      dependencies['autoprefixer'] = '^10.0.0'
      dependencies['postcss'] = '^8.0.0'
    }
    
    if (this.options.features.testing) {
      dependencies['@testing-library/react'] = '^13.0.0'
      dependencies['vitest'] = '^0.30.0'
    }
  }
}
