# Company-Based Team & Chat Architecture

## 🏢 Multi-Company Isolation Design

Complete architecture for company-based user isolation in teams, channels, messages, and meetings.

---

## 🎯 Core Concept

**Users can ONLY interact with users from the SAME company**

```
Company A Users  →  Can chat/meet with Company A Users only
Company B Users  →  Can chat/meet with Company B Users only
Company C Users  →  Can chat/meet with Company C Users only
```

---

## 🔑 JWT Token Structure

### Current JWT Payload
```json
{
  "sub": "user-123",              // user_id
  "email": "john@acme.com",
  "tenant_name": "acme-corp",     // Database tenant
  "role": "admin",
  "exp": 1735123456,
  "iat": 1735120000,
  "type": "access"
}
```

### **Enhanced JWT Payload (Add company_id)**
```json
{
  "sub": "user-123",              
  "email": "john@acme.com",
  "tenant_name": "acme-corp",
  "company_id": "company-abc-001",  // ← ADD THIS
  "role": "admin",
  "exp": 1735123456,
  "iat": 1735120000,
  "type": "access"
}
```

---

## 📊 Data Structure in Redis

### **Redis Key Structure with Company Isolation**

```
# Company-scoped keys
company:{company_id}:teams                      → Set (all teams in company)
company:{company_id}:users                      → Set (all users in company)
company:{company_id}:channels                   → Set (all channels in company)

# Team keys (already scoped to company via company_id)
team:{team_id}                                  → Hash (team_id, name, company_id)
team:{team_id}:members                          → Set (user IDs)
team:{team_id}:channels                         → Set (channel IDs)

# User keys
user:{user_id}:company                          → String (company_id)
user:{user_id}:teams                            → Set (team IDs in user's company)

# Channel keys
channel:{channel_id}:company                    → String (company_id)
channel:{channel_id}:team                       → String (team_id)
channel:{channel_id}:members                    → Set (user IDs from same company)

# Meeting keys (NEW)
meeting:{meeting_id}:company                    → String (company_id)
meeting:{meeting_id}:participants               → Set (user IDs from same company)
company:{company_id}:meetings                   → Set (all meetings in company)
```

---

## 🏗️ Complete Architecture Flow

### **1. User Login**

```
┌──────────────────────────────────────────────┐
│  User logs in with credentials               │
│  Email: john@acme.com                        │
│  Password: ********                          │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Backend validates & gets user from MySQL    │
│  Query: SELECT * FROM users                  │
│         WHERE email = 'john@acme.com'        │
│                                              │
│  Returns:                                    │
│  - user_id: "user-123"                       │
│  - company_id: "company-abc-001"             │
│  - tenant_name: "acme-corp"                  │
│  - role: "admin"                             │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Create JWT Token with company_id            │
│  {                                           │
│    "sub": "user-123",                        │
│    "company_id": "company-abc-001",  ← KEY   │
│    "tenant_name": "acme-corp",               │
│    "email": "john@acme.com"                  │
│  }                                           │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Return token to frontend                    │
│  Token stored in localStorage/cookie         │
└──────────────────────────────────────────────┘
```

### **2. Create Team (Company-Scoped)**

```
┌──────────────────────────────────────────────┐
│  User creates team                           │
│  POST /api/v1/teams/teams                    │
│  Headers: Authorization: Bearer {JWT}        │
│  Body: {name: "Engineering"}                 │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Backend extracts from JWT:                  │
│  - user_id: "user-123"                       │
│  - company_id: "company-abc-001"             │
│  - tenant_name: "acme-corp"                  │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Create team in Redis with company_id        │
│                                              │
│  HSET team:team-001 {                        │
│    "id": "team-001",                         │
│    "name": "Engineering",                    │
│    "company_id": "company-abc-001",  ← SCOPE │
│    "created_by": "user-123"                  │
│  }                                           │
│                                              │
│  SADD company:company-abc-001:teams team-001│
└──────────────────────────────────────────────┘
```

### **3. Create Channel (Company-Scoped)**

```
┌──────────────────────────────────────────────┐
│  User creates channel                        │
│  POST /api/v1/chat/channels                  │
│  Body: {                                     │
│    name: "general",                          │
│    team_id: "team-001"                       │
│  }                                           │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Backend validates:                          │
│  1. Extract company_id from JWT              │
│  2. Check if team belongs to user's company  │
│                                              │
│  team = HGET team:team-001 company_id        │
│  if team.company_id != jwt.company_id:       │
│     → REJECT (different company)             │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Create channel in MySQL (existing logic)    │
│  + Store company association in Redis        │
│                                              │
│  SET channel:ch-001:company company-abc-001  │
│  SET channel:ch-001:team team-001            │
│  SADD company:company-abc-001:channels ch-001│
└──────────────────────────────────────────────┘
```

### **4. Add User to Channel (Same Company Check)**

```
┌──────────────────────────────────────────────┐
│  Admin adds user to channel                  │
│  POST /api/v1/chat/channels/{id}/members     │
│  Body: {user_ids: ["user-456"]}              │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Backend validates SAME COMPANY:             │
│                                              │
│  channel_company = GET channel:ch-001:company│
│  → Returns: "company-abc-001"                │
│                                              │
│  user_company = GET user:user-456:company    │
│  → Returns: "company-abc-001"                │
│                                              │
│  if channel_company == user_company:         │
│     ✅ ALLOW (same company)                  │
│  else:                                       │
│     ❌ REJECT (different company)            │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Add to channel members                      │
│  MySQL: INSERT INTO channel_members          │
│  Redis: SADD channel:ch-001:members user-456 │
└──────────────────────────────────────────────┘
```

### **5. Send Message (Company-Scoped)**

```
┌──────────────────────────────────────────────┐
│  User sends message                          │
│  WebSocket: {                                │
│    type: "message",                          │
│    channel_id: "ch-001",                     │
│    content: "Hello team!"                    │
│  }                                           │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Backend validates:                          │
│  1. User's company from JWT                  │
│  2. Channel's company from Redis             │
│                                              │
│  user_company = jwt.company_id               │
│  channel_company = GET channel:ch-001:company│
│                                              │
│  if user_company != channel_company:         │
│     ❌ REJECT (different company)            │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Store message in MySQL                      │
│  Broadcast to channel members (same company) │
└──────────────────────────────────────────────┘
```

### **6. Create Meeting (Company-Scoped)**

```
┌──────────────────────────────────────────────┐
│  User creates meeting                        │
│  POST /api/v1/meetings                       │
│  Body: {                                     │
│    title: "Sprint Planning",                 │
│    channel_id: "ch-001"                      │
│  }                                           │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Backend extracts company_id from JWT        │
│  company_id = jwt.company_id                 │
│  → "company-abc-001"                         │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Create meeting with company scope           │
│                                              │
│  MySQL:                                      │
│  INSERT INTO meetings (id, title, ...)       │
│                                              │
│  Redis:                                      │
│  SET meeting:meet-001:company company-abc-001│
│  SADD company:company-abc-001:meetings meet-1│
└──────────────────────────────────────────────┘
```

---

## 🛡️ Security & Isolation

### **Company Isolation Rules**

| Action | Validation | Rejection |
|--------|------------|-----------|
| **Create Team** | User's company from JWT | N/A (creates in user's company) |
| **Add to Team** | Target user in same company | ❌ Different company user |
| **Create Channel** | Team belongs to user's company | ❌ Team from different company |
| **Add to Channel** | User in same company as channel | ❌ Different company user |
| **Send Message** | User in channel's company | ❌ User from different company |
| **Join Meeting** | Meeting in user's company | ❌ Meeting from different company |
| **View Teams** | Only teams from user's company | Automatically filtered |
| **View Channels** | Only channels from user's company | Automatically filtered |

---

## 📝 Implementation Example

### **Enhanced Team Service with Company Isolation**

