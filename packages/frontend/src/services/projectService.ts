import { supabase } from '../supabaseClient'

export interface Project {
  id: string
  name: string
  language: string
  device: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface ProjectData {
  id: string
  project_id: string
  user_id: string
  data_type: 'design' | 'logic' | 'code' | 'settings'
  data: any
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  settings: any
  created_at: string
  updated_at: string
}

export class ProjectService {
  // Get current user ID
  private static async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting user:', error)
      throw new Error(`Authentication error: ${error.message}`)
    }
    
    if (!user) {
      console.error('No user found - user not authenticated')
      throw new Error('User not authenticated. Please log in.')
    }
    
    console.log('Current user ID:', user.id)
    return user.id
  }

  // Get all projects for the current user
  static async getUserProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      throw new Error(error.message)
    }

    return data || []
  }

  // Create a new project
  static async createProject(projectData: { name: string; language: string; device: string }): Promise<Project> {
    try {
      const userId = await this.getCurrentUserId()
      console.log('Creating project with user ID:', userId)
      console.log('Project data:', projectData)
      
      const insertData = {
        ...projectData,
        user_id: userId
      }
      console.log('Insert data:', insertData)
      
      const { data, error } = await supabase
        .from('projects')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Error creating project:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Failed to create project: ${error.message}`)
      }

      console.log('Project created successfully:', data)
      return data
    } catch (error) {
      console.error('Exception in createProject:', error)
      throw error
    }
  }

  // Update a project
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      throw new Error(error.message)
    }

    return data
  }

  // Delete a project
  static async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      throw new Error(error.message)
    }
  }

  // Get project data by type
  static async getProjectData(projectId: string, dataType: ProjectData['data_type']): Promise<ProjectData | null> {
    const { data, error } = await supabase
      .from('project_data')
      .select('*')
      .eq('project_id', projectId)
      .eq('data_type', dataType)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching project data:', error)
      throw new Error(error.message)
    }

    return data
  }

  // Save project data
  static async saveProjectData(projectId: string, dataType: ProjectData['data_type'], data: any): Promise<ProjectData> {
    const userId = await this.getCurrentUserId()
    
    // Try to update existing data first
    const existingData = await this.getProjectData(projectId, dataType)
    
    if (existingData) {
      // Update existing data
      const { data: updatedData, error } = await supabase
        .from('project_data')
        .update({ data })
        .eq('id', existingData.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating project data:', error)
        throw new Error(error.message)
      }

      return updatedData
    } else {
      // Create new data
      const { data: newData, error } = await supabase
        .from('project_data')
        .insert([{
          project_id: projectId,
          user_id: userId,
          data_type: dataType,
          data
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating project data:', error)
        throw new Error(error.message)
      }

      return newData
    }
  }

  // Delete project data
  static async deleteProjectData(projectId: string, dataType: ProjectData['data_type']): Promise<void> {
    const { error } = await supabase
      .from('project_data')
      .delete()
      .eq('project_id', projectId)
      .eq('data_type', dataType)

    if (error) {
      console.error('Error deleting project data:', error)
      throw new Error(error.message)
    }
  }

  // Get user settings
  static async getUserSettings(): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching user settings:', error)
      throw new Error(error.message)
    }

    return data
  }

  // Save user settings
  static async saveUserSettings(settings: any): Promise<UserSettings> {
    const userId = await this.getCurrentUserId()
    const existingSettings = await this.getUserSettings()
    
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .update({ settings })
        .eq('id', existingSettings.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user settings:', error)
        throw new Error(error.message)
      }

      return data
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('user_settings')
        .insert([{ 
          user_id: userId,
          settings 
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating user settings:', error)
        throw new Error(error.message)
      }

      return data
    }
  }

  // Get project with all its data
  static async getProjectWithData(projectId: string): Promise<{
    project: Project
    designData?: ProjectData
    logicData?: ProjectData
    codeData?: ProjectData
    settingsData?: ProjectData
  }> {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('Error fetching project:', projectError)
      throw new Error(projectError.message)
    }

    // Get all project data
    const { data: projectData, error: dataError } = await supabase
      .from('project_data')
      .select('*')
      .eq('project_id', projectId)

    if (dataError) {
      console.error('Error fetching project data:', dataError)
      throw new Error(dataError.message)
    }

    const result = {
      project,
      designData: projectData?.find(d => d.data_type === 'design'),
      logicData: projectData?.find(d => d.data_type === 'logic'),
      codeData: projectData?.find(d => d.data_type === 'code'),
      settingsData: projectData?.find(d => d.data_type === 'settings')
    }

    return result
  }
} 