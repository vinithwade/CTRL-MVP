# CTRL MVP - AI-Powered Full-Stack Platform

A modern, full-stack React application with AI integration, featuring a beautiful UI, robust backend API, and intelligent automation capabilities.

## 🚀 Features

- **Modern React Frontend**: Built with TypeScript, Vite, and Tailwind CSS
- **AI Integration**: OpenAI-powered chat assistant and data processing
- **Real-time Communication**: WebSocket support for live updates
- **Responsive Design**: Mobile-first approach with modern UI components
- **Type Safety**: Full TypeScript support across frontend and backend
- **API-First Architecture**: RESTful API with comprehensive endpoints
- **State Management**: React Context and custom hooks for efficient state handling
- **Authentication Ready**: Supabase-based authentication system
- **Database Integration**: Supabase with PostgreSQL
- **File Upload**: Image and document processing capabilities

## 📁 Project Structure

```
CTRL_mvp/
├── packages/
│   ├── frontend/          # React frontend application
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   │   ├── Layout.tsx         # Main layout component
│   │   │   │   ├── AuthModal.tsx      # Authentication modal
│   │   │   │   └── CreateProjectModal.tsx # Project creation modal
│   │   │   ├── pages/         # Page components
│   │   │   │   ├── HomePage.tsx       # Landing page
│   │   │   │   ├── AIPage.tsx         # AI chat interface
│   │   │   │   ├── DashboardPage.tsx  # Main dashboard
│   │   │   │   ├── UserDashboardPage.tsx # User-specific dashboard
│   │   │   │   ├── ProfilePage.tsx    # User profile
│   │   │   │   ├── SettingsPage.tsx   # Settings page
│   │   │   │   ├── DesignMode.tsx     # Design mode interface
│   │   │   │   ├── LogicMode.tsx      # Logic mode interface
│   │   │   │   └── CodeMode.tsx       # Code generation mode
│   │   │   ├── contexts/       # React contexts
│   │   │   │   ├── NavigationContext.tsx # Navigation state
│   │   │   │   └── DesignContext.tsx  # Design state management
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   │   └── useAuth.ts  # Authentication hook
│   │   │   ├── services/       # API service functions
│   │   │   │   └── projectService.ts # Project management
│   │   │   ├── utils/          # Utility functions
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   ├── styles/         # CSS styles
│   │   │   ├── assets/         # Static assets
│   │   │   ├── App.tsx         # Main app component
│   │   │   ├── main.tsx        # App entry point
│   │   │   └── supabaseClient.ts # Supabase client
│   │   └── ...
│   ├── backend/           # Node.js/Express API server
│   │   ├── src/
│   │   │   ├── routes/         # API routes
│   │   │   │   ├── ai.ts       # AI-related endpoints
│   │   │   │   ├── users.ts    # User management
│   │   │   │   ├── dashboard.ts # Dashboard data
│   │   │   │   └── settings.ts # Settings management
│   │   │   ├── services/       # Business logic services
│   │   │   │   └── aiService.ts # AI service integration
│   │   │   ├── middleware/     # Express middleware
│   │   │   │   ├── errorHandler.ts # Error handling
│   │   │   │   └── notFound.ts # 404 handler
│   │   │   └── index.ts        # Server entry point
│   │   └── ...
│   └── shared/            # Shared types and utilities
│       └── src/
│           └── index.ts       # Common types and utilities
├── docker/                # Docker configuration
├── database-setup.sql     # Database schema
├── setup-database.sh      # Database setup script
└── README.md             # This file
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Context** - State management
- **Supabase** - Backend as a Service
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **Socket.io** - Real-time communication
- **OpenAI** - AI integration
- **Supabase** - Database and authentication

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server
- **Concurrently** - Run multiple commands

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CTRL_mvp
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up Supabase**
   - Create a new project at [Supabase](https://supabase.com)
   - Get your project URL and anon key
   - Run the database setup script:
   ```bash
   ./setup-database.sh
   ```
   
   For detailed database setup instructions, see [DATABASE_SETUP.md](./DATABASE_SETUP.md)

4. **Set up environment variables**
   ```bash
   # Create .env file in the root directory with the following variables:
   PORT=5001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Frontend Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Backend Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both frontend (http://localhost:3000) and backend (http://localhost:5001) servers.

## 📖 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all packages
- `npm run install:all` - Install dependencies for all packages

### Frontend
- `npm run dev:frontend` - Start frontend development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm run dev:backend` - Start backend development server
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### AI Integration

To enable AI features, you'll need an OpenAI API key:

1. Sign up at [OpenAI](https://openai.com)
2. Get your API key from the dashboard
3. Add it to your `.env` file as `OPENAI_API_KEY`

## 🔒 User Isolation & Database Features

### Complete User Separation
- **Individual Database Spaces**: Each user has their own isolated database space
- **Row Level Security (RLS)**: Automatic data isolation based on user authentication
- **Project Persistence**: All project data is automatically saved and loaded per user
- **Real-time Auto-save**: Design changes are saved every 30 seconds

### Database Schema
- **`projects`**: Main project metadata with user association
- **`project_data`**: Design, logic, and code data storage
- **`user_settings`**: User preferences and configuration
- **Automatic Timestamps**: Created/updated timestamps managed by triggers
- **Performance Indexes**: Optimized queries for fast data retrieval

### Security Features
- **Authentication Required**: All database operations require user authentication
- **Policy-based Access**: Users can only access their own data
- **Automatic User Association**: New projects are automatically linked to the authenticated user
- **Data Integrity**: Foreign key constraints and cascading deletes

## 🎯 Features Overview

### AI Assistant
- Real-time chat interface
- Context-aware responses
- Message history
- File upload support
- Voice input (planned)

### Dashboard
- Real-time analytics
- User activity monitoring
- System performance metrics
- AI usage statistics
- Interactive charts

### Settings
- User preferences
- AI configuration
- Notification settings
- Theme customization
- Data management

### Design Mode
- Visual UI builder
- Component library
- Real-time preview
- Export functionality

### Logic Mode
- Flow-based programming
- Node-based interface
- Logic validation
- Auto-save functionality

### Code Mode
- Generated code preview
- Multiple language support
- Code optimization
- Export capabilities

## 🔌 API Endpoints

### AI Routes (`/api/ai`)
- `POST /chat` - Process chat messages
- `POST /batch` - Batch data processing
- `GET /status` - AI service status
- `GET /capabilities` - Available AI features
- `POST /analyze` - Text analysis
- `POST /image` - Image processing

### User Routes (`/api/users`)
- `GET /` - Get all users
- `GET /:id` - Get user by ID
- `POST /` - Create user
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user

### Dashboard Routes (`/api/dashboard`)
- `GET /stats` - Get dashboard statistics
- `GET /activity` - Get recent activity
- `GET /performance` - Get performance metrics
- `GET /ai-analytics` - Get AI usage analytics

### Settings Routes (`/api/settings`)
- `GET /` - Get all settings
- `PUT /` - Update settings
- `GET /:category` - Get specific setting category
- `PUT /:category` - Update specific setting category

## 🎨 UI Components

The frontend includes a comprehensive set of reusable components:

- **Layout** - Main application layout with sidebar navigation
- **AuthModal** - Authentication modal for login/signup
- **CreateProjectModal** - Project creation interface
- **Cards** - Content containers with consistent styling
- **Buttons** - Primary and secondary button variants
- **Forms** - Input fields and form controls
- **Chat Interface** - AI chat component with message history
- **Dashboard Cards** - Statistics and metric displays

## 🔒 Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Input Validation** - Request validation
- **Rate Limiting** - API request limiting
- **Supabase Auth** - Secure authentication
- **Environment Variables** - Secure configuration

## 🚀 Deployment

### Frontend Deployment
```bash
cd packages/frontend
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend Deployment
```bash
cd packages/backend
npm run build
npm start
# Deploy to your server or cloud platform
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Environment Setup
Make sure to set up your production environment variables:
- Database connection string
- OpenAI API key
- JWT secret
- CORS origins
- Logging configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🔮 Roadmap

- [x] User authentication and authorization
- [x] Real-time project saving
- [ ] Real-time notifications
- [ ] Advanced AI features (voice, image generation)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Plugin system
- [ ] API rate limiting and monitoring
- [ ] Automated testing suite
- [ ] CI/CD pipeline

---

Built with ❤️ using modern web technologies 