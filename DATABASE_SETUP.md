# Database Setup Guide for CTRL MVP

This guide will help you set up the database with proper user isolation for the CTRL MVP platform.

## 🗄️ Database Schema Overview

The CTRL MVP platform uses a multi-table database design with Row Level Security (RLS) to ensure complete user isolation:

### Tables

1. **`projects`** - Main project metadata
   - `id` (UUID) - Primary key
   - `name` (VARCHAR) - Project name
   - `language` (VARCHAR) - Programming language
   - `device` (VARCHAR) - Target device type
   - `user_id` (UUID) - References auth.users(id)
   - `created_at` (TIMESTAMP) - Creation timestamp
   - `updated_at` (TIMESTAMP) - Last update timestamp

2. **`project_data`** - Design, logic, and code data
   - `id` (UUID) - Primary key
   - `project_id` (UUID) - References projects(id)
   - `user_id` (UUID) - References auth.users(id)
   - `data_type` (VARCHAR) - 'design', 'logic', 'code', 'settings'
   - `data` (JSONB) - Actual project data
   - `created_at` (TIMESTAMP) - Creation timestamp
   - `updated_at` (TIMESTAMP) - Last update timestamp

3. **`user_settings`** - User preferences and settings
   - `id` (UUID) - Primary key
   - `user_id` (UUID) - References auth.users(id)
   - `settings` (JSONB) - User settings data
   - `created_at` (TIMESTAMP) - Creation timestamp
   - `updated_at` (TIMESTAMP) - Last update timestamp

## 🔒 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Automatic user isolation based on `auth.uid()`

### Policies
- **SELECT**: Users can only view their own projects/data
- **INSERT**: Users can only create projects/data for themselves
- **UPDATE**: Users can only update their own projects/data
- **DELETE**: Users can only delete their own projects/data

## 🚀 Setup Instructions

### Option 1: Using the Setup Script (Recommended)

1. **Update the script with your database credentials:**
   ```bash
   # Edit setup-database.sh and update these variables:
   DB_HOST="your_supabase_host"
   DB_PORT="5432"
   DB_NAME="postgres"
   DB_USER="postgres"
   DB_PASSWORD="your_actual_password"
   ```

2. **Run the setup script:**
   ```bash
   ./setup-database.sh
   ```

### Option 2: Manual Setup

1. **Connect to your Supabase database:**
   ```bash
   psql "host=your_host port=5432 dbname=postgres user=postgres password=your_password"
   ```

2. **Run the database setup:**
   ```bash
   \i database-setup.sql
   ```

## 🔧 Verification

After setup, verify the tables were created correctly:

```sql
-- Check tables exist
\dt

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('projects', 'project_data', 'user_settings');

-- Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('projects', 'project_data', 'user_settings');
```

## 📊 User Isolation Features

### 1. **Project Isolation**
- Each user sees only their own projects
- Project creation automatically associates with the authenticated user
- No cross-user data access possible

### 2. **Data Persistence**
- Design data is automatically saved every 30 seconds
- All project data (design, logic, code) is stored separately
- User settings are isolated per user

### 3. **Real-time Updates**
- WebSocket integration for live collaboration
- Changes are immediately reflected in the database
- Auto-save prevents data loss

## 🛠️ Frontend Integration

The frontend now uses the `ProjectService` class for all database operations:

```typescript
// Create a new project
const project = await ProjectService.createProject({
  name: "My Project",
  language: "React",
  device: "Web"
})

// Save project data
await ProjectService.saveProjectData(projectId, 'design', designData)

// Load project data
const designData = await ProjectService.getProjectData(projectId, 'design')
```

## 🔍 Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Ensure RLS policies are correctly set up
   - Check that the user is authenticated
   - Verify the `user_id` field is being set correctly

2. **"Table doesn't exist" errors**
   - Run the database setup script again
   - Check that you're connected to the correct database
   - Verify the schema matches the expected structure

3. **"RLS policy violation" errors**
   - Ensure the user is logged in
   - Check that the `auth.uid()` function is working
   - Verify the user_id is being set on insert operations

### Debug Queries

```sql
-- Check current user
SELECT auth.uid();

-- Check user's projects
SELECT * FROM projects WHERE user_id = auth.uid();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'projects';
```

## 📈 Performance Considerations

### Indexes
- `idx_projects_user_id` - Fast user project queries
- `idx_projects_created_at` - Fast sorting by creation date
- `idx_project_data_project_id` - Fast project data lookups
- `idx_project_data_user_id` - Fast user data queries
- `idx_project_data_type` - Fast data type filtering

### Triggers
- Auto-update `updated_at` timestamps
- Maintains data integrity
- No manual timestamp management required

## 🔄 Migration from Old Schema

If you have existing data in the old `newproject` table:

```sql
-- Migrate existing projects to new schema
INSERT INTO projects (id, name, language, device, user_id, created_at, updated_at)
SELECT id, name, language, device, user_id, created_at, updated_at
FROM newproject;

-- Drop old table after migration
DROP TABLE newproject;
```

## 🎯 Next Steps

After database setup:

1. **Start the development servers:**
   ```bash
   npm run dev
   ```

2. **Create a new user account:**
   - Go to the signup page
   - Create your account with a new Gmail address
   - Verify your email

3. **Create your first project:**
   - Navigate to the dashboard
   - Click "Create New Project"
   - Start designing!

4. **Test user isolation:**
   - Create multiple accounts
   - Verify each user only sees their own projects
   - Test that data is properly saved and loaded

## 📞 Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify your database connection settings
3. Ensure all tables and policies are created correctly
4. Check that the user is properly authenticated

The database is now set up with complete user isolation - each user will have their own separate database space for storing projects and data! 