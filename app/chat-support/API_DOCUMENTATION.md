# Chat Support API Documentation

## Overview
This document outlines the API endpoints, request/response formats, and functions needed for the chat support system in the Esusu POS Operator app.

## Base URL
```
https://esusu-server.onrender.com/api/chat-support
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. Initialize Chat Session
**Endpoint:** `POST /chat-support/init`
**Purpose:** Start a new chat session or resume existing one

**Request Body:**
```json
{
  "userId": "string",
  "userPhone": "string",
  "userName": "string",
  "issueType": "string", // "general", "technical", "billing", "account", "other"
  "priority": "string", // "low", "medium", "high", "urgent"
  "description": "string" // Brief description of the issue
}
```

**Response:**
```json
{
  "status": "Success",
  "data": {
    "chatId": "string",
    "sessionId": "string",
    "agentId": "string",
    "agentName": "string",
    "status": "string", // "active", "waiting", "resolved"
    "createdAt": "2024-01-15T10:30:00Z",
    "estimatedWaitTime": "number", // in minutes
    "message": "string" // Welcome message or status update
  }
}
```

### 2. Send Message
**Endpoint:** `POST /chat-support/message`
**Purpose:** Send a message in an active chat session

**Request Body:**
```json
{
  "chatId": "string",
  "message": "string",
  "messageType": "string", // "text", "image", "file"
  "attachments": [
    {
      "type": "string", // "image", "document"
      "url": "string",
      "filename": "string",
      "size": "number"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "status": "Success",
  "data": {
    "messageId": "string",
    "chatId": "string",
    "status": "string", // "sent", "delivered", "read"
    "timestamp": "2024-01-15T10:30:00Z",
    "message": "string"
  }
}
```

### 3. Get Chat Messages
**Endpoint:** `GET /chat-support/messages/:chatId`
**Purpose:** Retrieve chat history for a specific session

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 50)
- `before`: string (ISO timestamp for pagination)

**Response:**
```json
{
  "status": "Success",
  "data": {
    "chatId": "string",
    "messages": [
      {
        "messageId": "string",
        "senderId": "string",
        "senderType": "string", // "user", "agent"
        "senderName": "string",
        "message": "string",
        "messageType": "string",
        "attachments": [],
        "timestamp": "2024-01-15T10:30:00Z",
        "status": "string"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "hasMore": true
    }
  }
}
```

### 4. Get Chat Sessions
**Endpoint:** `GET /chat-support/sessions`
**Purpose:** Retrieve user's chat session history

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `status`: string (optional: "active", "resolved", "closed")

**Response:**
```json
{
  "status": "Success",
  "data": {
    "sessions": [
      {
        "chatId": "string",
        "issueType": "string",
        "priority": "string",
        "status": "string",
        "agentName": "string",
        "lastMessage": "string",
        "lastMessageTime": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-15T10:30:00Z",
        "resolvedAt": "2024-01-15T11:30:00Z",
        "messageCount": 25
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "hasMore": true
    }
  }
}
```

### 5. Update Chat Status
**Endpoint:** `PUT /chat-support/status`
**Purpose:** Update chat session status (resolve, close, etc.)

**Request Body:**
```json
{
  "chatId": "string",
  "status": "string", // "resolved", "closed", "reopened"
  "resolution": "string", // Optional: resolution summary
  "rating": "number", // Optional: 1-5 rating
  "feedback": "string" // Optional: user feedback
}
```

**Response:**
```json
{
  "status": "Success",
  "data": {
    "chatId": "string",
    "status": "string",
    "updatedAt": "2024-01-15T11:30:00Z",
    "message": "Chat session updated successfully"
  }
}
```

### 6. Upload Attachment
**Endpoint:** `POST /chat-support/upload`
**Purpose:** Upload files/images for chat support

**Request Body:** (multipart/form-data)
```
file: <file>
chatId: string
messageType: string
```

**Response:**
```json
{
  "status": "Success",
  "data": {
    "fileId": "string",
    "filename": "string",
    "url": "string",
    "size": "number",
    "type": "string",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 7. Get Support Categories
**Endpoint:** `GET /chat-support/categories`
**Purpose:** Get available support categories and subcategories

**Response:**
```json
{
  "status": "Success",
  "data": {
    "categories": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "icon": "string",
        "subcategories": [
          {
            "id": "string",
            "name": "string",
            "description": "string"
          }
        ]
      }
    ]
  }
}
```

### 8. Get FAQ Suggestions
**Endpoint:** `GET /chat-support/faq-suggestions`
**Purpose:** Get relevant FAQ suggestions based on user's issue

**Query Parameters:**
- `issueType`: string
- `keywords`: string (comma-separated)

**Response:**
```json
{
  "status": "Success",
  "data": {
    "suggestions": [
      {
        "id": "string",
        "question": "string",
        "answer": "string",
        "relevance": "number" // 0-1 score
      }
    ]
  }
}
```

## WebSocket Events (Real-time Chat)

### Connection
**Event:** `connect`
**Data:** 
```json
{
  "userId": "string",
  "chatId": "string"
}
```

### New Message
**Event:** `new_message`
**Data:**
```json
{
  "chatId": "string",
  "message": {
    "messageId": "string",
    "senderId": "string",
    "senderType": "string",
    "senderName": "string",
    "message": "string",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Typing Indicator
**Event:** `typing`
**Data:**
```json
{
  "chatId": "string",
  "userId": "string",
  "isTyping": "boolean"
}
```

### Agent Status Update
**Event:** `agent_status`
**Data:**
```json
{
  "chatId": "string",
  "agentId": "string",
  "status": "string", // "online", "away", "busy"
  "message": "string"
}
```

### Chat Status Update
**Event:** `chat_status`
**Data:**
```json
{
  "chatId": "string",
  "status": "string",
  "message": "string",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Responses

### Standard Error Format
```json
{
  "status": "Error",
  "message": "string",
  "errorCode": "string",
  "details": "object"
}
```

### Common Error Codes
- `AUTH_REQUIRED`: Authentication token missing or invalid
- `CHAT_NOT_FOUND`: Chat session not found
- `CHAT_CLOSED`: Chat session is closed
- `INVALID_MESSAGE`: Message format is invalid
- `FILE_TOO_LARGE`: Uploaded file exceeds size limit
- `RATE_LIMITED`: Too many requests, please wait
- `AGENT_UNAVAILABLE`: No agents available at the moment

## Rate Limiting
- Message sending: 10 messages per minute per user
- File uploads: 5 files per hour per user
- Chat initialization: 3 sessions per hour per user

## File Upload Limits
- Image files: 5MB max (JPG, PNG, GIF)
- Document files: 10MB max (PDF, DOC, DOCX)
- Supported formats: JPG, PNG, GIF, PDF, DOC, DOCX

## Implementation Notes

### 1. Real-time Updates
- Use WebSocket connections for real-time message delivery
- Implement message queuing for offline users
- Send push notifications for important updates

### 2. Message Persistence
- Store all messages in database with proper indexing
- Implement message search functionality
- Archive old chats after 90 days

### 3. Agent Assignment
- Implement intelligent agent routing based on:
  - Issue type and priority
  - Agent availability and expertise
  - Current workload
- Provide fallback to general agents if specialists unavailable

### 4. Security
- Validate file uploads (type, size, content)
- Sanitize message content to prevent XSS
- Implement rate limiting to prevent spam
- Log all actions for audit purposes

### 5. Performance
- Implement message pagination for large chat histories
- Use caching for frequently accessed data
- Optimize database queries with proper indexing
- Implement message compression for large conversations

## Testing Endpoints

### Health Check
**Endpoint:** `GET /chat-support/health`
**Response:** `{"status": "OK", "timestamp": "2024-01-15T10:30:00Z"}`

### Test Message
**Endpoint:** `POST /chat-support/test`
**Purpose:** Send test message (development only)
**Response:** Echo of sent message with timestamp

## Support Contact
For technical questions about this API, contact the development team or refer to the internal documentation.
