# CTRL MVP - Troubleshooting Guide

This guide provides solutions for common issues encountered while working with the CTRL MVP project.

## 🚨 Common Issues

### Frontend Issues

#### 1. Build Errors

**Problem**: Frontend build fails with TypeScript or dependency errors.

**Solutions**:
```bash
# Clear cache and reinstall dependencies
cd packages/frontend
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit

# Clear Vite cache
rm -rf node_modules/.vite
```

**Common Causes**:
- Outdated dependencies
- TypeScript configuration issues
- Cache corruption
- Missing environment variables

#### 2. Development Server Won't Start

**Problem**: `npm run dev` fails to start the frontend server.

**Solutions**:
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Start with different port
cd packages/frontend
npm run dev -- --port 3001
```

**Common Causes**:
- Port already in use
- Missing dependencies
- Environment variable issues

#### 3. Hot Reload Not Working

**Problem**: Changes don't reflect automatically in the browser.

**Solutions**:
```bash
# Clear Vite cache
cd packages/frontend
rm -rf node_modules/.vite

# Restart development server
npm run dev

# Check file watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**Common Causes**:
- File watcher limits
- Cache issues
- Browser cache

#### 4. TypeScript Errors

**Problem**: TypeScript compilation errors.

**Solutions**:
```bash
# Check TypeScript configuration
cd packages/frontend
npx tsc --noEmit

# Fix common issues
npm install @types/node @types/react @types/react-dom

# Update TypeScript
npm install typescript@latest
```

**Common Causes**:
- Missing type definitions
- Outdated TypeScript version
- Configuration issues

### Backend Issues

#### 1. Server Won't Start

**Problem**: Backend server fails to start.

**Solutions**:
```bash
# Check if port 5001 is in use
lsof -i :5001

# Kill process if needed
kill -9 <PID>

# Check environment variables
echo $NODE_ENV
echo $PORT

# Start with debug logging
cd packages/backend
DEBUG=* npm run dev
```

**Common Causes**:
- Port conflicts
- Missing environment variables
- Database connection issues

#### 2. Database Connection Errors

**Problem**: Cannot connect to Supabase database.

**Solutions**:
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Test database connection
curl -X GET "https://your-project.supabase.co/rest/v1/" \
  -H "apikey: your_supabase_anon_key" \
  -H "Authorization: Bearer your_supabase_anon_key"

# Verify Supabase project status
# Check Supabase dashboard for project status
```

**Common Causes**:
- Incorrect environment variables
- Supabase project down
- Network connectivity issues
- API key permissions

#### 3. AI Service Errors

**Problem**: AI endpoints return errors.

**Solutions**:
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Test OpenAI API
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'

# Check API quota
# Visit OpenAI dashboard to check usage
```

**Common Causes**:
- Invalid API key
- Exceeded quota
- Network issues
- Service downtime

#### 4. Authentication Issues

**Problem**: Users can't log in or authenticate.

**Solutions**:
```bash
# Check Supabase auth configuration
# Verify in Supabase dashboard:
# - Authentication settings
# - Email templates
# - Social providers

# Test authentication
curl -X POST "https://your-project.supabase.co/auth/v1/signup" \
  -H "apikey: your_supabase_anon_key" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Common Causes**:
- Incorrect Supabase configuration
- Email service issues
- JWT token expiration
- CORS configuration

### Docker Issues

#### 1. Docker Build Fails

**Problem**: Docker image build fails.

**Solutions**:
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -t test-image .

# Check available disk space
df -h
```

**Common Causes**:
- Insufficient disk space
- Network connectivity issues
- Dockerfile syntax errors
- Dependency conflicts

#### 2. Container Won't Start

**Problem**: Docker containers fail to start.

**Solutions**:
```bash
# Check container logs
docker-compose logs

# Check specific service logs
docker-compose logs backend
docker-compose logs frontend

# Restart containers
docker-compose down
docker-compose up -d

# Check resource usage
docker stats
```

**Common Causes**:
- Port conflicts
- Environment variable issues
- Resource constraints
- Network configuration

#### 3. Volume Mount Issues

**Problem**: File changes not reflected in containers.

**Solutions**:
```bash
# Recreate volumes
docker-compose down -v
docker-compose up -d

# Check volume mounts
docker volume ls
docker volume inspect <volume_name>

# Force rebuild
docker-compose build --no-cache
docker-compose up -d
```

**Common Causes**:
- Volume permission issues
- File system differences
- Cache issues

### Environment Issues

#### 1. Environment Variables Not Loading

**Problem**: Environment variables not available in application.

**Solutions**:
```bash
# Check .env file exists
ls -la .env

# Verify environment variables
cat .env

# Test variable loading
node -e "require('dotenv').config(); console.log(process.env.NODE_ENV)"

# Restart development servers
npm run dev
```

**Common Causes**:
- Missing .env file
- Incorrect variable names
- File permission issues
- Cache issues

