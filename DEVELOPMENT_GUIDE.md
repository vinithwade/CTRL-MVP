# CTRL MVP - Development Guide

This guide provides comprehensive instructions for developers working on the CTRL MVP project, including setup, development workflow, and best practices.

## 🚀 Quick Start

### Prerequisites

Before starting development, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 9+** or **yarn** - Package managers
- **Git** - Version control
- **Supabase Account** - [Sign up here](https://supabase.com)
- **OpenAI API Key** - [Get here](https://openai.com)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CTRL_mvp
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in the root directory
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up Supabase database**
   ```bash
   ./setup-database.sh
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

## 🏗️ Project Architecture

### Monorepo Structure

The project uses a monorepo structure with npm workspaces:

```
CTRL_mvp/
├── packages/
│   ├── frontend/     # React application
│   ├── backend/      # Node.js API server
│   └── shared/       # Shared types and utilities
├── docker/           # Docker configuration
└── [config files]    # Root configuration
```

### Technology Stack

#### Frontend
- **React 18** - UI library with hooks
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Client-side routing
- **Supabase** - Backend as a Service

#### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **Socket.io** - Real-time communication
- **OpenAI** - AI integration

## 🔧 Development Workflow

### Daily Development

1. **Start development servers**
   ```bash
   npm run dev
   ```

2. **Access applications**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5001
   - Health check: http://localhost:5001/health

3. **Make changes and see live updates**

### Code Organization

#### Frontend Structure
```
packages/frontend/src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── contexts/      # React contexts
├── hooks/         # Custom hooks
├── services/      # API services
├── utils/         # Utility functions
├── types/         # TypeScript types
└── styles/        # CSS styles
```

#### Backend Structure
```
packages/backend/src/
├── routes/        # API route handlers
├── services/      # Business logic
├── middleware/    # Express middleware
└── index.ts       # Server entry point
```

### Development Commands

#### Root Level Commands
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend
npm run build            # Build all packages
npm run install:all      # Install all dependencies
```

#### Frontend Commands
```bash
cd packages/frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

#### Backend Commands
```bash
cd packages/backend
npm run dev              # Start development server
npm run build            # Build TypeScript
npm run start            # Start production server
npm run lint             # Run ESLint
```

## 🎯 Feature Development

### Adding New Features

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop the feature**
   - Add components in `packages/frontend/src/components/`
   - Add pages in `packages/frontend/src/pages/`
   - Add API routes in `packages/backend/src/routes/`
   - Add services in `packages/backend/src/services/`

3. **Test your changes**
   - Test frontend functionality
   - Test API endpoints
   - Test integration between frontend and backend

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

### Component Development

#### Creating New Components

1. **Create component file**
   ```typescript
   // packages/frontend/src/components/YourComponent.tsx
   import React from 'react'

   interface YourComponentProps {
     // Define your props
   }

   export function YourComponent({ ...props }: YourComponentProps) {
     return (
       <div>
         {/* Your component JSX */}
       </div>
     )
   }
   ```

2. **Add TypeScript types**
   ```typescript
   // packages/frontend/src/types/yourComponent.ts
   export interface YourComponentData {
     // Define your data types
   }
   ```

3. **Add to exports**
   ```typescript
   // packages/frontend/src/components/index.ts
   export { YourComponent } from './YourComponent'
   ```

#### Component Best Practices

- **Use TypeScript**: Always define prop interfaces
- **Follow naming conventions**: PascalCase for components
- **Keep components focused**: Single responsibility principle
- **Use composition**: Build complex components from simple ones
- **Add JSDoc comments**: Document complex components

### API Development

#### Creating New API Routes

1. **Create route file**
   ```typescript
   // packages/backend/src/routes/yourFeature.ts
   import express from 'express'
   import { yourService } from '../services/yourService'

   const router = express.Router()

   router.get('/', async (req, res) => {
     try {
       const data = await yourService.getData()
       res.json({ success: true, data })
     } catch (error) {
       res.status(500).json({ success: false, error: error.message })
     }
   })

   export default router
   ```

2. **Add to main server**
   ```typescript
   // packages/backend/src/index.ts
   import yourFeatureRoutes from './routes/yourFeature.js'
   
   // Add to routes
   app.use('/api/your-feature', yourFeatureRoutes)
   ```

#### API Best Practices

- **Use TypeScript**: Define request/response types
- **Handle errors**: Always wrap in try-catch
- **Validate input**: Check request data
- **Return consistent responses**: Use standard format
- **Add logging**: Log important operations

## 🧪 Testing

### Frontend Testing

#### Component Testing
```typescript
// packages/frontend/src/components/__tests__/YourComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { YourComponent } from '../YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Your Component')).toBeInTheDocument()
  })
})
```

#### Hook Testing
```typescript
// packages/frontend/src/hooks/__tests__/useYourHook.test.ts
import { renderHook } from '@testing-library/react'
import { useYourHook } from '../useYourHook'

