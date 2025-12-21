# Team Label Feature - Redis Implementation Guide

Complete guide for the Redis-based team label feature that integrates with your existing project.

---

## 🎯 Overview

This implementation uses **Redis Cloud** to store team information instead of MySQL/SQL database. User data is retrieved from **JWT tokens**, making the system stateless and highly scalable.

### Key Features

✅ **Redis-based storage** - Fast, in-memory data store  
✅ **JWT token authentication** - Stateless user identification  
✅ **No database schema changes** - Works alongside existing MySQL  
✅ **Scalable architecture** - Perfect for multi-tenant systems  
✅ **Team organization** - Group channels by teams  

---

## 📋 Redis Data Structure

### Key Naming Convention

```
team:{team_id}                    → Hash (team details)
team:{team_id}:members            → Set (user IDs in team)
team:{team_id}:member:{user_id}   → Hash (member role & metadata)
team:{team_id}:channels           → Set (channel IDs in team)

user:{user_id}:teams              → Set (team IDs user belongs to)

tenant:{tenant_name}:teams        → Set (all team IDs in tenant)

channel:{channel_id}:team         → String (team_id for channel)
```

### Data Examples

```redis
# Team details
HGETALL team:abc-123
{
  "id": "abc-123",
  "name": "Engineering",
  "description": "Software development team",
  "color": "#2563EB",
  "icon": "🛠️",
  "created_by": "user-456",
  "created_at": "2025-12-21T00:00:00Z",
  "tenant_name": "acme-corp"
}

# Team members
SMEMBERS team:abc-123:members
["user-456", "user-789", "user-101"]

# Member role
HGETALL team:abc-123:member:user-456
{
  "user_id": "user-456",
  "team_id": "abc-123",
  "role": "owner",
  "joined_at": "2025-12-21T00:00:00Z"
}

# Channel-team association
GET channel:ch-001:team
"abc-123"

# Team's channels
SMEMBERS team:abc-123:channels
["ch-001", "ch-002", "ch-003"]
```

---

## 🚀 Setup Guide

### Step 1: Install Redis Client

```bash
cd d:\Research\AjileMindApi

# Install redis package
pip install redis==5.0.1

# Or install from requirements
pip install -r requirements_communication.txt
```

### Step 2: Initialize Redis Connection

The Redis client is automatically configured with your credentials:

**File**: `app/core/redis_client.py`

```python
redis_client = RedisClient()
# Connects to: redis-12930.crce182.ap-south-1-1.ec2.cloud.redislabs.com
```

### Step 3: Initialize on App Startup

**Add to** `app/main.py`:

```python
from app.core.redis_client import init_redis

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Initialize Redis
    init_redis()
    logger.info("✅ Redis initialized")
```

### Step 4: Register Team API Routes

**Add to** `app/main.py` or your router configuration:

```python
from app.api.v1 import teams

# Include team routes
app.include_router(
    teams.router,
    prefix="/api/v1/teams",
    tags=["Teams"]
)
```

### Step 5: Start the Backend

```bash
cd d:\Research\AjileMindApi
uvicorn app.main:app --reload --port 8000
```

---

## 📡 API Endpoints

### Team Management

#### Create Team
```http
POST /api/v1/teams/teams
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "name": "Engineering",
  "description": "Software development team",
  "color": "#2563EB",
  "icon": "🛠️"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "id": "abc-123",
    "name": "Engineering",
    "description": "Software development team",
    "color": "#2563EB",
    "icon": "🛠️",
    "created_by": "user-456",
    "created_at": "2025-12-21T00:00:00Z",
    "tenant_name": "acme-corp"
  }
}
```

#### Get User Teams
```http
GET /api/v1/teams/teams
Authorization: Bearer {JWT_TOKEN}
```

**Response**:
```json
{
  "success": true,
  "message": "Found 3 teams",
  "data": {
    "teams": [
      {
        "id": "abc-123",
        "name": "Engineering",
        "member_count": 10
      }
    ],
    "total": 3
  }
}
```

