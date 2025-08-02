# CTRL MVP Docker Deployment Guide

This guide explains how to deploy the CTRL MVP application using Docker containers.

## 🐳 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available

### 1. Production Deployment

```bash
# Clone the repository
git clone <your-repo-url>
cd CTRL_mvp

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Build and run with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f ctrl-mvp
```

### 2. Development Deployment

```bash
# Run development version with hot reload
docker-compose --profile dev up -d ctrl-mvp-dev

# View development logs
docker-compose --profile dev logs -f ctrl-mvp-dev
```

### 3. Production with Nginx

```bash
# Run with Nginx reverse proxy
docker-compose --profile production up -d

# Access via:
# - HTTP: http://localhost
# - HTTPS: https://localhost (requires SSL certificates)
```

## 📁 File Structure

```
CTRL_mvp/
├── Dockerfile              # Production multi-stage build
├── Dockerfile.dev          # Development with hot reload
├── docker-compose.yml      # Orchestration
├── .dockerignore           # Exclude files from build
└── docker/
    ├── server.js           # Combined server (frontend + backend)
    ├── nginx.conf          # Nginx reverse proxy config
    └── README.md           # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:3000

# API Keys
OPENAI_API_KEY=your_openai_api_key

# Database (if using MongoDB)
MONGODB_URI=mongodb://localhost:27017/ctrl_mvp

# Security
JWT_SECRET=your_jwt_secret_key

# CORS
CORS_ORIGIN=http://localhost:3000
```

### SSL Certificates (for HTTPS)

For production with HTTPS, place your SSL certificates in `docker/ssl/`:

```bash
mkdir -p docker/ssl
# Copy your certificates
cp your-cert.pem docker/ssl/cert.pem
cp your-key.pem docker/ssl/key.pem
```

## 🚀 Deployment Options

### 1. Single Container (Recommended for most cases)

```bash
# Build and run
docker build -t ctrl-mvp .
docker run -p 3000:3000 --env-file .env ctrl-mvp
```

### 2. Docker Compose (Recommended for production)

```bash
# Production
docker-compose up -d

# Development
docker-compose --profile dev up -d ctrl-mvp-dev

# With Nginx
docker-compose --profile production up -d
```

### 3. Kubernetes (Advanced)

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoint
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Docker Health Checks
```bash
# Check container health
docker ps

# View health check logs
docker inspect ctrl-mvp | grep Health -A 10
```

## 📊 Performance Optimization

### 1. Multi-stage Build
The production Dockerfile uses multi-stage builds to minimize image size:
- Base stage: Install dependencies
- Frontend build: Build React app
- Backend build: Build Node.js app
- Production: Combine built assets

### 2. Nginx Optimization
- Gzip compression
- Static file caching
- Rate limiting
- SSL/TLS termination

### 3. Resource Limits
```yaml
# Add to docker-compose.yml
services:
  ctrl-mvp:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

## 🔒 Security Features

### 1. Non-root User
Containers run as non-root user (nextjs:nodejs)

### 2. Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security

### 3. Rate Limiting
- API endpoints: 10 requests/second
- Login endpoints: 5 requests/minute

### 4. CORS Protection
Configurable CORS origins for API endpoints

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Use different port
docker run -p 3001:3000 ctrl-mvp
```

#### 2. Permission Denied
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Or run with proper user
docker run --user $(id -u):$(id -g) ctrl-mvp
```

#### 3. Build Failures
```bash
# Clean build cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t ctrl-mvp .
```

#### 4. Environment Variables
```bash
# Check environment variables
docker exec ctrl-mvp env

# Update environment
docker-compose down
docker-compose up -d
```

### Logs and Debugging

```bash
# View application logs
docker-compose logs -f ctrl-mvp

# View nginx logs
docker-compose logs -f nginx

# Access container shell
docker exec -it ctrl-mvp sh

# Check container resources
docker stats ctrl-mvp
```

## 🌐 Deployment Platforms

### 1. AWS ECS
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
docker tag ctrl-mvp:latest your-account.dkr.ecr.us-east-1.amazonaws.com/ctrl-mvp:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/ctrl-mvp:latest
```

### 2. Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/your-project/ctrl-mvp
gcloud run deploy ctrl-mvp --image gcr.io/your-project/ctrl-mvp --platform managed
```

### 3. DigitalOcean App Platform
```bash
# Deploy using doctl
doctl apps create --spec app.yaml
```

### 4. Heroku
```bash
# Deploy using Heroku Container Registry
heroku container:push web
heroku container:release web
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale to 3 instances
docker-compose up -d --scale ctrl-mvp=3
```

### Load Balancing
The Nginx configuration supports multiple backend instances:
```nginx
upstream ctrl_backend {
    server ctrl-mvp:3000;
    server ctrl-mvp-2:3000;
    server ctrl-mvp-3:3000;
}
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push
        run: |
          docker build -t ctrl-mvp .
          docker push ctrl-mvp:latest
```

## 📝 Environment-Specific Configurations

### Development
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  ctrl-mvp:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - ./packages/frontend/src:/app/packages/frontend/src
      - ./packages/backend/src:/app/packages/backend/src
    environment:
      - NODE_ENV=development
```

### Staging
```yaml
# docker-compose.staging.yml
version: '3.8'
services:
  ctrl-mvp:
    environment:
      - NODE_ENV=staging
      - FRONTEND_URL=https://staging.yourapp.com
```

### Production
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  ctrl-mvp:
    environment:
      - NODE_ENV=production
      - FRONTEND_URL=https://yourapp.com
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
```

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review application logs: `docker-compose logs -f`
3. Check health endpoint: `curl http://localhost:3000/health`
4. Verify environment variables: `docker exec ctrl-mvp env`

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/) 