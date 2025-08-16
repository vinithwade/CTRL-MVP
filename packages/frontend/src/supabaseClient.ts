import { createClient } from '@supabase/supabase-js'

// Vite exposes env via import.meta.env, but TS needs ambient types in this file.
// Declare minimal typings locally to satisfy the linter.
declare const importMeta: { env: Record<string, string | undefined> }
// Prefer real Vite env if available at runtime
// @ts-ignore
const viteEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : importMeta.env

// Read from environment variables (set in .env as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
const supabaseUrl = (viteEnv?.VITE_SUPABASE_URL as string | undefined)
const supabaseKey = (viteEnv?.VITE_SUPABASE_ANON_KEY as string | undefined)

function createMockSupabase() {
  console.warn('Supabase env not set. Running in Local Auth mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable real auth.')

  type Listener = (event: string, session: any) => void
  const listeners = new Set<Listener>()
  const storageKey = 'ctrl_mock_user'
  const projectsKey = 'ctrl_mock_projects'
  const projectDataKey = 'ctrl_mock_project_data'

  // Safe storage wrappers with in-memory fallback when localStorage quota is exceeded
  const memoryStore: Record<string, string> = {}
  let useMemoryOnly = false

  const safeGetItem = (key: string): string | null => {
    if (useMemoryOnly) {
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null
    }
    try {
      return localStorage.getItem(key)
    } catch {
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null
    }
  }

  const safeSetItem = (key: string, value: string) => {
    if (useMemoryOnly) {
      memoryStore[key] = value
      return
    }
    try {
      localStorage.setItem(key, value)
    } catch (err: any) {
      // Quota exceeded or inaccessible storage (e.g., private mode). Fallback to memory.
      console.warn('Local storage unavailable or quota exceeded. Falling back to in-memory storage for mock mode.', err)
      useMemoryOnly = true
      memoryStore[key] = value
    }
  }

  const safeRemoveItem = (key: string) => {
    if (!useMemoryOnly) {
      try { localStorage.removeItem(key) } catch { /* ignore */ }
    }
    delete memoryStore[key]
  }

  const getStoredUser = () => {
    try { return JSON.parse(safeGetItem(storageKey) || 'null') } catch { return null }
  }
  const setStoredUser = (user: any | null) => {
    if (user) safeSetItem(storageKey, JSON.stringify(user))
    else safeRemoveItem(storageKey)
  }
  const emit = (event: string, user: any | null) => {
    const session = user ? { user } : null
    listeners.forEach(l => l(event, session))
  }

  // Mock database storage
  const getStoredData = (key: string) => {
    try { return JSON.parse(safeGetItem(key) || '[]') } catch { return [] }
  }
  const setStoredData = (key: string, data: any[]) => {
    safeSetItem(key, JSON.stringify(data))
  }

  const createBuilder = (tableName: string) => {
    const state: any = { 
      tableName,
      filters: [],
      single: false,
      selectFields: '*',
      orderBy: null,
      insertData: null,
      updateData: null,
      deleteMode: false
    }
    
    const builder: any = {
      select(fields?: string) { 
        state.selectFields = fields || '*'
        return builder 
      },
      insert(data: any) { 
        state.insertData = data
        return builder 
      },
      update(data: any) { 
        state.updateData = data
        return builder 
      },
      delete() { 
        state.deleteMode = true
        return builder 
      },
      order(field: string, options?: any) { 
        state.orderBy = { field, ascending: options?.ascending !== false }
        return builder 
      },
      eq(field: string, value: any) { 
        state.filters.push({ field, op: 'eq', value })
        return builder 
      },
      limit(count: number) { 
        state.limitCount = count
        return builder 
      },
      single() { 
        state.single = true
        return builder 
      },
      then(onFulfilled: any, onRejected?: any) {
        return this.execute().then(onFulfilled, onRejected)
      },
      catch(onRejected: any) {
        return this.execute().catch(onRejected)
      },
      finally(onFinally: any) { 
        return this.execute().finally(onFinally) 
      },
      execute() {
        const currentUser = getStoredUser()
        
        if (state.tableName === 'projects') {
          const projects = getStoredData(projectsKey)
          
          if (state.insertData) {
            // Insert new project
            const newProject = {
              id: crypto.randomUUID(),
              ...state.insertData,
              user_id: currentUser?.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            projects.push(newProject)
            setStoredData(projectsKey, projects)
            return Promise.resolve({ data: state.single ? newProject : [newProject], error: null })
          }
          
          if (state.updateData) {
            // Update existing project
            const filtered = projects.filter((p: any) => {
              if (p.user_id !== currentUser?.id) return false
              return state.filters.every((f: any) => {
                if (f.op === 'eq') return p[f.field] === f.value
                return true
              })
            })
            
            if (filtered.length > 0) {
              const updated = { ...filtered[0], ...state.updateData, updated_at: new Date().toISOString() }
              const index = projects.findIndex((p: any) => p.id === updated.id)
              projects[index] = updated
              setStoredData(projectsKey, projects)
              return Promise.resolve({ data: state.single ? updated : [updated], error: null })
            }
          }
          
          if (state.deleteMode) {
            // Delete projects
            const initialLength = projects.length
            const filtered = projects.filter((p: any) => {
              if (p.user_id !== currentUser?.id) return true
              return !state.filters.every((f: any) => {
                if (f.op === 'eq') return p[f.field] === f.value
                return true
              })
            })
            setStoredData(projectsKey, filtered)
            return Promise.resolve({ data: [], error: null })
          }
          
          // Select projects
          let filtered = projects.filter((p: any) => p.user_id === currentUser?.id)
          
          // Apply filters
          state.filters.forEach((f: any) => {
            if (f.op === 'eq') {
              filtered = filtered.filter((p: any) => p[f.field] === f.value)
            }
          })
          
          // Apply ordering
          if (state.orderBy) {
            filtered.sort((a: any, b: any) => {
              const aVal = a[state.orderBy.field]
              const bVal = b[state.orderBy.field]
              if (state.orderBy.ascending) {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
              } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
              }
            })
          }
          
          // Apply limit
          if (state.limitCount) {
            filtered = filtered.slice(0, state.limitCount)
          }
          
          return Promise.resolve({ 
            data: state.single ? (filtered[0] || null) : filtered, 
            error: null 
          })
        }
        
        if (state.tableName === 'project_data') {
          const projectData = getStoredData(projectDataKey)
          
          if (state.insertData) {
            // Insert new project data
            const newData = {
              id: crypto.randomUUID(),
              ...state.insertData,
              user_id: currentUser?.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            projectData.push(newData)
            setStoredData(projectDataKey, projectData)
            return Promise.resolve({ data: state.single ? newData : [newData], error: null })
          }
          
          if (state.updateData) {
            // Update existing project data
            const filtered = projectData.filter((pd: any) => {
              if (pd.user_id !== currentUser?.id) return false
              return state.filters.every((f: any) => {
                if (f.op === 'eq') return pd[f.field] === f.value
                return true
              })
            })
            
            if (filtered.length > 0) {
              const updated = { ...filtered[0], ...state.updateData, updated_at: new Date().toISOString() }
              const index = projectData.findIndex((pd: any) => pd.id === updated.id)
              projectData[index] = updated
              setStoredData(projectDataKey, projectData)
              return Promise.resolve({ data: state.single ? updated : [updated], error: null })
            }
          }
          
          if (state.deleteMode) {
            // Delete project data
            const filtered = projectData.filter((pd: any) => {
              if (pd.user_id !== currentUser?.id) return true
              return !state.filters.every((f: any) => {
                if (f.op === 'eq') return pd[f.field] === f.value
                return true
              })
            })
            setStoredData(projectDataKey, filtered)
            return Promise.resolve({ data: [], error: null })
          }
          
          // Select project data
          let filtered = projectData.filter((pd: any) => pd.user_id === currentUser?.id)
          
          // Apply filters
          state.filters.forEach((f: any) => {
            if (f.op === 'eq') {
              filtered = filtered.filter((pd: any) => pd[f.field] === f.value)
            }
          })
          
          // Apply ordering
          if (state.orderBy) {
            filtered.sort((a: any, b: any) => {
              const aVal = a[state.orderBy.field]
              const bVal = b[state.orderBy.field]
              if (state.orderBy.ascending) {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
              } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
              }
            })
          }
          
          // Apply limit
          if (state.limitCount) {
            filtered = filtered.slice(0, state.limitCount)
          }
          
          return Promise.resolve({ 
            data: state.single ? (filtered[0] || null) : filtered, 
            error: null 
          })
        }
        
        // Default empty response for other tables
        return Promise.resolve({ data: state.single ? null : [], error: null })
      }
    }
    return builder
  }

  const mock = {
    auth: {
      async getSession() {
        const user = getStoredUser()
        return { data: { session: user ? { user } : null }, error: null }
      },
      async getUser() {
        const user = getStoredUser()
        return { data: { user }, error: null }
      },
      onAuthStateChange(cb: Listener) {
        listeners.add(cb)
        return { data: { subscription: { unsubscribe() { listeners.delete(cb) } } } }
      },
      async signInWithPassword({ email }: { email: string; password: string }) {
        const user = { id: 'local-' + btoa(email).replace(/=/g, ''), email }
        setStoredUser(user)
        emit('SIGNED_IN', user)
        return { data: { user }, error: null }
      },
      async signUp({ email }: { email: string; password: string }) {
        const user = { id: 'local-' + btoa(email).replace(/=/g, ''), email }
        setStoredUser(user)
        emit('SIGNED_UP', user)
        return { data: { user }, error: null }
      },
      async signOut() {
        setStoredUser(null)
        emit('SIGNED_OUT', null)
        return { error: null }
      },
    },
    from(tableName: string) { return createBuilder(tableName) }
  }
  return mock as any
}

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : createMockSupabase()