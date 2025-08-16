# CTRL MVP - Project Structure Documentation

This document provides a comprehensive overview of the CTRL MVP project structure, helping developers understand the codebase organization and architecture.

## 📁 Root Directory Structure

```
CTRL_mvp/
├── packages/              # Monorepo packages
├── docker/               # Docker configuration files
├── image/                # Static images and assets
├── database-setup.sql    # Database schema and setup
├── setup-database.sh     # Database initialization script
├── deploy.sh            # Deployment script
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile           # Production Dockerfile
├── Dockerfile.dev       # Development Dockerfile
├── package.json         # Root package.json with workspaces
├── README.md           # Main project documentation
├── DATABASE_SETUP.md   # Database setup guide
├── TROUBLESHOOTING.md  # Troubleshooting guide
└── vercel.json         # Vercel deployment configuration
```

## 🏗️ Packages Structure

### Frontend Package (`packages/frontend/`)

The frontend is a React application built with TypeScript, Vite, and Tailwind CSS.

```
packages/frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx              # Main application layout
│   │   ├── AuthModal.tsx           # Authentication modal
│   │   └── CreateProjectModal.tsx  # Project creation modal
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx            # Landing page
│   │   ├── AIPage.tsx              # AI chat interface
│   │   ├── DashboardPage.tsx       # Main dashboard
│   │   ├── UserDashboardPage.tsx   # User-specific dashboard
│   │   ├── ProfilePage.tsx         # User profile page
│   │   ├── SettingsPage.tsx        # Settings page
│   │   ├── DesignMode.tsx          # Visual design interface
│   │   ├── LogicMode.tsx           # Logic flow interface
│   │   └── CodeMode.tsx            # Code generation interface
│   ├── contexts/           # React contexts for state management
│   │   ├── NavigationContext.tsx   # Navigation state
│   │   └── DesignContext.tsx       # Design state management
│   ├── hooks/              # Custom React hooks
│   │   └── useAuth.ts              # Authentication hook
│   ├── services/           # API service functions
│   │   └── projectService.ts       # Project management API
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── styles/             # CSS styles
│   ├── assets/             # Static assets
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── supabaseClient.ts   # Supabase client configuration
├── public/                 # Public assets
├── dist/                   # Build output
├── package.json            # Frontend dependencies
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── tsconfig.node.json      # Node-specific TypeScript config
```

### Backend Package (`packages/backend/`)

The backend is a Node.js/Express API server with TypeScript.

```
packages/backend/
├── src/
│   ├── routes/             # API route handlers
│   │   ├── ai.ts           # AI-related endpoints
│   │   ├── users.ts        # User management endpoints
│   │   ├── dashboard.ts    # Dashboard data endpoints
│   │   └── settings.ts     # Settings management endpoints
│   ├── services/           # Business logic services
│   │   └── aiService.ts    # AI service integration
│   ├── middleware/         # Express middleware
│   │   ├── errorHandler.ts # Error handling middleware
│   │   └── notFound.ts     # 404 handler middleware
│   ├── dist/               # Build output
│   ├── package.json        # Backend dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   └── index.ts            # Server entry point
```

### Shared Package (`packages/shared/`)

Shared types and utilities used across frontend and backend.

```
packages/shared/
├── src/
│   └── index.ts            # Common types and utilities
├── package.json            # Shared dependencies
└── tsconfig.json           # TypeScript configuration
```

## 🎯 Key Components Overview

### Frontend Components

#### Layout Component (`components/Layout.tsx`)
- **Purpose**: Main application layout with navigation
- **Features**: 
  - Responsive sidebar navigation
  - Mobile menu support
  - Authentication integration
  - Footer with branding

#### AuthModal Component (`components/AuthModal.tsx`)
- **Purpose**: Authentication modal for login/signup
- **Features**:
  - Login and signup forms
  - Form validation
  - Error handling
  - Supabase integration

#### CreateProjectModal Component (`components/CreateProjectModal.tsx`)
- **Purpose**: Project creation interface
- **Features**:
  - Project name input
  - Project type selection
  - Form validation
  - Project initialization

### Frontend Pages

#### HomePage (`pages/HomePage.tsx`)
- **Purpose**: Landing page with project overview
- **Features**:
  - Hero section with call-to-action
  - Feature highlights
  - Authentication integration
  - Project quick access

#### DesignMode (`pages/DesignMode.tsx`)
- **Purpose**: Visual UI design interface
- **Features**:
  - Drag-and-drop component library
  - Real-time preview
  - Component properties panel
  - Auto-save functionality
  - Export capabilities

#### LogicMode (`pages/LogicMode.tsx`)
- **Purpose**: Flow-based programming interface
- **Features**:
  - Node-based interface
  - Logic flow creation
  - Connection management
  - Validation system

#### CodeMode (`pages/CodeMode.tsx`)
- **Purpose**: Code generation and preview
- **Features**:
  - Generated code display
  - Multiple language support
  - Code optimization
  - Export functionality

### Backend Services

#### AI Service (`services/aiService.ts`)
- **Purpose**: AI integration and processing
- **Features**:
  - OpenAI API integration
  - Chat processing
  - Text analysis
  - Image processing

#### Route Handlers
- **AI Routes** (`routes/ai.ts`): AI-related API endpoints
- **User Routes** (`routes/users.ts`): User management
- **Dashboard Routes** (`routes/dashboard.ts`): Analytics and metrics
- **Settings Routes** (`routes/settings.ts`): User preferences

## 🔧 Configuration Files

