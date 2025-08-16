/**
 * CTRL Shared Data Model - Single Source of Truth
 * This serves as the central AST for bidirectional UI-Logic-Code synchronization
 */
export interface CTRLProject {
    id: string;
    name: string;
    description: string;
    version: string;
    created: string;
    modified: string;
    author: string;
    screens: Screen[];
    components: UIComponent[];
    logicGraph: LogicGraph;
    codeModel: CodeModel;
    settings: ProjectSettings;
    dependencies: ProjectDependency[];
}
export interface ProjectSettings {
    framework: 'react' | 'vue' | 'angular' | 'svelte' | 'react-native' | 'flutter';
    language: 'typescript' | 'javascript' | 'dart';
    styling: 'tailwind' | 'css' | 'styled-components' | 'emotion';
    bundler: 'vite' | 'webpack' | 'parcel';
    targetPlatform: 'web' | 'mobile' | 'desktop';
    aiAssistance: boolean;
    realTimeSync: boolean;
}
export interface ProjectDependency {
    name: string;
    version: string;
    type: 'dependency' | 'devDependency' | 'peerDependency';
}
export interface UIComponent {
    id: string;
    name: string;
    type: ComponentType;
    parentId?: string;
    screenId?: string;
    position: Position;
    size: Size;
    transform: Transform;
    styling: ComponentStyling;
    props: Record<string, any>;
    state: Record<string, any>;
    events: ComponentEvent[];
    logicBindings: LogicBinding[];
    children: string[];
    locked: boolean;
    visible: boolean;
    zIndex: number;
    created: string;
    modified: string;
    codeMetadata: CodeMetadata;
}
export type ComponentType = 'container' | 'text' | 'button' | 'input' | 'image' | 'video' | 'list' | 'grid' | 'card' | 'modal' | 'dropdown' | 'tabs' | 'form' | 'table' | 'chart' | 'custom';
export interface Position {
    x: number;
    y: number;
    unit: 'px' | '%' | 'rem' | 'vh' | 'vw';
}
export interface Size {
    width: number;
    height: number;
    unit: 'px' | '%' | 'rem' | 'vh' | 'vw';
    aspectRatio?: number;
}
export interface Transform {
    rotation: number;
    scaleX: number;
    scaleY: number;
    skewX: number;
    skewY: number;
}
export interface ComponentStyling {
    backgroundColor?: string;
    borderRadius?: number;
    border?: string;
    padding?: Spacing;
    margin?: Spacing;
    typography?: Typography;
    shadow?: string;
    opacity?: number;
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    display?: 'block' | 'inline' | 'flex' | 'grid' | 'none';
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
    customCSS?: string;
}
export interface Spacing {
    top: number;
    right: number;
    bottom: number;
    left: number;
    unit: 'px' | 'rem' | '%';
}
export interface Typography {
    fontFamily: string;
    fontSize: number;
    fontWeight: number | string;
    lineHeight: number;
    letterSpacing: number;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    color: string;
    textDecoration?: 'none' | 'underline' | 'line-through';
}
export interface ComponentEvent {
    id: string;
    type: EventType;
    logicNodeId?: string;
    handler?: string;
    conditions?: EventCondition[];
}
export type EventType = 'click' | 'doubleClick' | 'mouseEnter' | 'mouseLeave' | 'keyDown' | 'keyUp' | 'input' | 'change' | 'submit' | 'focus' | 'blur' | 'scroll' | 'touchStart' | 'touchEnd' | 'gestureStart' | 'gestureEnd';
export interface EventCondition {
    type: 'key' | 'modifier' | 'value' | 'custom';
    value: any;
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith';
}
export interface LogicGraph {
    nodes: LogicNode[];
    connections: LogicConnection[];
    variables: LogicVariable[];
    functions: LogicFunction[];
}
export interface LogicNode {
    id: string;
    type: LogicNodeType;
    name: string;
    description?: string;
    position: Position;
    size: Size;
    data: Record<string, any>;
    inputs: LogicPort[];
    outputs: LogicPort[];
    executionOrder?: number;
    async?: boolean;
    color?: string;
    collapsed?: boolean;
    created: string;
    modified: string;
}
export type LogicNodeType = 'event' | 'condition' | 'action' | 'variable' | 'function' | 'apiCall' | 'navigation' | 'stateChange' | 'timer' | 'mathOperation' | 'stringOperation' | 'arrayOperation' | 'conditional' | 'loop' | 'switch' | 'sequence' | 'comment' | 'group' | 'subgraph';
export interface LogicPort {
    id: string;
    name: string;
    type: DataType;
    required: boolean;
    defaultValue?: any;
    description?: string;
}
export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'promise' | 'event' | 'component' | 'any';
export interface LogicConnection {
    id: string;
    fromNodeId: string;
    fromPortId: string;
    toNodeId: string;
    toPortId: string;
    type: ConnectionType;
    animated?: boolean;
    color?: string;
    transform?: DataTransform;
    created: string;
}
export type ConnectionType = 'data' | 'execution' | 'event';
export interface DataTransform {
    type: 'none' | 'map' | 'filter' | 'reduce' | 'custom';
    expression?: string;
    function?: string;
}
export interface LogicVariable {
    id: string;
    name: string;
    type: DataType;
    scope: 'global' | 'screen' | 'component' | 'function';
    initialValue?: any;
    persistent?: boolean;
    description?: string;
}
export interface LogicFunction {
    id: string;
    name: string;
    description?: string;
    parameters: LogicFunctionParameter[];
    returnType: DataType;
    body: LogicNode[];
    async?: boolean;
}
export interface LogicFunctionParameter {
    name: string;
    type: DataType;
    required: boolean;
    defaultValue?: any;
}
export interface CodeModel {
    files: CodeFile[];
    entryPoint: string;
    buildConfig: BuildConfig;
    generatedAt: string;
}
export interface CodeFile {
    id: string;
    path: string;
    name: string;
    extension: string;
    content: string;
    generated: boolean;
    editable: boolean;
    ast?: any;
    sourceMap?: SourceMap;
    imports: ImportStatement[];
    exports: ExportStatement[];
    size: number;
    lineCount: number;
    lastModified: string;
}
export interface SourceMap {
    version: number;
    sources: string[];
    mappings: string;
    names: string[];
}
export interface ImportStatement {
    module: string;
    imports: string[];
    type: 'default' | 'named' | 'namespace' | 'side-effect';
}
export interface ExportStatement {
    name: string;
    type: 'default' | 'named';
    value?: string;
}
export interface BuildConfig {
    target: string;
    outputDir: string;
    publicDir: string;
    assetsDir: string;
    minify: boolean;
    sourcemap: boolean;
    externals: string[];
}
export interface Screen {
    id: string;
    name: string;
    route?: string;
    type: ScreenType;
    size: Size;
    backgroundColor?: string;
    rootComponentId?: string;
    componentIds: string[];
    screenLogic: ScreenLogic;
    transitions: ScreenTransition[];
    created: string;
    modified: string;
}
export type ScreenType = 'page' | 'modal' | 'popup' | 'drawer' | 'sheet';
export interface ScreenLogic {
    onMount?: string;
    onUnmount?: string;
    onShow?: string;
    onHide?: string;
    variables: LogicVariable[];
}
export interface ScreenTransition {
    id: string;
    targetScreenId: string;
    trigger: TransitionTrigger;
    animation: TransitionAnimation;
}
export interface TransitionTrigger {
    type: 'navigation' | 'timer' | 'condition' | 'event';
    config: Record<string, any>;
}
export interface TransitionAnimation {
    type: 'slide' | 'fade' | 'scale' | 'flip' | 'push' | 'pop';
    duration: number;
    easing: string;
    direction?: 'left' | 'right' | 'up' | 'down';
}
export interface LogicBinding {
    id: string;
    componentId: string;
    componentProperty: string;
    sourceType: 'variable' | 'function' | 'expression' | 'logicNode';
    sourceId: string;
    transform?: DataTransform;
    conditions?: LogicCondition[];
    triggers: BindingTrigger[];
}
export interface LogicCondition {
    id: string;
    expression: string;
    variables: string[];
}
export interface BindingTrigger {
    type: 'always' | 'onChange' | 'onEvent' | 'conditional';
    config: Record<string, any>;
}
export interface CodeMetadata {
    generatedComponents: string[];
    customCode: Record<string, string>;
    dependencies: string[];
    hooks: string[];
    imports: string[];
    lastSyncedAt: string;
    manuallyEdited: boolean;
    conflicts: CodeConflict[];
}
export interface CodeConflict {
    id: string;
    type: 'property' | 'method' | 'import' | 'structure';
    path: string;
    description: string;
    autoGenerated: string;
    manualEdit: string;
    resolved: boolean;
}
export interface SyncEvent {
    id: string;
    timestamp: string;
    userId: string;
    type: SyncEventType;
    data: any;
    affectedModes: ('design' | 'logic' | 'code')[];
}
export type SyncEventType = 'component.create' | 'component.update' | 'component.delete' | 'logic.node.create' | 'logic.node.update' | 'logic.node.delete' | 'logic.connection.create' | 'logic.connection.delete' | 'code.file.update' | 'code.file.create' | 'code.file.delete' | 'screen.create' | 'screen.update' | 'screen.delete' | 'project.settings.update';
export interface ModelValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    path: string;
    message: string;
    code: string;
}
export interface ValidationWarning {
    path: string;
    message: string;
    suggestion?: string;
}
export interface ModelUtils {
    validateProject(project: CTRLProject): ModelValidationResult;
    generateCode(project: CTRLProject): CodeModel;
    parseCode(files: CodeFile[]): Partial<CTRLProject>;
    syncModels(source: 'design' | 'logic' | 'code', project: CTRLProject): CTRLProject;
    createComponent(type: ComponentType, position: Position): UIComponent;
    createLogicNode(type: LogicNodeType, position: Position): LogicNode;
    createScreen(name: string, type: ScreenType): Screen;
}
//# sourceMappingURL=SharedModel.d.ts.map