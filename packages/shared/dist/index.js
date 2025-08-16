// CTRL Shared Model exports
export * from './types/SharedModel';
export { ModelSyncEngine } from './core/ModelSync';
// Validation schemas
export const userSchema = {
    email: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    password: (password) => {
        return password.length >= 6;
    },
    name: (name) => {
        return name.length >= 2;
    }
};
// Utility functions
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
};
export const formatDateTime = (date) => {
    return new Date(date).toLocaleString();
};
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
export const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
// Constants
export const API_ENDPOINTS = {
    AI: '/api/ai',
    USERS: '/api/users',
    DASHBOARD: '/api/dashboard',
    SETTINGS: '/api/settings'
};
export const AI_MODELS = {
    GPT_3_5_TURBO: 'gpt-3.5-turbo',
    GPT_4: 'gpt-4',
    SIMULATED: 'simulated'
};
export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};
//# sourceMappingURL=index.js.map