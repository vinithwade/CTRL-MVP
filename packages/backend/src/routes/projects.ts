import express from 'express'
import { supabase, isSupabaseConfigured, requireAuth } from '../config/supabase.js'

const router = express.Router()

// Get all projects for authenticated user
router.get('/', requireAuth, async (req: any, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Database not configured'
      })
    }

    const { data: projects, error } = await supabase!
      .from('projects')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch projects'
      })
    }

    return res.json({
      success: true,
      data: projects || []
    })
  } catch (error) {
    console.error('Error in GET /projects:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// Get project by ID
router.get('/:id', requireAuth, async (req: any, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Database not configured'
      })
    }

    const { id } = req.params

    const { data: project, error } = await supabase!
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      })
    }

    return res.json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Error in GET /projects/:id:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// Create new project
router.post('/', requireAuth, async (req: any, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Database not configured'
      })
    }

    const { name, language, device } = req.body

    if (!name || !language || !device) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, language, device'
      })
    }

    const { data: project, error } = await supabase!
      .from('projects')
      .insert([{
        name,
        language,
        device,
        user_id: req.user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to create project'
      })
    }

    // Project created without default design data - user starts with empty canvas

    return res.status(201).json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Error in POST /projects:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// Update project
router.put('/:id', requireAuth, async (req: any, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Database not configured'
      })
    }

    const { id } = req.params
    const updates = req.body

    // Remove fields that shouldn't be updated
    delete updates.id
    delete updates.user_id
    delete updates.created_at

    const { data: project, error } = await supabase!
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update project'
      })
    }

    return res.json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Error in PUT /projects/:id:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// Delete project
router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Database not configured'
      })
    }

    const { id } = req.params

    const { error } = await supabase!
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) {
      console.error('Error deleting project:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to delete project'
      })
    }

    return res.json({
      success: true,
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /projects/:id:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// Get project data
router.get('/:id/data/:dataType', requireAuth, async (req: any, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Database not configured'
      })
    }

    const { id, dataType } = req.params

    const { data: projectData, error } = await supabase!
      .from('project_data')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', req.user.id)
      .eq('data_type', dataType)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching project data:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch project data'
      })
    }

    return res.json({
      success: true,
      data: projectData
    })
  } catch (error) {
    console.error('Error in GET /projects/:id/data/:dataType:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// Save project data
router.post('/:id/data/:dataType', requireAuth, async (req: any, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Database not configured'
      })
    }

    const { id, dataType } = req.params
    const { data } = req.body

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing data field'
      })
    }

    // Check if data already exists
    const { data: existingData } = await supabase!
      .from('project_data')
      .select('id')
      .eq('project_id', id)
      .eq('user_id', req.user.id)
      .eq('data_type', dataType)
      .single()

    let result
    if (existingData) {
      // Update existing data
      const { data: updatedData, error } = await supabase!
        .from('project_data')
        .update({ data })
        .eq('id', existingData.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating project data:', error)
        return res.status(500).json({
          success: false,
          error: 'Failed to update project data'
        })
      }
      result = updatedData
    } else {
      // Create new data
      const { data: newData, error } = await supabase!
        .from('project_data')
        .insert([{
          project_id: id,
          user_id: req.user.id,
          data_type: dataType,
          data
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating project data:', error)
        return res.status(500).json({
          success: false,
          error: 'Failed to create project data'
        })
      }
      result = newData
    }

    return res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error in POST /projects/:id/data/:dataType:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

export default router