#### Assign Channel to Team
```http
POST /api/v1/teams/channels/assign-team
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "channel_id": "ch-001",
  "team_id": "abc-123"
}
```

### Enhanced Channel Endpoint

**Update** `app/api/v1/chat.py` to include team info:

```python
from app.utils.chat_team_integration import enrich_channels_with_teams

@router.get("/channels")
async def get_channels(...):
    channels = await chat_service.get_user_channels(...)
    
    # ADD THIS: Enrich channels with team info from Redis
    channels = await enrich_channels_with_teams(channels)
    
    return {
        "success": True,
        "data": {"channels": channels}
    }
```

---

## 🔧 Integration with Existing Code

### Getting User Info from JWT Token

The system automatically extracts user information from the JWT token:

```python
from app.utils.jwt import get_current_user_from_token

@router.get("/teams")
async def get_teams(
    current_user: Dict = Depends(get_current_user_from_token)
):
    # User info automatically extracted from JWT
    user_id = current_user.get("user_id")
    tenant_name = current_user.get("tenant_name")
    email = current_user.get("email")
```

### Using Team Service

```python
from app.services.team_service import get_team_service

team_service = get_team_service()

# Create team
team = team_service.create_team(
    tenant_name="acme-corp",
    user_id="user-456",  # From JWT token
    name="Engineering"
)

# Get user's teams
teams = team_service.get_user_teams("acme-corp", "user-456")

# Assign channel to team
team_service.assign_channel_to_team("ch-001", "team-123")
```

---

## 🎨 Frontend Integration (No Changes Needed!)

The frontend you already created works perfectly! It will automatically display team labels when channels include `team_name`.

**API Response Format**:
```json
{
  "channels": [
    {
      "id": "ch-001",
      "name": "general",
      "team_id": "abc-123",
      "team_name": "Engineering",  // Frontend uses this!
      "team_color": "#2563EB",
      "team_icon": "🛠️"
    }
  ]
}
```

---

## 🧪 Testing the Feature

### 1. Test Redis Connection

```python
# Run in Python console
from app.core.redis_client import get_redis_client

redis = get_redis_client()
redis.client.ping()  # Should return True
```

### 2. Create a Team

```bash
curl -X POST "http://localhost:8000/api/v1/teams/teams" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Engineering","icon":"🛠️","color":"#2563EB"}'
```

### 3. Assign Channel to Team

```bash
curl -X POST "http://localhost:8000/api/v1/teams/channels/assign-team" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"channel_id":"YOUR_CHANNEL_ID","team_id":"YOUR_TEAM_ID"}'
```

### 4. Verify in Frontend

1. Navigate to `http://localhost:3008/chat`
2. Channels should appear grouped by team
3. Team headers should show team icon and name

---

