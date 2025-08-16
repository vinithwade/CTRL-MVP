/**
 * CTRL Model Synchronization Engine
 * Handles bidirectional synchronization between Design, Logic, and Code modes
 */
import { CTRLProject, UIComponent, LogicNode, SyncEvent, SyncEventType, ModelValidationResult } from '../types/SharedModel';
export declare class ModelSyncEngine {
    private project;
    private listeners;
    private pendingSync;
    constructor(project: CTRLProject);
    private initializeListeners;
    /**
     * Register a listener for specific sync events
     */
    on(eventType: SyncEventType, callback: (event: SyncEvent) => void): void;
    /**
     * Emit a sync event to all registered listeners
     */
    private emit;
    /**
     * Validate the current project model
     */
    validateModel(): ModelValidationResult;
    /**
     * Sync from Design Mode changes
     */
    syncFromDesign(changeType: 'create' | 'update' | 'delete', data: any): void;
    /**
     * Sync from Logic Mode changes
     */
    syncFromLogic(changeType: 'create' | 'update' | 'delete', nodeType: 'node' | 'connection', data: any): void;
    /**
     * Sync from Code Mode changes
     */
    syncFromCode(changeType: 'create' | 'update' | 'delete', data: any): void;
    /**
     * Process a sync event and update the model accordingly
     */
    private processSyncEvent;
    private handleComponentCreate;
    private handleComponentUpdate;
    private handleComponentDelete;
    private handleLogicNodeCreate;
    private handleLogicNodeUpdate;
    private handleLogicNodeDelete;
    private handleLogicConnectionCreate;
    private handleLogicConnectionDelete;
    private handleCodeFileUpdate;
    private handleCodeFileCreate;
    private handleCodeFileDelete;
    private updateCodeFromComponent;
    private generateComponentCode;
    private generateReactComponent;
    private generatePropsInterface;
    private generateStyles;
    private generateEventHandlers;
    private generateJSX;
    private generateClassName;
    private updateCodeFromLogicNode;
    private updateCodeFromConnection;
    private createLogicNodeForComponent;
    private updateLogicNodeForComponent;
    private removeLogicNodeForComponent;
    private removeCodeForComponent;
    private removeCodeForLogicNode;
    private removeCodeForConnection;
    private parseCodeToUpdateModel;
    private parseReactComponent;
    private generateVueComponent;
    private generateAngularComponent;
    private generateId;
    /**
     * Get the current project state
     */
    getProject(): CTRLProject;
    /**
     * Update the entire project
     */
    updateProject(project: CTRLProject): void;
    /**
     * Get components for a specific screen
     */
    getComponentsForScreen(screenId: string): UIComponent[];
    /**
     * Get logic nodes connected to a component
     */
    getLogicNodesForComponent(componentId: string): LogicNode[];
    /**
     * Export project to JSON
     */
    exportProject(): string;
    /**
     * Import project from JSON
     */
    importProject(jsonData: string): void;
}
export default ModelSyncEngine;
//# sourceMappingURL=ModelSync.d.ts.map