import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase configuration missing. Backend API features will be limited.');
    console.warn('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}
export const supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;
export const isSupabaseConfigured = () => Boolean(supabase);
export const getUserFromToken = async (authHeader) => {
    if (!supabase || !authHeader) {
        return null;
    }
    try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
            console.error('Error verifying token:', error);
            return null;
        }
        return user;
    }
    catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
};
export const requireAuth = async (req, res, next) => {
    if (!supabase) {
        return res.status(500).json({
            success: false,
            error: 'Supabase not configured'
        });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            error: 'No authorization header provided'
        });
    }
    const user = await getUserFromToken(authHeader);
    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
    req.user = user;
    next();
};
//# sourceMappingURL=supabase.js.map