#!/bin/bash

# CTRL MVP Docker Deployment Script
# Usage: ./deploy.sh [production|development|staging]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            print_warning ".env file not found. Copying from .env.example"
            cp .env.example .env
            print_warning "Please edit .env file with your configuration before continuing"
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error ".env file not found and no .env.example available"
            exit 1
        fi
    fi
    
    print_success "Environment setup completed"
}

# Function to build and deploy production
deploy_production() {
    print_status "Deploying to production..."
    
    # Stop existing containers
    docker-compose down --remove-orphans
    
    # Build and start containers
    docker-compose up -d --build
    
    # Wait for containers to be healthy
    print_status "Waiting for containers to be healthy..."
    sleep 10
    
    # Check health
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        print_success "Production deployment successful!"
        print_status "Application is running at: http://localhost:3000"
        print_status "Health check: http://localhost:3000/health"
    else
        print_error "Health check failed. Check logs with: docker-compose logs -f"
        exit 1
    fi
}

# Function to deploy with Nginx
deploy_production_nginx() {
    print_status "Deploying to production with Nginx..."
    
    # Check for SSL certificates
    if [ ! -f docker/ssl/cert.pem ] || [ ! -f docker/ssl/key.pem ]; then
        print_warning "SSL certificates not found. Creating self-signed certificates for development..."
        mkdir -p docker/ssl
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout docker/ssl/key.pem \
            -out docker/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    fi
    
    # Stop existing containers
    docker-compose --profile production down --remove-orphans
    
    # Build and start containers with Nginx
    docker-compose --profile production up -d --build
    
    # Wait for containers to be healthy
    print_status "Waiting for containers to be healthy..."
    sleep 15
    
    # Check health
    if curl -f http://localhost/health >/dev/null 2>&1; then
        print_success "Production deployment with Nginx successful!"
        print_status "Application is running at: http://localhost"
        print_status "HTTPS available at: https://localhost"
        print_status "Health check: http://localhost/health"
    else
        print_error "Health check failed. Check logs with: docker-compose logs -f"
        exit 1
    fi
}

# Function to deploy development
deploy_development() {
    print_status "Deploying to development..."
    
    # Stop existing containers
    docker-compose --profile dev down --remove-orphans
    
    # Build and start development containers
    docker-compose --profile dev up -d --build ctrl-mvp-dev
    
    # Wait for containers to be healthy
    print_status "Waiting for containers to be healthy..."
    sleep 10
    
    # Check health
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        print_success "Development deployment successful!"
        print_status "Application is running at: http://localhost:3001"
        print_status "Health check: http://localhost:3001/health"
        print_status "Hot reload is enabled for development"
    else
        print_error "Health check failed. Check logs with: docker-compose --profile dev logs -f"
        exit 1
    fi
}

# Function to show logs
show_logs() {
    local profile=${1:-""}
    if [ "$profile" = "dev" ]; then
        docker-compose --profile dev logs -f ctrl-mvp-dev
    elif [ "$profile" = "production" ]; then
        docker-compose --profile production logs -f
    else
        docker-compose logs -f
    fi
}

# Function to stop all containers
stop_all() {
    print_status "Stopping all containers..."
    docker-compose down --remove-orphans
    docker-compose --profile dev down --remove-orphans
    docker-compose --profile production down --remove-orphans
    print_success "All containers stopped"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker system prune -f
    docker volume prune -f
    print_success "Cleanup completed"
}

# Function to show status
show_status() {
    print_status "Container status:"
    docker-compose ps
    echo ""
    print_status "Resource usage:"
    docker stats --no-stream
}

# Function to show help
show_help() {
    echo "CTRL MVP Docker Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  production     Deploy to production (single container)"
    echo "  production-nginx Deploy to production with Nginx reverse proxy"
    echo "  development    Deploy to development (with hot reload)"
    echo "  logs [dev|production] Show logs (default: production)"
    echo "  stop           Stop all containers"
    echo "  status         Show container status and resource usage"
    echo "  cleanup        Clean up Docker resources"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 production"
    echo "  $0 development"
    echo "  $0 logs dev"
    echo "  $0 status"
}

# Main script logic
case "${1:-help}" in
    "production")
        check_prerequisites
        setup_environment
        deploy_production
        ;;
    "production-nginx")
        check_prerequisites
        setup_environment
        deploy_production_nginx
        ;;
    "development")
        check_prerequisites
        setup_environment
        deploy_development
        ;;
    "logs")
        show_logs "$2"
        ;;
    "stop")
        stop_all
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac 