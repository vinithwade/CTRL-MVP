interface ChatMessage {
    message: string;
    context?: string;
    userId?: string;
    timestamp: Date;
}
interface BatchProcessRequest {
    data: any[];
    operation: string;
    options?: Record<string, any>;
}
interface AIResponse {
    id: string;
    content: string;
    confidence: number;
    metadata: Record<string, any>;
    timestamp: Date;
}
export declare class AIService {
    private openai;
    private isInitialized;
    constructor();
    private initializeAI;
    processChatMessage(request: ChatMessage): Promise<AIResponse>;
    batchProcess(request: BatchProcessRequest): Promise<any[]>;
    getStatus(): Promise<Record<string, any>>;
    getCapabilities(): Promise<string[]>;
    analyzeText(text: string, analysisType: string): Promise<any>;
    processImage(imageUrl: string, operation: string): Promise<any>;
    private classifyData;
    private summarizeData;
    private extractData;
    private generateSimulatedResponse;
}
export {};
//# sourceMappingURL=aiService.d.ts.map