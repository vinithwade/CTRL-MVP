# CTRL MVP - Beta User Setup Guide

Welcome to the CTRL MVP beta! This guide will help you set up the application for testing.

## 🚀 What's Fixed

- ✅ **Project Persistence**: Projects now properly save and load user data
- ✅ **Database Integration**: Full Supabase integration with Row Level Security
- ✅ **Default Screen Creation**: New projects automatically get a default screen
- ✅ **Auto-save**: Design data saves every 30 seconds
- ✅ **User Isolation**: Each user sees only their own projects
- ✅ **Backend API**: Complete project management API endpoints
- ✅ **Error Handling**: Improved error handling and recovery

## 🛠️ Quick Setup for Developers

### Prerequisites
- Node.js 18+
- Supabase account
- Git

### 1. Clone and Install
```bash
git clone <repository-url>
cd CTRL_mvp
npm run install:all
```

### 2. Setup Supabase Database
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database setup:
   ```bash
   ./setup-database.sh
   ```
   Or manually run the SQL from `database-setup.sql`

### 3. Environment Variables
Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# AI Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key_here

# Frontend Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Supabase Configuration  
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_random_jwt_secret_here
JWT_EXPIRES_IN=7d
```

### 4. Start Development
```bash
npm run dev
```

Access the app at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## 📝 Beta Testing Guide

### Testing Project Creation
1. **Sign Up**: Create a new account with a valid email
2. **Create Project**: Go to User Dashboard → "Create New Project"
3. **Verify Default Screen**: Project should open in Design Mode with a default screen
4. **Test Auto-save**: Add components, changes should persist when you navigate away

### Testing Data Persistence
1. **Design Mode**: Add components, change properties, verify they save
2. **Logic Mode**: Create logic nodes, verify they persist
3. **Code Mode**: Generate code, verify it persists
4. **Cross-session**: Close browser, reopen, verify data is still there

### Testing User Isolation
1. **Multiple Accounts**: Create 2+ accounts
2. **Separate Projects**: Create projects in each account
3. **Verify Isolation**: Each user should only see their own projects

### Key Features to Test

#### ✅ Project Management
- Create new projects (JavaScript, TypeScript, Python, etc.)
- Edit project names and settings
- Delete projects
- Projects persist across sessions

#### ✅ Design Mode
- Add components (Button, Text, Image, Container)
- Drag and drop components
- Edit component properties
- Multiple screens support
- Layer management
- Auto-save functionality

#### ✅ Logic Mode  
- Create logic nodes
- Connect nodes
- Save/load logic flows
- Component integration

#### ✅ Code Mode
- View generated code
- File explorer
- Code preview
- Export functionality

## 🐛 Known Issues & Testing Focus

### Priority Testing Areas
1. **First Project Creation**: Ensure smooth onboarding
2. **Data Persistence**: Verify no data loss
3. **Cross-device**: Test on mobile/tablet/desktop
4. **Performance**: Large projects with many components
5. **Error Recovery**: Network interruptions, invalid data

### Reporting Issues
When reporting bugs, please include:
- Steps to reproduce
- Browser and version
- Screenshot/video if applicable
- Console errors (F12 → Console)
- User account email (for data investigation)

## 🔧 API Endpoints (For Testing)

The backend now includes full project management:

```bash
# Projects
GET    /api/projects          # Get user projects  
POST   /api/projects          # Create project
GET    /api/projects/:id      # Get project details
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project

# Project Data
GET    /api/projects/:id/data/:type    # Get project data (design/logic/code)
POST   /api/projects/:id/data/:type    # Save project data

# Health Check
GET    /health                         # Backend status
```

## 💡 Tips for Beta Testing

### Effective Testing
1. **Clear Browser Data**: Start fresh occasionally
2. **Test Edge Cases**: Very long names, special characters
3. **Stress Test**: Create many projects/components
4. **Network Issues**: Test with slow/interrupted connections

### Performance Monitoring
- Watch for memory leaks during long sessions
- Note any slowdowns with large projects
- Test auto-save frequency (30 seconds)

### User Experience
- Note any confusing UI/UX elements
- Test keyboard shortcuts and accessibility
- Verify mobile responsiveness

## 🎯 Success Criteria

The beta is successful if:
- ✅ Users can create and persist projects reliably
- ✅ No data loss occurs during normal usage
- ✅ The application recovers gracefully from errors
- ✅ Performance is acceptable on target devices
- ✅ The user onboarding flow is smooth

## 📞 Support

- **Issues**: Create GitHub issues with detailed descriptions
- **Questions**: Check existing documentation first
- **Updates**: Watch for new releases and fixes

## 🚀 Production Readiness Checklist

Before full release:
- [ ] Performance testing with 100+ projects
- [ ] Security audit of authentication
- [ ] Mobile device optimization
- [ ] Error monitoring setup
- [ ] User analytics implementation
- [ ] CDN setup for assets
- [ ] Database backup strategy
- [ ] Rate limiting implementation

---

**Ready for Beta!** 🎉

The application now has robust data persistence, proper user isolation, and a complete backend API. Beta users can reliably create, edit, and persist their projects across sessions.