## 📊 Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                   CLIENT BROWSER                     │
│              (http://localhost:3008/chat)            │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ GET /api/v1/chat/channels
                     │ Authorization: Bearer {JWT}
                     │
┌────────────────────▼─────────────────────────────────┐
│              FASTAPI BACKEND SERVER                  │
│              (http://localhost:8000)                 │
├──────────────────────────────────────────────────────┤
│  1. decode_token(JWT) → user_id, tenant_name         │
│  2. get_user_channels(user_id) → channels (MySQL)    │
│  3. enrich_channels_with_teams() → add team info     │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ team_service.get_channel_team()
                     │
┌────────────────────▼─────────────────────────────────┐
│              REDIS CLOUD DATABASE                    │
│   redis-12930.crce182.ap-south-1-1.ec2.cloud...      │
├──────────────────────────────────────────────────────┤
│  Keys:                                               │
│   channel:ch-001:team → "team-123"                   │
│   team:team-123 → {name: "Engineering", ...}         │
└──────────────────────────────────────────────────────┘
                     │
                     │ Response with team info
                     │
┌────────────────────▼─────────────────────────────────┐
│               FRONTEND (React/Next.js)               │
├──────────────────────────────────────────────────────┤
│  ChannelSidebar groups channels by team_name         │
│                                                      │
│  🛠️ ENGINEERING [3]                                  │
│    # general                                         │
│    # backend                                         │
│    # frontend                                        │
└──────────────────────────────────────────────────────┘
```

---

## 🔐 Security Considerations

### JWT Token Usage

- User information is **never stored in Redis**
- User ID and tenant are **extracted from JWT** on every request
- Token validation happens at the API layer
- Expired tokens are automatically rejected

### Redis Security

- Connection uses **TLS encryption**
- Password-protected connection
- Username/password authentication
- Data isolated by tenant_name

### Best Practices

1. **Never expose Redis credentials** in client code
2. **Validate user permissions** before team operations
3. **Use tenant_name** to isolate data
4. **Implement rate limiting** for API endpoints

---

## 🚨 Troubleshooting

### Redis Connection Failed

**Error**: "Connection refused"

**Solution**:
```python
# Test connection
from app.core.redis_client import get_redis_client

redis = get_redis_client()
redis.client.ping()  # Should return True
```

If fails:
- Check internet connection
- Verify Redis Cloud credentials
- Check firewall settings

---

### Team Info Not Showing

**Error**: Channels don't have `team_name`

**Solution**: 
1. Verify team assignment:
   ```python
   from app.services.team_service import get_team_service
   
   team_service = get_team_service()
   team_id = team_service.get_channel_team("your-channel-id")
   print(team_id)  # Should return team ID or None
   ```

2. If None, assign channel:
   ```python
   team_service.assign_channel_to_team("channel-id", "team-id")
   ```

---

### JWT Token Issues

**Error**: "Could not validate credentials"

**Solution**:
- Check token expiration
- Verify token format: `Bearer YOUR_TOKEN`
- Ensure JWT secret matches backend configuration

---

## 📝 Complete File List

### New Backend Files Created

```
d:\Research\AjileMindApi\
├── app/
│   ├── core/
│   │   └── redis_client.py           ← Redis connection manager
│   ├── services/
│   │   └── team_service.py           ← Team business logic
│   ├── api/
│   │   └── v1/
│   │       └── teams.py               ← Team REST endpoints
│   └── utils/
│       └── chat_team_integration.py   ← Helper to enrich channels
└── requirements_communication.txt     ← Updated with redis==5.0.1
```

### Frontend Files (Already Created)

```
d:\Research\AjileMindWeb\
├── src/
│   ├── lib/
│   │   └── store/
│   │       └── chatStore.ts           ← Updated with team fields
│   └── components/
│       └── communication/
│           └── ChannelSidebar.tsx     ← Team grouping UI
```

---

## ✅ Setup Checklist

- [ ] Install redis package (`pip install redis==5.0.1`)
- [ ] Initialize Redis in `app/main.py`
- [ ] Register team routes in router
- [ ] Test Redis connection
- [ ] Create sample teams via API
- [ ] Assign channels to teams
- [ ] Verify frontend shows team labels
- [ ] Test with real JWT tokens
- [ ] Check user permissions work correctly

---

## 🎉 Conclusion

You now have a **complete Redis-based team label system** that:

✅ Uses Redis Cloud for fast, scalable storage  
✅ Extracts user info from JWT tokens (stateless)  
✅ Works with your existing MySQL database  
✅ Requires NO frontend changes  
✅ Provides full REST API for team management  

**Next Steps**:
1. Run `pip install redis==5.0.1`
2. Initialize Redis in main.py
3. Test the API endpoints
4. See beautiful team labels in your chat! 🎨

---

**Created**: 2025-12-21  
**Version**: 1.0 (Redis Implementation)  
**Backend**: FastAPI + Redis Cloud  
**Frontend**: Next.js + React (no changes needed)
