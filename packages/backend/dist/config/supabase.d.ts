export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", any> | null;
export declare const isSupabaseConfigured: () => boolean;
export declare const getUserFromToken: (authHeader: string) => Promise<import("@supabase/supabase-js").AuthUser | null>;
export declare const requireAuth: (req: any, res: any, next: any) => Promise<any>;
//# sourceMappingURL=supabase.d.ts.map