describe('useYourHook', () => {
  it('returns expected value', () => {
    const { result } = renderHook(() => useYourHook())
    expect(result.current).toBeDefined()
  })
})
```

### Backend Testing

#### Route Testing
```typescript
// packages/backend/src/routes/__tests__/yourFeature.test.ts
import request from 'supertest'
import app from '../../index'

describe('Your Feature API', () => {
  it('GET /api/your-feature returns data', async () => {
    const response = await request(app).get('/api/your-feature')
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })
})
```

### Running Tests

```bash
# Frontend tests
cd packages/frontend
npm test

# Backend tests
cd packages/backend
npm test

# All tests
npm run test --workspaces
```

## 🔍 Debugging

### Frontend Debugging

1. **Browser Developer Tools**
   - Use React Developer Tools extension
   - Check Console for errors
   - Use Network tab for API calls

2. **VS Code Debugging**
   ```json
   // .vscode/launch.json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Launch Chrome",
         "type": "chrome",
         "request": "launch",
         "url": "http://localhost:3000"
       }
     ]
   }
   ```

3. **Console Logging**
   ```typescript
   console.log('Debug info:', data)
   console.error('Error:', error)
   ```

### Backend Debugging

1. **Server Logs**
   - Check terminal output
   - Use Morgan logging middleware
   - Add custom logging

2. **VS Code Debugging**
   ```json
   // .vscode/launch.json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Debug Backend",
         "type": "node",
         "request": "launch",
         "program": "${workspaceFolder}/packages/backend/src/index.ts",
         "runtimeArgs": ["-r", "ts-node/register"]
       }
     ]
   }
   ```

3. **API Testing**
   - Use Postman or Insomnia
   - Test endpoints directly
   - Check response status and data

## 🚀 Deployment

### Local Production Build

1. **Build all packages**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm run start
   ```

### Docker Deployment

1. **Build Docker images**
   ```bash
   docker-compose build
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Environment Variables

Ensure all required environment variables are set:

```env
# Server Configuration
PORT=5001
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://your-domain.com

# AI Configuration
OPENAI_API_KEY=your_openai_api_key

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

## 📚 Code Standards

### TypeScript Standards

- **Strict mode**: Enable all strict options
- **Type definitions**: Always define interfaces
- **No any types**: Avoid using `any`
- **Proper imports**: Use named imports/exports

### React Standards

- **Functional components**: Use function components with hooks
- **Props interface**: Always define prop types
- **Event handlers**: Use proper event types
- **State management**: Use appropriate state management

### API Standards

- **RESTful design**: Follow REST principles
- **Error handling**: Consistent error responses
- **Input validation**: Validate all inputs
- **Response format**: Consistent response structure

### Git Standards

- **Branch naming**: `feature/`, `bugfix/`, `hotfix/`
- **Commit messages**: Use conventional commits
- **Pull requests**: Require code review
- **Clean history**: Rebase when needed

## 🔧 Tools and Extensions

### Recommended VS Code Extensions

- **TypeScript and JavaScript Language Features**
- **ESLint**
- **Prettier**
- **Tailwind CSS IntelliSense**
- **React Developer Tools**
- **GitLens**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**

### Useful Development Tools

- **Postman/Insomnia**: API testing
- **React Developer Tools**: React debugging
- **Redux DevTools**: State debugging
- **Lighthouse**: Performance testing

## 🆘 Troubleshooting

### Common Issues

#### Frontend Issues

1. **Build errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript errors**
   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit
   ```

3. **Vite issues**
   ```bash
   # Clear Vite cache
   rm -rf packages/frontend/node_modules/.vite
   ```

#### Backend Issues

1. **Port conflicts**
   ```bash
   # Check what's using the port
   lsof -i :5001
   # Kill process if needed
   kill -9 <PID>
   ```

2. **Database connection**
   - Check Supabase credentials
   - Verify network connectivity
   - Check environment variables

3. **TypeScript compilation**
   ```bash
   # Check TypeScript errors
   cd packages/backend
   npx tsc --noEmit
   ```

### Getting Help

1. **Check documentation**: README.md, PROJECT_STRUCTURE.md
2. **Search issues**: Look for similar problems
3. **Ask team**: Reach out to team members
4. **Create issue**: Document new problems

## 📖 Learning Resources

### React and TypeScript
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### Backend Development
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Socket.io Documentation](https://socket.io/docs/)

### Tools and Libraries
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Best Practices
- [React Best Practices](https://react.dev/learn)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/intro.html)
- [API Design Best Practices](https://restfulapi.net/)

---

This development guide provides comprehensive information for working with the CTRL MVP project. For specific questions or issues, refer to the project documentation or reach out to the development team.