#### 2. Cross-Origin Issues

**Problem**: CORS errors in browser.

**Solutions**:
```bash
# Check CORS configuration in backend
# Verify FRONTEND_URL environment variable
echo $FRONTEND_URL

# Test CORS headers
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:5001/api/ai/chat
```

**Common Causes**:
- Incorrect CORS configuration
- Wrong frontend URL
- Missing headers

### Performance Issues

#### 1. Slow Development Server

**Problem**: Development server is slow to start or respond.

**Solutions**:
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Use faster package manager
npm install -g pnpm
pnpm install

# Optimize TypeScript compilation
# Update tsconfig.json with faster options
```

**Common Causes**:
- Insufficient memory
- Slow disk I/O
- Large dependency tree
- TypeScript compilation

#### 2. Large Bundle Size

**Problem**: Frontend bundle is too large.

**Solutions**:
```bash
# Analyze bundle
cd packages/frontend
npm run build
npx vite-bundle-analyzer dist

# Optimize imports
# Use dynamic imports for large libraries
# Remove unused dependencies
```

**Common Causes**:
- Unused dependencies
- Large libraries
- No code splitting
- Missing tree shaking

## 🔧 Debugging Tools

### Frontend Debugging

#### Browser Developer Tools
```javascript
// Enable debug logging
localStorage.setItem('debug', '*');

// Check React component state
// Use React Developer Tools extension

// Monitor network requests
// Use Network tab in DevTools
```

#### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/packages/frontend/src"
    }
  ]
}
```

### Backend Debugging

#### Server Logging
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check specific modules
DEBUG=express:* npm run dev

# Log to file
npm run dev > server.log 2>&1
```

#### VS Code Debugging
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
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## 📊 Monitoring and Logs

### Application Logs

#### Frontend Logs
```bash
# Check browser console
# Open DevTools > Console

# Check build logs
cd packages/frontend
npm run build

# Check Vite logs
npm run dev
```

#### Backend Logs
```bash
# Check server logs
cd packages/backend
npm run dev

# Check Docker logs
docker-compose logs backend

# Check specific endpoint
curl -v http://localhost:5001/health
```

### Performance Monitoring

#### Frontend Performance
```bash
# Lighthouse audit
npx lighthouse http://localhost:3000

# Bundle analysis
cd packages/frontend
npm run build
npx vite-bundle-analyzer dist
```

#### Backend Performance
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5001/health

# Monitor memory usage
node --inspect packages/backend/src/index.ts
```

## 🛠️ Maintenance

### Regular Maintenance Tasks

#### Weekly
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Clean up Docker
docker system prune -f

# Check disk space
df -h
```

#### Monthly
```bash
# Update major dependencies
npm outdated
npm update

# Clean up old builds
rm -rf packages/*/dist
rm -rf packages/*/node_modules/.cache

# Check log files
find . -name "*.log" -size +100M -delete
```

### Backup and Recovery

#### Database Backup
```bash
# Export Supabase data
# Use Supabase dashboard or CLI

# Backup environment variables
cp .env .env.backup

# Backup configuration files
tar -czf config-backup.tar.gz *.json *.md
```

#### Recovery Procedures
```bash
# Restore from backup
cp .env.backup .env

# Reinstall dependencies
npm run install:all

# Restart services
npm run dev
```

## 🆘 Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Search existing issues** in the repository
3. **Check the documentation** (README.md, API_DOCUMENTATION.md)
4. **Try the solutions above**

### When Creating an Issue

Include the following information:

```markdown
## Issue Description
Brief description of the problem

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 12.0]
- Node.js: [e.g., 18.0.0]
- npm: [e.g., 9.0.0]

## Error Messages
```
Paste error messages here
```

## Additional Context
Any other relevant information
```

### Useful Commands for Debugging

```bash
# System information
node --version
npm --version
docker --version

# Check running processes
ps aux | grep node
lsof -i :3000
lsof -i :5001

# Check network connectivity
ping google.com
curl -I http://localhost:3000
curl -I http://localhost:5001

# Check disk space
df -h
du -sh packages/*

# Check memory usage
free -h
top
```

## 📚 Additional Resources

### Documentation
- [README.md](./README.md) - Main project documentation
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Development guide
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API documentation
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Project structure

### External Resources
- [Node.js Troubleshooting](https://nodejs.org/en/docs/guides/troubleshooting/)
- [React Debugging](https://react.dev/learn/react-developer-tools)
- [TypeScript Error Reference](https://github.com/Microsoft/TypeScript/wiki/Error-Codes)
- [Docker Troubleshooting](https://docs.docker.com/config/daemon/)

### Community Support
- [GitHub Issues](https://github.com/your-repo/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react+typescript)
- [Discord Community](https://discord.gg/your-community)

---

This troubleshooting guide should help resolve most common issues. If you're still experiencing problems, please create an issue with the information requested above. 