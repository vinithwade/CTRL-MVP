# CTRL MVP - API Documentation

This document provides comprehensive documentation for all API endpoints in the CTRL MVP backend.

## 🔗 Base URL

- **Development**: `http://localhost:5001`
- **Production**: `https://your-domain.com`

## 📋 Authentication

All API endpoints require authentication via Supabase JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🔄 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

## 🧠 AI Endpoints

### POST /api/ai/chat

Process chat messages with AI.

**Request Body:**
```json
{
  "message": "User message",
  "context": "Optional context",
  "history": [
    {
      "role": "user|assistant",
      "content": "Message content"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "message-id",
    "response": "AI response",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "tokens_used": 150
  }
}
```

**Error Codes:**
- `400` - Invalid request body
- `401` - Unauthorized
- `500` - AI service error

### POST /api/ai/batch

Process multiple messages in batch.

**Request Body:**
```json
{
  "messages": [
    {
      "id": "message-1",
      "content": "First message"
    },
    {
      "id": "message-2", 
      "content": "Second message"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "message-1",
        "response": "AI response 1",
        "status": "completed"
      },
      {
        "id": "message-2",
        "response": "AI response 2", 
        "status": "completed"
      }
    ]
  }
}
```

### GET /api/ai/status

Get AI service status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "online|offline|maintenance",
    "version": "1.0.0",
    "uptime": 3600,
    "last_check": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/ai/capabilities

Get available AI features.

**Response:**
```json
{
  "success": true,
  "data": {
    "features": [
      {
        "name": "chat",
        "description": "Real-time chat",
        "enabled": true
      },
      {
        "name": "code_generation",
        "description": "Code generation",
        "enabled": true
      },
      {
        "name": "text_analysis",
        "description": "Text analysis",
        "enabled": true
      }
    ]
  }
}
```

### POST /api/ai/analyze

Analyze text content.

**Request Body:**
```json
{
  "text": "Text to analyze",
  "analysis_type": "sentiment|keywords|summary"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "sentiment": "positive",
      "confidence": 0.85,
      "keywords": ["keyword1", "keyword2"],
      "summary": "Text summary"
    }
  }
}
```

### POST /api/ai/image

Process image with AI.

**Request Body:**
```json
{
  "image_url": "https://example.com/image.jpg",
  "task": "description|analysis|generation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": "AI processing result",
    "confidence": 0.92
  }
}
```

## 👥 User Endpoints

### GET /api/users

Get all users (admin only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-id",
        "email": "user@example.com",
        "created_at": "2024-01-01T00:00:00.000Z",
        "last_login": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### GET /api/users/:id

Get user by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "profile": {
      "name": "User Name",
      "avatar": "https://example.com/avatar.jpg"
    },
    "settings": {
      "theme": "dark",
      "notifications": true
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/users

Create new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "profile": {
    "name": "User Name"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

### PUT /api/users/:id

Update user.

**Request Body:**
```json
{
  "profile": {
    "name": "Updated Name"
  },
  "settings": {
    "theme": "light"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "User updated successfully"
}
```

### DELETE /api/users/:id

Delete user.

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## 📊 Dashboard Endpoints

### GET /api/dashboard/stats

Get dashboard statistics.

**Query Parameters:**
- `period` (optional): Time period (day|week|month|year)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "active": 750,
      "new_this_period": 50
    },
    "projects": {
      "total": 2500,
      "completed": 1800,
      "in_progress": 700
    },
    "ai_usage": {
      "total_requests": 15000,
      "successful": 14800,
      "failed": 200
    },
    "performance": {
      "avg_response_time": 250,
      "uptime": 99.9
    }
  }
}
```

### GET /api/dashboard/activity

Get recent activity.

**Query Parameters:**
- `limit` (optional): Number of activities (default: 20)
- `type` (optional): Activity type filter

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity-id",
        "type": "project_created",
        "user_id": "user-id",
        "data": {
          "project_name": "My Project"
        },
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### GET /api/dashboard/performance

Get performance metrics.

**Query Parameters:**
- `metric` (optional): Specific metric (response_time|uptime|errors)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "response_time": {
        "current": 250,
        "average": 245,
        "trend": "stable"
      },
      "uptime": {
        "current": 99.9,
        "average": 99.8,
        "trend": "improving"
      },
      "errors": {
        "current": 0.1,
        "average": 0.2,
        "trend": "decreasing"
      }
    }
  }
}
```

### GET /api/dashboard/ai-analytics

Get AI usage analytics.

**Query Parameters:**
- `period` (optional): Time period (day|week|month)

**Response:**
```json
{
  "success": true,
  "data": {
    "usage": {
      "total_requests": 15000,
      "successful_requests": 14800,
      "failed_requests": 200,
      "avg_tokens_per_request": 150
    },
    "features": {
      "chat": {
        "requests": 8000,
        "success_rate": 98.5
      },
      "code_generation": {
        "requests": 5000,
        "success_rate": 95.2
      },
      "text_analysis": {
        "requests": 2000,
        "success_rate": 99.1
      }
    },
    "trends": {
      "daily_usage": [
        {
          "date": "2024-01-01",
          "requests": 500
        }
      ]
    }
  }
}
```

## ⚙️ Settings Endpoints

### GET /api/settings

Get all settings for current user.

