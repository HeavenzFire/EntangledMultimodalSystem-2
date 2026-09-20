# Neural Mesh Registry - API Documentation

## Base URL
```
http://localhost:7001/api
```

## Authentication

Most endpoints require authentication via JWT Bearer token. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### Health Check

**GET /health**

Check server health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890,
  "uptime": 3600.5
}
```

---

### Authentication

#### Register User
**POST /auth/register**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "role": "user"
}
```

#### Login
**POST /auth/login**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (if MFA not enabled):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "...", "role": "user" },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

**Response (if MFA enabled):**
```json
{
  "success": true,
  "message": "MFA verification required",
  "data": {
    "user": { "id": "...", "email": "...", "role": "user" },
    "requiresMFA": true
  }
}
```

#### Verify MFA
**POST /auth/verify-mfa**

```json
{
  "email": "user@example.com",
  "token": "123456"
}
```

#### Setup MFA
**POST /auth/setup-mfa**

```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "otpauthUrl": "otpauth://totp/...",
    "qrCode": "data:image/png;base64,..."
  }
}
```

#### Enable MFA
**POST /auth/enable-mfa**

```json
{
  "email": "user@example.com",
  "token": "123456"
}
```

#### Refresh Token
**POST /auth/refresh**

```json
{
  "refreshToken": "eyJhbG..."
}
```

#### Logout
**POST /auth/logout**

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

---

### Neurons

#### Register Neuron
**POST /neurons/register**

Register a new neuron with the mesh.

**Body:**
```json
{
  "id": "my-service-1",
  "version": "1.0.0",
  "domain": "generation",
  "entrypoint": "http://localhost:8080/api",
  "capabilities": ["generate", "transform"],
  "dependencies": ["orchestrator-core"],
  "metadata": {
    "author": "Team Name",
    "mesh_branch": "mesh-sync"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Neuron registered successfully",
  "data": {
    "id": "my-service-1",
    "status": "pending",
    "registeredAt": 1234567890
  }
}
```

#### Update Health (Handshake)
**PATCH /neurons/handshake**

Send heartbeat to update health status.

**Body:**
```json
{
  "neuron_id": "my-service-1",
  "status": "online",
  "health": {
    "latency_ms": 42,
    "error_rate": 0.01
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Health updated",
  "data": {
    "neuronId": "my-service-1",
    "status": "online",
    "timestamp": 1234567890
  }
}
```

#### List Neurons
**GET /neurons**

Query parameters:
- `domain` - Filter by domain
- `capability` - Filter by capability
- `status` - Filter by status (online, offline, degraded)
- `healthyOnly` - Only return healthy neurons (true/false)

**Example:**
```
GET /neurons?domain=orchestration&capability=route&healthyOnly=true
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "orchestrator-1",
      "version": "1.0.0",
      "domain": "orchestration",
      "capabilities": ["route", "compose"],
      "status": "online",
      "health": {
        "latencyMs": 35,
        "errorRate": 0.001,
        "lastHeartbeat": 1234567890
      }
    }
  ]
}
```

#### Get Neuron Details
**GET /neurons/:id**

#### Deregister Neuron
**DELETE /neurons/:id**

#### Get Statistics
**GET /neurons/stats**

**Response:**
```json
{
  "success": true,
  "data": {
    "totalNeurons": 256,
    "totalEdges": 512,
    "onlineNeurons": 248,
    "capabilities": ["route", "generate", "analyze"],
    "domains": ["orchestration", "generation", "storage"]
  }
}
```

---

### Pathways

#### Find Pathways
**GET /pathways**

Query parameters:
- `from` - Source neuron ID (required)
- `to` - Target neuron ID (required)
- `maxHops` - Maximum number of hops (default: 10)
- `capabilities` - Required capabilities (comma-separated)

**Example:**
```
GET /pathways?from=client-app&to=data-processor&maxHops=5&capabilities=route,transform
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "pathway_a1b2c3d4",
      "steps": [
        {
          "neuronId": "router-1",
          "domain": "orchestration",
          "capabilities": ["route"],
          "entrypoint": "http://localhost:7001/api"
        },
        {
          "neuronId": "transformer-1",
          "domain": "generation",
          "capabilities": ["transform"],
          "entrypoint": "http://localhost:8080/api"
        }
      ],
      "length": 3,
      "healthScore": 95.5,
      "estimatedLatencyMs": 150
    }
  ]
}
```

#### Execute Pathway
**POST /pathways/execute**

**Body:**
```json
{
  "pathwayId": "custom-pathway-1",
  "steps": [
    { "neuron": "router-1", "capability": "route" },
    { "neuron": "processor-1", "capability": "transform" },
    { "neuron": "storage-1", "capability": "persist" }
  ],
  "payload": {
    "data": "input data",
    "context": { "user": "john" }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pathwayId": "custom-pathway-1",
    "status": "completed",
    "startedAt": 1234567890,
    "completedAt": 1234567895,
    "steps": [
      {
        "neuronId": "router-1",
        "capability": "route",
        "status": "success",
        "latencyMs": 45
      }
    ],
    "totalLatencyMs": 150,
    "result": { ... }
  }
}
```

#### Get Pathway Status
**GET /pathways/:id/status**

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (dev only)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials/token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 5 attempts per 15 minutes

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Time when limit resets (Unix timestamp)

---

## Webhooks (Future)

The registry will support webhooks for:
- Neuron registration/deregistration events
- Health status changes
- Alert notifications

---

## OpenAPI/Swagger

Full API documentation available at:
```
GET /api-docs
```

(Requires swagger-autogen setup)