### Root Configuration
- **package.json**: Workspace configuration and scripts
- **docker-compose.yml**: Multi-container Docker setup
- **Dockerfile**: Production container configuration
- **Dockerfile.dev**: Development container configuration

### Frontend Configuration
- **vite.config.ts**: Build tool configuration
- **tailwind.config.js**: CSS framework configuration
- **tsconfig.json**: TypeScript compiler options
- **package.json**: Frontend dependencies and scripts

### Backend Configuration
- **tsconfig.json**: TypeScript compiler options
- **package.json**: Backend dependencies and scripts

## 🗄️ Database Structure

### Tables
- **projects**: Project metadata and user association
- **project_data**: Design, logic, and code data storage
- **user_settings**: User preferences and configuration

### Security
- **Row Level Security (RLS)**: Automatic data isolation
- **User Authentication**: Supabase auth integration
- **Policy-based Access**: Users can only access their own data

## 🚀 Development Workflow

### Local Development
1. **Install Dependencies**: `npm run install:all`
2. **Set Environment Variables**: Create `.env` file
3. **Start Development Servers**: `npm run dev`
4. **Access Applications**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5001

### Build Process
1. **Frontend Build**: `npm run build --workspace=frontend`
2. **Backend Build**: `npm run build --workspace=backend`
3. **Production Start**: `npm run start --workspace=backend`

### Docker Development
1. **Build Images**: `docker-compose build`
2. **Start Services**: `docker-compose up`
3. **Access Applications**: Same URLs as local development

## 🔍 Code Organization Principles

### Frontend Organization
- **Component-based Architecture**: Reusable UI components
- **Page-based Routing**: Clear separation of page components
- **Context-based State Management**: React Context for global state
- **Service Layer**: API communication abstraction
- **Type Safety**: Full TypeScript implementation

### Backend Organization
- **Route-based Structure**: Clear API endpoint organization
- **Service Layer**: Business logic separation
- **Middleware Pattern**: Request/response processing
- **Error Handling**: Centralized error management

### Shared Code
- **Type Definitions**: Common TypeScript interfaces
- **Utility Functions**: Shared helper functions
- **Constants**: Application-wide constants

## 🧹 Code Quality

### Linting and Formatting
- **ESLint**: Code quality and style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Type checking and validation

### Testing Strategy
- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: User workflow testing

## 📚 Documentation

### Code Documentation
- **JSDoc Comments**: Function and component documentation
- **Type Definitions**: Self-documenting TypeScript types
- **README Files**: Package-specific documentation

### Architecture Documentation
- **API Documentation**: Endpoint specifications
- **Database Schema**: Table and relationship documentation
- **Deployment Guide**: Production deployment instructions

## 🔒 Security Considerations

### Frontend Security
- **Input Validation**: Form and data validation
- **XSS Prevention**: Content Security Policy
- **Authentication**: Secure token management

### Backend Security
- **CORS Configuration**: Cross-origin request handling
- **Rate Limiting**: API request throttling
- **Input Sanitization**: Request data validation
- **Authentication**: JWT token validation

### Database Security
- **Row Level Security**: Automatic data isolation
- **Connection Security**: Encrypted database connections
- **Backup Strategy**: Regular data backups

## 🚀 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Tree shaking and minification
- **Caching Strategy**: Static asset caching
- **Image Optimization**: Compressed and responsive images

### Backend Optimization
- **Database Indexing**: Query performance optimization
- **Caching Layer**: Redis integration for caching
- **Connection Pooling**: Database connection management
- **Compression**: Response compression

## 🔄 State Management

### Frontend State
- **React Context**: Global state management
- **Local State**: Component-specific state
- **Form State**: Controlled form components
- **Cache State**: API response caching

### Backend State
- **Session Management**: User session handling
- **Cache State**: Redis-based caching
- **Database State**: Persistent data storage

## 📱 Responsive Design

### Mobile-First Approach
- **Breakpoint Strategy**: Tailwind CSS responsive classes
- **Touch Interactions**: Mobile-optimized interactions
- **Performance**: Optimized for mobile devices

### Desktop Experience
- **Keyboard Navigation**: Full keyboard support
- **Mouse Interactions**: Hover and click states
- **Large Screen Layout**: Optimized for desktop displays

## 🔧 Development Tools

### Code Quality Tools
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks for code quality

### Development Servers
- **Vite**: Frontend development server
- **Nodemon**: Backend development server
- **Concurrently**: Parallel development server execution

### Build Tools
- **Vite**: Frontend build tool
- **TypeScript Compiler**: Backend build tool
- **Docker**: Containerized builds

## 📊 Monitoring and Logging

### Application Monitoring
- **Error Tracking**: Error reporting and monitoring
- **Performance Monitoring**: Application performance metrics
- **User Analytics**: User behavior tracking

### Logging Strategy
- **Structured Logging**: JSON-formatted logs
- **Log Levels**: Debug, info, warn, error levels
- **Log Rotation**: Automatic log file management

## 🔄 Deployment Strategy

### Environment Management
- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live application environment

### Deployment Methods
- **Docker Deployment**: Containerized deployment
- **Vercel Deployment**: Frontend hosting
- **Manual Deployment**: Traditional server deployment

## 🤝 Contributing Guidelines

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint Rules**: Consistent code style
- **Commit Messages**: Conventional commit format
- **Pull Requests**: Code review process

### Development Process
- **Feature Branches**: Git workflow
- **Testing Requirements**: Test coverage expectations
- **Documentation**: Code documentation requirements
- **Review Process**: Peer review guidelines

---

This documentation provides a comprehensive overview of the CTRL MVP project structure. For specific implementation details, refer to the individual component and service files.
