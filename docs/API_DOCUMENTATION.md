# Esusu App API Documentation

## Overview

This document provides comprehensive documentation for the Esusu mobile application API endpoints, data structures, and integration patterns.

## Base Configuration

```typescript
// Environment Configuration
const API_BASE_URL = 'https://esusu-server.onrender.com/api/merchant';
const API_TIMEOUT = 15000; // 15 seconds
```

## Authentication

All API endpoints require authentication via JWT tokens stored securely on the device.

### Token Management

```typescript
// Store token securely
await Storage.setItem(SECURE_KEYS.AUTH_TOKEN, token, true);

// Retrieve token for API calls
const token = await Storage.getItem(SECURE_KEYS.AUTH_TOKEN, true);
```

## API Endpoints

### Authentication Endpoints

#### 1. Check Phone Number Availability
```typescript
POST /checkAvailable
```

**Request Body:**
```json
{
  "phoneNumber": "string",
  "email": "string"
}
```

**Response:**
```json
{
  "status": "Success",
  "data": {
    "available": boolean,
    "message": "string"
  }
}
```

#### 2. Complete Basic Signup
```typescript
POST /completeSignUp
```

**Request Body:**
```json
{
  "phoneNumber": "string",
  "email": "string",
  "passCode": number
}
```

**Response:**
```json
{
  "status": "Success",
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "phoneNumber": "string",
      "email": "string"
    }
  }
}
```

#### 3. User Login
```typescript
POST /login
```

**Request Body:**
```json
{
  "phoneNumber": "string",
  "passCode": number
}
```

**Response:**
```json
{
  "status": "Success",
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "balance": "string",
      "weeklyEarnings": "string"
    }
  }
}
```

### User Management

#### 4. Get User Details
```typescript
GET /userDetails
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "Success",
  "data": {
    "user": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "balance": "string",
      "weeklyEarnings": "string",
      "userImg": "string",
      "businessLocation": boolean,
      "documentsVerified": boolean,
      "governmentID": boolean
    }
  }
}
```

#### 5. Complete Registration
```typescript
POST /completeRegistration
```

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "middleName": "string",
  "email": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "gender": "string"
}
```

### Contributor Management

#### 6. Add Contributor
```typescript
POST /contributors
```

**Request Body:**
```json
{
  "firstname": "string",
  "lastname": "string",
  "email": "string",
  "phoneNumber": "string",
  "photoUri": "string",
  "agentId": "string",
  "savingsPlan": {
    "amount": number,
    "frequency": "daily|weekly|monthly"
  }
}
```

**Response:**
```json
{
  "status": "Success",
  "data": {
    "contributor": {
      "id": "string",
      "firstname": "string",
      "lastname": "string",
      "email": "string",
      "phoneNumber": "string",
      "photoUri": "string",
      "agentId": "string"
    }
  }
}
```

#### 7. Get Contributors
```typescript
GET /contributors?agentId={agentId}
```

**Response:**
```json
{
  "status": "Success",
  "data": [
    {
      "id": "string",
      "firstname": "string",
      "lastname": "string",
      "email": "string",
      "phoneNumber": "string",
      "photoUri": "string",
      "agentId": "string",
      "savingsPlan": {
        "amount": number,
        "frequency": "string",
        "status": "active|completed|paused"
      }
    }
  ]
}
```

### Transaction Management

#### 8. Get Transaction History
```typescript
GET /account/history
```

**Response:**
```json
{
  "status": "Success",
  "data": [
    {
      "id": "string",
      "amount": number,
      "type": "credit|debit",
      "description": "string",
      "status": "completed|pending|failed",
      "createdAt": "ISO string"
    }
  ]
}
```

#### 9. Credit Contributor Account
```typescript
POST /contributor-account/credit
```

**Request Body:**
```json
{
  "phoneNumber": "string",
  "amount": number
}
```

#### 10. Get Contributor Details for Deposit
```typescript
POST /contributor-account/details
```

**Request Body:**
```json
{
  "type": "deposit",
  "phoneNumber": "string"
}
```

### Account Management

#### 11. Get Merchant Dashboard Account
```typescript
GET /account/dashboard
```

**Response:**
```json
{
  "status": "Success",
  "data": {
    "totalContributors": number,
    "activeGroups": number,
    "totalBalance": number,
    "weeklyEarnings": number,
    "monthlyEarnings": number
  }
}
```

#### 12. Get Settlement Accounts
```typescript
GET /account/settlement-accounts
```

**Response:**
```json
{
  "status": "Success",
  "data": {
    "settlementAccounts": [
      {
        "id": "string",
        "accountNumber": "string",
        "accountName": "string",
        "bankName": "string",
        "bankCode": "string",
        "isPrimary": boolean
      }
    ]
  }
}
```

#### 13. Add Bank Account
```typescript
POST /account/settlement-accounts
```

**Request Body:**
```json
{
  "accountNumber": "string",
  "accountName": "string",
  "bankCode": "string",
  "bankName": "string",
  "isPrimary": boolean
}
```

### Verification

#### 14. Upload CAC Document
```typescript
POST /account/upload/cac-document
```

**Request Body:** (FormData)
```
identityType: string
businessAddress: string
regNumber: string
businessName: string
document: File
```

#### 15. Upload Business Location
```typescript
PUT /merchant/business-location
```

**Request Body:** (FormData)
```
locationImage: File
longitude: number
latitude: number
city: string
state: string
notes: string
```

## Error Handling

### Standard Error Response
```json
{
  "status": "Failed",
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
- `UNAUTHORIZED` (401): Invalid or expired token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (422): Invalid input data
- `SERVER_ERROR` (500): Internal server error

## Data Types

### User Interface
```typescript
interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  balance: string;
  weeklyEarnings: string;
  userImg?: string;
  businessLocation?: boolean;
  documentsVerified?: boolean;
  governmentID?: boolean;
}
```

### Transaction Interface
```typescript
interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}
```

### Contributor Interface
```typescript
interface Contributor {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  photoUri?: string;
  agentId: string;
  savingsPlan?: SavingsPlan;
}
```

## Security Considerations

1. **Token Storage**: All authentication tokens are stored securely using Expo SecureStore
2. **Input Validation**: All user inputs are validated on both client and server
3. **HTTPS Only**: All API communications use HTTPS
4. **Rate Limiting**: API endpoints implement rate limiting to prevent abuse

## Performance Optimization

1. **Caching**: Implemented intelligent caching for frequently accessed data
2. **Debouncing**: API calls are debounced to prevent excessive requests
3. **Image Optimization**: Images are optimized using Cloudinary transformations
4. **Lazy Loading**: Large datasets are loaded incrementally

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### API Testing
```bash
npm run test:api
```

## Rate Limits

- **Authentication endpoints**: 5 requests per minute
- **Data retrieval endpoints**: 60 requests per minute
- **Transaction endpoints**: 10 requests per minute
- **File upload endpoints**: 5 requests per minute

## Support

For API support and questions:
- Email: support@esusu.com
- Documentation: https://docs.esusu.com
- Status Page: https://status.esusu.com



