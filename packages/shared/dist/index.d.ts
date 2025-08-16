export * from './types/SharedModel';
export { ModelSyncEngine } from './core/ModelSync';
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    createdAt: string;
    updatedAt?: string;
}
export interface AIResponse {
    id: string;
    content: string;
    confidence: number;
    metadata: Record<string, any>;
    timestamp: string;
}
export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
}
export interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    aiInteractions: number;
    systemUptime: number;
    responseTime: number;
    lastUpdated: string;
}
export interface Settings {
    notifications: {
        enabled: boolean;
        email: boolean;
        push: boolean;
    };
    appearance: {
        theme: 'light' | 'dark';
        language: string;
        timezone: string;
    };
    ai: {
        enabled: boolean;
        model: string;
        maxTokens: number;
    };
    data: {
        retention: number;
        autoBackup: boolean;
        encryption: boolean;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export declare const userSchema: {
    email: (email: string) => boolean;
    password: (password: string) => boolean;
    name: (name: string) => boolean;
};
export declare const formatDate: (date: string | Date) => string;
export declare const formatDateTime: (date: string | Date) => string;
export declare const generateId: () => string;
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
export declare const API_ENDPOINTS: {
    readonly AI: "/api/ai";
    readonly USERS: "/api/users";
    readonly DASHBOARD: "/api/dashboard";
    readonly SETTINGS: "/api/settings";
};
export declare const AI_MODELS: {
    readonly GPT_3_5_TURBO: "gpt-3.5-turbo";
    readonly GPT_4: "gpt-4";
    readonly SIMULATED: "simulated";
};
export declare const THEMES: {
    readonly LIGHT: "light";
    readonly DARK: "dark";
};
//# sourceMappingURL=index.d.ts.map