```python
class TeamService:
    def create_team(
        self,
        company_id: str,  # From JWT token
        tenant_name: str,
        user_id: str,
        name: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Create team scoped to company"""
        
        team_id = str(uuid4())
        
        team_data = {
            'id': team_id,
            'name': name,
            'company_id': company_id,  # ← Store company
            'tenant_name': tenant_name,
            'created_by': user_id,
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Store team
        self.redis.set_hash(f"team:{team_id}", team_data)
        
        # Add to company's teams
        self.redis.add_to_set(
            f"company:{company_id}:teams", 
            team_id
        )
        
        return team_data
    
    def get_user_teams(
        self,
        company_id: str,  # From JWT token
        user_id: str
    ) -> List[Dict]:
        """Get only teams from user's company"""
        
        # Get all teams in user's company
        team_ids = self.redis.get_set_members(
            f"company:{company_id}:teams"
        )
        
        teams = []
        for team_id in team_ids:
            team = self.get_team(team_id)
            
            # Double-check company (security)
            if team and team.get('company_id') == company_id:
                # Check if user is member
                if self.is_team_member(team_id, user_id):
                    teams.append(team)
        
        return teams
    
    def add_team_member(
        self,
        team_id: str,
        target_user_id: str,
        requester_company_id: str  # From JWT
    ) -> bool:
        """Add member only if same company"""
        
        # Get team's company
        team = self.get_team(team_id)
        if not team:
            return False
        
        team_company = team.get('company_id')
        
        # Get target user's company
        user_company = self.redis.client.get(
            f"user:{target_user_id}:company"
        )
        
        # Validate same company
        if team_company != user_company:
            logger.warning(
                f"Cannot add user {target_user_id} from company "
                f"{user_company} to team {team_id} from company "
                f"{team_company}"
            )
            return False
        
        # Validate requester is from same company
        if requester_company_id != team_company:
            logger.warning(
                f"Requester from company {requester_company_id} "
                f"cannot add members to team from {team_company}"
            )
            return False
        
        # Add member (same company verified)
        return self._add_member_internal(team_id, target_user_id)
```

---

## 🎨 User Experience Flow

### **User Journey: Company A Employee**

```
1. Login
   ↓
   Token received with company_id: "company-A"
   
2. View Teams
   ↓
   API returns ONLY teams from Company A
   - Engineering Team (Company A)
   - Product Team (Company A)
   - Design Team (Company A)
   ✅ Cannot see Company B or C teams
   
3. View Channels
   ↓
   API returns ONLY channels from Company A
   - #general (Company A - Engineering)
   - #backend (Company A - Engineering)
   - #roadmap (Company A - Product)
   ✅ Cannot see Company B or C channels
   
4. Send Message
   ↓
   Can only message in Company A channels
   Messages visible only to Company A users
   ✅ Company B users cannot see these messages
   
5. Create Meeting
   ↓
   Meeting created for Company A
   Only Company A users can join
   ✅ Company B users cannot join
```

---

## 🔐 Security Checklist

- [x] **company_id in JWT** - Every request has company context
- [x] **Redis keys scoped by company** - Data isolation
- [x] **Validation on every action** - Company check before operations
- [x] **No cross-company access** - Users cannot see other companies
- [x] **Team scoped to company** - Teams belong to one company
- [x] **Channel scoped to company** - Channels belong to one company
- [x] **Meeting scoped to company** - Meetings belong to one company
- [x] **Message scoped to company** - Messages in company channels only

---

## 📦 Redis Data Example

### **Company A**

```redis
# Company A teams
SMEMBERS company:company-A:teams
→ ["team-001", "team-002"]

# Team 001 details
HGETALL team:team-001
→ {
    "id": "team-001",
    "name": "Engineering",
    "company_id": "company-A"
  }

# Company A channels
SMEMBERS company:company-A:channels  
→ ["ch-001", "ch-002", "ch-003"]

# Channel 001 company
GET channel:ch-001:company
→ "company-A"
```

### **Company B** (Isolated!)

```redis
# Company B teams (different set!)
SMEMBERS company:company-B:teams
→ ["team-101", "team-102"]

# Team 101 details
HGETALL team:team-101
→ {
    "id": "team-101",
    "name": "Sales",
    "company_id": "company-B"
  }

# Company B channels (different set!)
SMEMBERS company:company-B:channels
→ ["ch-101", "ch-102"]
```

**Result**: Company A users NEVER see Company B data! ✅

---

## ✅ Summary

### **Design Benefits**

1. **Complete Isolation** - Companies cannot see each other's data
2. **JWT-Based** - No database lookup for user/company info
3. **Scalable** - Redis handles high-speed lookups
4. **Secure** - Multiple validation checks
5. **Simple** - Clear company scoping in all operations

### **Next Steps**

1. ✅ Add `company_id` to JWT token creation
2. ✅ Update team service with company validation
3. ✅ Add company checks to channel operations
4. ✅ Scope meetings by company
5. ✅ Update frontend to handle company-scoped data

---

**Status**: Architecture designed and ready for implementation  
**Date**: 2025-12-21  
**Multi-Company**: ✅ Fully isolated  
**Redis-Based**: ✅ No MySQL for team/company lookups