**Response:**
```json
{
  "success": true,
  "data": {
    "general": {
      "theme": "dark",
      "language": "en",
      "timezone": "UTC"
    },
    "notifications": {
      "email": true,
      "push": false,
      "frequency": "daily"
    },
    "ai": {
      "model": "gpt-4",
      "max_tokens": 1000,
      "temperature": 0.7
    },
    "privacy": {
      "data_sharing": false,
      "analytics": true
    }
  }
}
```

### PUT /api/settings

Update settings.

**Request Body:**
```json
{
  "general": {
    "theme": "light"
  },
  "notifications": {
    "email": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Settings updated successfully"
}
```

### GET /api/settings/:category

Get specific setting category.

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "language": "en",
    "timezone": "UTC"
  }
}
```

### PUT /api/settings/:category

Update specific setting category.

**Request Body:**
```json
{
  "theme": "light",
  "language": "es"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Settings updated successfully"
}
```

## 🔍 Health Check

### GET /health

Get server health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production"
}
```

## 🚨 Error Codes

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST` - Invalid request body or parameters
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMITED` - Too many requests
- `VALIDATION_ERROR` - Input validation failed
- `AI_SERVICE_ERROR` - AI service unavailable
- `DATABASE_ERROR` - Database operation failed

## 🔐 Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **AI endpoints**: 50 requests per 15 minutes
- **Authentication endpoints**: 10 requests per 15 minutes

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📝 Request/Response Examples

### Example: Chat with AI

**Request:**
```bash
curl -X POST http://localhost:5001/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "message": "Hello, how can you help me?",
    "context": "User is working on a React project"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg_123456",
    "response": "Hello! I can help you with your React project. I can assist with code generation, debugging, and best practices. What specific help do you need?",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "tokens_used": 45
  }
}
```

### Example: Get User Profile

**Request:**
```bash
curl -X GET http://localhost:5001/api/users/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "profile": {
      "name": "John Doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "settings": {
      "theme": "dark",
      "notifications": true
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🔄 WebSocket Events

### Connection Events

**Client connects:**
```javascript
socket.on('connect', () => {
  console.log('Connected to server');
});
```

**Client disconnects:**
```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

### AI Events

**Send AI query:**
```javascript
socket.emit('ai-query', {
  message: 'Hello AI',
  context: 'User context'
});
```

**Receive AI response:**
```javascript
socket.on('ai-response', (data) => {
  console.log('AI Response:', data);
});
```

**AI error:**
```javascript
socket.on('ai-error', (error) => {
  console.error('AI Error:', error);
});
```

### Room Events

**Join room:**
```javascript
socket.emit('join-room', 'project-123');
```

**Room joined:**
```javascript
socket.on('room-joined', (data) => {
  console.log('Joined room:', data.room);
});
```

## 📚 SDK Examples

### JavaScript/TypeScript

```typescript
class CTRLAPI {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  async chat(message: string, context?: string) {
    return this.request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async getUser(id: string) {
    return this.request(`/api/users/${id}`);
  }

  async updateSettings(settings: any) {
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

// Usage
const api = new CTRLAPI('http://localhost:5001', 'your-jwt-token');

// Chat with AI
const response = await api.chat('Hello AI');
console.log(response.data);

// Get user profile
const user = await api.getUser('me');
console.log(user.data);
```

### Python

```python
import requests
import json

class CTRLAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }

    def request(self, endpoint: str, method: str = 'GET', data: dict = None):
        url = f"{self.base_url}{endpoint}"
        
        response = requests.request(
            method=method,
            url=url,
            headers=self.headers,
            json=data
        )
        
        response_data = response.json()
        
        if not response.ok:
            raise Exception(response_data.get('error', 'API request failed'))
        
        return response_data

    def chat(self, message: str, context: str = None):
        data = {'message': message}
        if context:
            data['context'] = context
        
        return self.request('/api/ai/chat', method='POST', data=data)

    def get_user(self, user_id: str):
        return self.request(f'/api/users/{user_id}')

    def update_settings(self, settings: dict):
        return self.request('/api/settings', method='PUT', data=settings)

# Usage
api = CTRLAPI('http://localhost:5001', 'your-jwt-token')

# Chat with AI
response = api.chat('Hello AI')
print(response['data'])

# Get user profile
user = api.get_user('me')
print(user['data'])
```

## 🔧 Testing

### Using curl

```bash
# Test health endpoint
curl http://localhost:5001/health

# Test AI chat (with authentication)
curl -X POST http://localhost:5001/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"message": "Hello"}'

# Test user profile
curl -X GET http://localhost:5001/api/users/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Using Postman

1. **Set up environment variables:**
   - `base_url`: `http://localhost:5001`
   - `token`: Your JWT token

2. **Create requests:**
   - Method: `POST`
   - URL: `{{base_url}}/api/ai/chat`
   - Headers: `Authorization: Bearer {{token}}`
   - Body: JSON with your request data

## 📈 Monitoring

### Health Checks

Monitor API health with the `/health` endpoint:

```bash
# Check health
curl http://localhost:5001/health

# Expected response
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### Metrics

Track API usage with dashboard endpoints:

- `/api/dashboard/stats` - Overall statistics
- `/api/dashboard/performance` - Performance metrics
- `/api/dashboard/ai-analytics` - AI usage analytics

---

This API documentation provides comprehensive information about all available endpoints. For additional support or questions, refer to the development team or create an issue in the repository.
