/**
 * CTRL Model Synchronization Engine
 * Handles bidirectional synchronization between Design, Logic, and Code modes
 */
export class ModelSyncEngine {
    constructor(project) {
        this.listeners = new Map();
        this.pendingSync = false;
        this.project = project;
        this.initializeListeners();
    }
    initializeListeners() {
        // Initialize event listeners for all sync event types
        const eventTypes = [
            'component.create', 'component.update', 'component.delete',
            'logic.node.create', 'logic.node.update', 'logic.node.delete',
            'logic.connection.create', 'logic.connection.delete',
            'code.file.update', 'code.file.create', 'code.file.delete',
            'screen.create', 'screen.update', 'screen.delete',
            'project.settings.update'
        ];
        eventTypes.forEach(type => {
            this.listeners.set(type, []);
        });
    }
    /**
     * Register a listener for specific sync events
     */
    on(eventType, callback) {
        const listeners = this.listeners.get(eventType) || [];
        listeners.push(callback);
        this.listeners.set(eventType, listeners);
    }
    /**
     * Emit a sync event to all registered listeners
     */
    emit(event) {
        const listeners = this.listeners.get(event.type) || [];
        listeners.forEach(callback => callback(event));
    }
    /**
     * Validate the current project model
     */
    validateModel() {
        const errors = [];
        const warnings = [];
        // Validate components
        this.project.components.forEach(component => {
            if (!component.id) {
                errors.push({
                    path: `components.${component.name}`,
                    message: 'Component must have an ID',
                    code: 'MISSING_ID'
                });
            }
            if (!component.name) {
                errors.push({
                    path: `components.${component.id}`,
                    message: 'Component must have a name',
                    code: 'MISSING_NAME'
                });
            }
            // Validate parent-child relationships
            if (component.parentId) {
                const parent = this.project.components.find(c => c.id === component.parentId);
                if (!parent) {
                    errors.push({
                        path: `components.${component.id}.parentId`,
                        message: 'Parent component not found',
                        code: 'INVALID_PARENT'
                    });
                }
            }
            // Validate screen references
            if (component.screenId) {
                const screen = this.project.screens.find(s => s.id === component.screenId);
                if (!screen) {
                    errors.push({
                        path: `components.${component.id}.screenId`,
                        message: 'Referenced screen not found',
                        code: 'INVALID_SCREEN'
                    });
                }
            }
        });
        // Validate logic nodes
        this.project.logicGraph.nodes.forEach(node => {
            if (!node.id) {
                errors.push({
                    path: `logicGraph.nodes.${node.name}`,
                    message: 'Logic node must have an ID',
                    code: 'MISSING_ID'
                });
            }
            if (!node.name) {
                errors.push({
                    path: `logicGraph.nodes.${node.id}`,
                    message: 'Logic node must have a name',
                    code: 'MISSING_NAME'
                });
            }
        });
        // Validate logic connections
        this.project.logicGraph.connections.forEach(connection => {
            const fromNode = this.project.logicGraph.nodes.find(n => n.id === connection.fromNodeId);
            const toNode = this.project.logicGraph.nodes.find(n => n.id === connection.toNodeId);
            if (!fromNode) {
                errors.push({
                    path: `logicGraph.connections.${connection.id}.fromNodeId`,
                    message: 'Source node not found',
                    code: 'INVALID_SOURCE_NODE'
                });
            }
            if (!toNode) {
                errors.push({
                    path: `logicGraph.connections.${connection.id}.toNodeId`,
                    message: 'Target node not found',
                    code: 'INVALID_TARGET_NODE'
                });
            }
        });
        // Validate screens
        this.project.screens.forEach(screen => {
            if (!screen.id) {
                errors.push({
                    path: `screens.${screen.name}`,
                    message: 'Screen must have an ID',
                    code: 'MISSING_ID'
                });
            }
            if (!screen.name) {
                errors.push({
                    path: `screens.${screen.id}`,
                    message: 'Screen must have a name',
                    code: 'MISSING_NAME'
                });
            }
            // Validate component references
            screen.componentIds.forEach(componentId => {
                const component = this.project.components.find(c => c.id === componentId);
                if (!component) {
                    warnings.push({
                        path: `screens.${screen.id}.componentIds`,
                        message: `Referenced component ${componentId} not found`,
                        suggestion: 'Remove the reference or create the component'
                    });
                }
            });
        });
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Sync from Design Mode changes
     */
    syncFromDesign(changeType, data) {
        const event = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            userId: 'current-user', // TODO: Get from auth context
            type: `component.${changeType}`,
            data,
            affectedModes: ['logic', 'code']
        };
        this.processSyncEvent(event);
        this.emit(event);
    }
    /**
     * Sync from Logic Mode changes
     */
    syncFromLogic(changeType, nodeType, data) {
        const event = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            userId: 'current-user', // TODO: Get from auth context
            type: `logic.${nodeType}.${changeType}`,
            data,
            affectedModes: ['design', 'code']
        };
        this.processSyncEvent(event);
        this.emit(event);
    }
    /**
     * Sync from Code Mode changes
     */
    syncFromCode(changeType, data) {
        const event = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            userId: 'current-user', // TODO: Get from auth context
            type: `code.file.${changeType}`,
            data,
            affectedModes: ['design', 'logic']
        };
        this.processSyncEvent(event);
        this.emit(event);
    }
    /**
     * Process a sync event and update the model accordingly
     */
    processSyncEvent(event) {
        if (this.pendingSync)
            return; // Prevent infinite loops
        this.pendingSync = true;
        try {
            switch (event.type) {
                case 'component.create':
                    this.handleComponentCreate(event.data);
                    break;
                case 'component.update':
                    this.handleComponentUpdate(event.data);
                    break;
                case 'component.delete':
                    this.handleComponentDelete(event.data);
                    break;
                case 'logic.node.create':
                    this.handleLogicNodeCreate(event.data);
                    break;
                case 'logic.node.update':
                    this.handleLogicNodeUpdate(event.data);
                    break;
                case 'logic.node.delete':
                    this.handleLogicNodeDelete(event.data);
                    break;
                case 'logic.connection.create':
                    this.handleLogicConnectionCreate(event.data);
                    break;
                case 'logic.connection.delete':
                    this.handleLogicConnectionDelete(event.data);
                    break;
                case 'code.file.update':
                    this.handleCodeFileUpdate(event.data);
                    break;
                case 'code.file.create':
                    this.handleCodeFileCreate(event.data);
                    break;
                case 'code.file.delete':
                    this.handleCodeFileDelete(event.data);
                    break;
                default:
                    console.warn(`Unhandled sync event type: ${event.type}`);
            }
        }
        finally {
            this.pendingSync = false;
        }
    }
    // Event handlers
    handleComponentCreate(component) {
        this.project.components.push(component);
        this.updateCodeFromComponent(component);
        this.createLogicNodeForComponent(component);
    }
    handleComponentUpdate(data) {
        const component = this.project.components.find(c => c.id === data.id);
        if (component) {
            Object.assign(component, data.updates);
            component.modified = new Date().toISOString();
            this.updateCodeFromComponent(component);
            this.updateLogicNodeForComponent(component);
        }
    }
    handleComponentDelete(componentId) {
        this.project.components = this.project.components.filter(c => c.id !== componentId);
        this.removeCodeForComponent(componentId);
        this.removeLogicNodeForComponent(componentId);
    }
    handleLogicNodeCreate(node) {
        this.project.logicGraph.nodes.push(node);
        this.updateCodeFromLogicNode(node);
    }
    handleLogicNodeUpdate(data) {
        const node = this.project.logicGraph.nodes.find(n => n.id === data.id);
        if (node) {
            Object.assign(node, data.updates);
            node.modified = new Date().toISOString();
            this.updateCodeFromLogicNode(node);
        }
    }
    handleLogicNodeDelete(nodeId) {
        this.project.logicGraph.nodes = this.project.logicGraph.nodes.filter(n => n.id !== nodeId);
        this.project.logicGraph.connections = this.project.logicGraph.connections.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId);
        this.removeCodeForLogicNode(nodeId);
    }
    handleLogicConnectionCreate(connection) {
        this.project.logicGraph.connections.push(connection);
        this.updateCodeFromConnection(connection);
    }
    handleLogicConnectionDelete(connectionId) {
        this.project.logicGraph.connections = this.project.logicGraph.connections.filter(c => c.id !== connectionId);
        this.removeCodeForConnection(connectionId);
    }
    handleCodeFileUpdate(data) {
        const file = this.project.codeModel.files.find(f => f.path === data.path);
        if (file) {
            file.content = data.content;
            file.lastModified = new Date().toISOString();
            this.parseCodeToUpdateModel(file);
        }
    }
    handleCodeFileCreate(file) {
        this.project.codeModel.files.push(file);
        this.parseCodeToUpdateModel(file);
    }
    handleCodeFileDelete(filePath) {
        this.project.codeModel.files = this.project.codeModel.files.filter(f => f.path !== filePath);
    }
    // Code generation and parsing methods
    updateCodeFromComponent(component) {
        // Generate/update React component code
        const componentCode = this.generateComponentCode(component);
        const fileName = `${component.name}.tsx`;
        const filePath = `src/components/${fileName}`;
        let file = this.project.codeModel.files.find(f => f.path === filePath);
        if (!file) {
            file = {
                id: this.generateId(),
                path: filePath,
                name: fileName,
                extension: 'tsx',
                content: componentCode,
                generated: true,
                editable: true,
                imports: [],
                exports: [],
                size: componentCode.length,
                lineCount: componentCode.split('\n').length,
                lastModified: new Date().toISOString()
            };
            this.project.codeModel.files.push(file);
        }
        else {
            file.content = componentCode;
            file.lastModified = new Date().toISOString();
            file.size = componentCode.length;
            file.lineCount = componentCode.split('\n').length;
        }
    }
    generateComponentCode(component) {
        const framework = this.project.settings.framework;
        switch (framework) {
            case 'react':
                return this.generateReactComponent(component);
            case 'vue':
                return this.generateVueComponent(component);
            case 'angular':
                return this.generateAngularComponent(component);
            default:
                return this.generateReactComponent(component);
        }
    }
    generateReactComponent(component) {
        const props = this.generatePropsInterface(component);
        const styles = this.generateStyles(component);
        const eventHandlers = this.generateEventHandlers(component);
        const jsx = this.generateJSX(component);
        return `import React from 'react'
${component.codeMetadata?.imports.join('\n') || ''}

${props}

export function ${component.name}(props: ${component.name}Props) {
  ${eventHandlers}

  return (
    ${jsx}
  )
}

${styles}`;
    }
    generatePropsInterface(component) {
        const propEntries = Object.entries(component.props).map(([key, value]) => {
            const type = typeof value === 'string' ? 'string' :
                typeof value === 'number' ? 'number' :
                    typeof value === 'boolean' ? 'boolean' : 'any';
            return `  ${key}?: ${type}`;
        });
        return `interface ${component.name}Props {
${propEntries.join('\n')}
  children?: React.ReactNode
}`;
    }
    generateStyles(component) {
        if (this.project.settings.styling === 'tailwind') {
            return ''; // Styles are handled via className
        }
        const styles = component.styling;
        const cssRules = [];
        if (styles.backgroundColor)
            cssRules.push(`background-color: ${styles.backgroundColor}`);
        if (styles.border)
            cssRules.push(`border: ${styles.border}`);
        if (styles.borderRadius)
            cssRules.push(`border-radius: ${styles.borderRadius}px`);
        if (styles.padding) {
            const p = styles.padding;
            cssRules.push(`padding: ${p.top}${p.unit} ${p.right}${p.unit} ${p.bottom}${p.unit} ${p.left}${p.unit}`);
        }
        if (styles.customCSS)
            cssRules.push(styles.customCSS);
        return `const styles = {
  container: {
    ${cssRules.join(',\n    ')}
  }
}`;
    }
    generateEventHandlers(component) {
        return component.events.map(event => {
            if (event.logicNodeId) {
                // Connect to logic node
                return `const handle${event.type.charAt(0).toUpperCase() + event.type.slice(1)} = () => {
    // Logic node: ${event.logicNodeId}
    executeLogicNode('${event.logicNodeId}')
  }`;
            }
            else if (event.handler) {
                // Direct code handler
                return `const handle${event.type.charAt(0).toUpperCase() + event.type.slice(1)} = ${event.handler}`;
            }
            return '';
        }).filter(Boolean).join('\n\n  ');
    }
    generateJSX(component) {
        const className = this.generateClassName(component);
        const eventProps = component.events.map(event => {
            const handlerName = `handle${event.type.charAt(0).toUpperCase() + event.type.slice(1)}`;
            return `on${event.type.charAt(0).toUpperCase() + event.type.slice(1)}={${handlerName}}`;
        }).join(' ');
        const styleProps = this.project.settings.styling === 'tailwind' ?
            `className="${className}"` :
            'style={styles.container}';
        switch (component.type) {
            case 'button':
                return `<button ${styleProps} ${eventProps}>
      {props.children || '${component.props.text || 'Button'}'}
    </button>`;
            case 'text':
                return `<span ${styleProps}>
      {props.children || '${component.props.text || 'Text'}'}
    </span>`;
            case 'input':
                return `<input ${styleProps} ${eventProps} 
      type="${component.props.type || 'text'}"
      placeholder="${component.props.placeholder || ''}"
    />`;
            case 'container':
                const children = component.children.map(childId => {
                    const child = this.project.components.find(c => c.id === childId);
                    return child ? `<${child.name} />` : '';
                }).join('\n      ');
                return `<div ${styleProps}>
      ${children}
      {props.children}
    </div>`;
            default:
                return `<div ${styleProps}>
      {props.children}
    </div>`;
        }
    }
    generateClassName(component) {
        // Generate Tailwind classes based on styling
        const classes = [];
        if (component.styling.backgroundColor) {
            // Convert hex/rgb to Tailwind color if possible
            classes.push('bg-gray-100'); // Simplified for demo
        }
        if (component.styling.padding) {
            classes.push('p-4'); // Simplified for demo
        }
        if (component.styling.borderRadius) {
            classes.push('rounded');
        }
        return classes.join(' ');
    }
    updateCodeFromLogicNode(node) {
        // Generate logic handler code
        // This would create functions that implement the logic node behavior
    }
    updateCodeFromConnection(connection) {
        // Update code to reflect logic connections
        // This would modify function calls and data flow
    }
    createLogicNodeForComponent(component) {
        // Automatically create logic nodes for component events
        component.events.forEach(event => {
            if (!event.logicNodeId) {
                const logicNode = {
                    id: this.generateId(),
                    type: 'event',
                    name: `${component.name} ${event.type}`,
                    position: { x: 0, y: 0, unit: 'px' },
                    size: { width: 200, height: 100, unit: 'px' },
                    data: {
                        componentId: component.id,
                        eventType: event.type
                    },
                    inputs: [],
                    outputs: [
                        {
                            id: this.generateId(),
                            name: 'trigger',
                            type: 'event',
                            required: false
                        }
                    ],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };
                this.project.logicGraph.nodes.push(logicNode);
                event.logicNodeId = logicNode.id;
            }
        });
    }
    updateLogicNodeForComponent(component) {
        // Update existing logic nodes when component changes
    }
    removeLogicNodeForComponent(componentId) {
        // Remove logic nodes associated with deleted component
        this.project.logicGraph.nodes = this.project.logicGraph.nodes.filter(node => node.data?.componentId !== componentId);
    }
    removeCodeForComponent(componentId) {
        // Remove code files for deleted component
        const component = this.project.components.find(c => c.id === componentId);
        if (component) {
            const filePath = `src/components/${component.name}.tsx`;
            this.project.codeModel.files = this.project.codeModel.files.filter(f => f.path !== filePath);
        }
    }
    removeCodeForLogicNode(nodeId) {
        // Remove or update code affected by deleted logic node
    }
    removeCodeForConnection(connectionId) {
        // Remove or update code affected by deleted connection
    }
    parseCodeToUpdateModel(file) {
        // Parse code changes back to update the model
        // This would use AST parsing to extract component structure and logic
        if (file.extension === 'tsx' || file.extension === 'jsx') {
            this.parseReactComponent(file);
        }
    }
    parseReactComponent(file) {
        // Parse React component to update UI component model
        // This would use a TypeScript/JavaScript parser to extract:
        // - Component props
        // - JSX structure
        // - Event handlers
        // - Styling information
    }
    generateVueComponent(component) {
        // Generate Vue component code
        return `<template>
  <!-- Vue component for ${component.name} -->
</template>

<script setup lang="ts">
// Vue component logic
</script>

<style scoped>
/* Component styles */
</style>`;
    }
    generateAngularComponent(component) {
        // Generate Angular component code
        return `import { Component } from '@angular/core'

@Component({
  selector: 'app-${component.name.toLowerCase()}',
  template: \`
    <!-- Angular component template -->
  \`,
  styles: [\`
    /* Component styles */
  \`]
})
export class ${component.name}Component {
  // Component logic
}`;
    }
    generateId() {
        return `ctrl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get the current project state
     */
    getProject() {
        return this.project;
    }
    /**
     * Update the entire project
     */
    updateProject(project) {
        this.project = project;
    }
    /**
     * Get components for a specific screen
     */
    getComponentsForScreen(screenId) {
        return this.project.components.filter(component => component.screenId === screenId);
    }
    /**
     * Get logic nodes connected to a component
     */
    getLogicNodesForComponent(componentId) {
        return this.project.logicGraph.nodes.filter(node => node.data?.componentId === componentId);
    }
    /**
     * Export project to JSON
     */
    exportProject() {
        return JSON.stringify(this.project, null, 2);
    }
    /**
     * Import project from JSON
     */
    importProject(jsonData) {
        try {
            const project = JSON.parse(jsonData);
            const validation = this.validateModel();
            if (validation.valid) {
                this.project = project;
            }
            else {
                throw new Error(`Invalid project data: ${validation.errors.map(e => e.message).join(', ')}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to import project: ${error}`);
        }
    }
}
export default ModelSyncEngine;
//# sourceMappingURL=ModelSync.js.map