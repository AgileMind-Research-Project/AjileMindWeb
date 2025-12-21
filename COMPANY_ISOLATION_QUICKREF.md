# Company-Based Isolation - Quick Reference

## 🎯 Core Design

**One Simple Rule**: Users can ONLY chat/meet with users from their SAME company!

---

## 🔑 JWT Token (Add company_id)

### Before (Current):
```json
{
  "sub": "user-123",
  "email": "john@acme.com",
  "tenant_name": "acme-corp"
}
```

### After (Add this):
```json
{
  "sub": "user-123",
  "email": "john@acme.com",
  "tenant_name": "acme-corp",
  "company_id": "company-abc-001"  ← ADD THIS!
}
```

---

## 📊 How It Works

```
┌─────────────────────────────────────────────────────┐
│  COMPANY A                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Users:           Teams:          Channels:         │
│  • John           • Engineering   • #general        │
│  • Sarah          • Product       • #backend        │
│  • Mike           • Design        • #roadmap        │
│                                                     │
│  ✅ Can chat with each other                        │
│  ✅ Can join same teams                             │
│  ✅ Can see same channels                           │
│  ✅ Can have meetings together                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  COMPANY B                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Users:           Teams:          Channels:         │
│  • Alice          • Sales         • #deals          │
│  • Bob            • Marketing     • #campaigns      │
│  • Carol          • Support       • #tickets        │
│                                                     │
│  ✅ Can chat with each other                        │
│  ✅ Can join same teams                             │
│  ✅ Can see same channels                           │
│  ✅ Can have meetings together                      │
└─────────────────────────────────────────────────────┘

❌ Company A users CANNOT interact with Company B users
❌ Company B users CANNOT see Company A data
```

---

## 🛡️ Validation Flow

### Every Action Checks Company:

```python
# Example: Add user to channel

1. Extract from JWT token:
   user_company = jwt['company_id']  # "company-A"

2. Get channel's company from Redis:
   channel_company = redis.get(f"channel:{id}:company")  # "company-A"

3. Get target user's company from Redis:
   target_company = redis.get(f"user:{target_id}:company")  # "company-A"

4. Validate:
   if user_company == channel_company == target_company:
       ✅ ALLOW - Same company
   else:
       ❌ REJECT - Different company!
```

---

## 📁 Redis Structure

```
Company-scoped keys:

company:{company_id}:teams              → All teams in company
company:{company_id}:channels           → All channels in company  
company:{company_id}:meetings           → All meetings in company
company:{company_id}:users              → All users in company

team:{team_id}                          → Has company_id field
channel:{channel_id}:company            → Company ID
meeting:{meeting_id}:company            → Company ID
user:{user_id}:company                  → Company ID
```

---

## ✅ What Users CAN Do

Within **SAME Company**:

- ✅ Create teams
- ✅ Create channels
- ✅ Send messages
- ✅ Have meetings
- ✅ Add team members
- ✅ Join channels
- ✅ See company data

---

## ❌ What Users CANNOT Do

With **DIFFERENT Company**:

- ❌ See other company's teams
- ❌ See other company's channels
- ❌ Send messages to other company
- ❌ Join other company's meetings
- ❌ Add users from other company
- ❌ Access any other company data

---

## 🚀 Implementation Steps

### Step 1: Update JWT Creation

```python
# When user logs in
token_data = {
    "sub": user.id,
    "email": user.email,
    "tenant_name": user.tenant_name,
    "company_id": user.company_id  # ADD THIS from MySQL users table
}
token = create_access_token(token_data)
```

### Step 2: Use in Team Service

```python
# In team_service.py (already created!)
def create_team(company_id: str, user_id: str, name: str):
    team_data = {
        'id': team_id,
        'name': name,
        'company_id': company_id  # Scope to company
    }
    redis.set_hash(f"team:{team_id}", team_data)
    redis.add_to_set(f"company:{company_id}:teams", team_id)
```

### Step 3: Validate on Every Action

```python
# Before adding user to channel
channel_company = redis.get(f"channel:{channel_id}:company")
user_company = jwt['company_id']

if channel_company != user_company:
    raise HTTPException(403, "Different company!")
```

---

## 📊 Database Schema

### MySQL (Your existing users table)

```sql
SELECT 
    id,
    email,
    tenant_name,
    company_id      ← This field must exist in users table
FROM users
WHERE email = 'john@acme.com';
```

**Result**:
```
id: user-123
email: john@acme.com
tenant_name: acme-corp
company_id: company-abc-001
```

This `company_id` goes into JWT token!

---

## 🎯 Complete Flow Example

### User Creates Team:

```
1. User logs in
   └→ JWT created with company_id: "company-A"

2. User creates team "Engineering"
   └→ Backend reads company_id from JWT: "company-A"
   └→ Team created with company_id: "company-A"
   └→ Stored in Redis: company:company-A:teams

3. User A (company-A) tries to add User B (company-B) to team
   └→ Backend validates:
       - Team company: "company-A"
       - User B company: "company-B"
       - Different! ❌ REJECTED

4. User A (company-A) adds User C (company-A) to team
   └→ Backend validates:
       - Team company: "company-A"
       - User C company: "company-A"
       - Same! ✅ ALLOWED
```

---

## 💡 Key Points

1. **company_id is in JWT** - Every request has company context
2. **All data is scoped** - Teams, channels, meetings have company_id
3. **Validation everywhere** - Every action checks company match
4. **Redis isolation** - Separate key sets per company
5. **No cross-company access** - Impossible to see other company data

---

## 📝 Checklist

- [ ] Add `company_id` column to MySQL `users` table (if not exists)
- [ ] Update login to include `company_id` in JWT token
- [ ] Use my `team_service.py` (already has company support!)
- [ ] Add company validation to channel operations
- [ ] Add company validation to meeting operations
- [ ] Test: Users can only see their company data

---

**Status**: Architecture ready ✅  
**Security**: Company-isolated ✅  
**Implementation**: Use provided code ✅
