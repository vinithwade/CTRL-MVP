import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase configuration missing. Backend API features will be limited.')
  console.warn('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
}

// Create Supabase client with service role key for backend operations
export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => Boolean(supabase)

// Helper function to get user from JWT token
export const getUserFromToken = async (authHeader: string) => {
  if (!supabase || !authHeader) {
    return null
  }

  try {
    // Extract token from "Bearer token" format
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error) {
      console.error('Error verifying token:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error parsing token:', error)
    return null
  }
}

// Middleware to verify authentication
export const requireAuth = async (req: any, res: any, next: any) => {
  if (!supabase) {
    return res.status(500).json({ 
      success: false, 
      error: 'Supabase not configured' 
    })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      error: 'No authorization header provided' 
    })
  }

  const user = await getUserFromToken(authHeader)
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    })
  }

  // Add user to request object
  req.user = user
  next()
}
