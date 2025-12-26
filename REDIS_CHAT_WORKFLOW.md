# Redis Chat System - Complete Workflow Guide

## 🎯 User Journey: From Login to Chat

This guide shows the complete workflow for creating channels and chatting using the Redis-based chat system.

---

## 📊 Visual Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     REDIS CHAT SYSTEM WORKFLOW                      │
└─────────────────────────────────────────────────────────────────────┘

┌────────────┐
│  Step 1    │  USER LOGS IN
└─────┬──────┘
      │
      │  POST /api/v1/auth/login
      │  Body: {email, password}
      │
      ▼
┌────────────────────────────────────────────────────────────┐
│  Backend validates credentials                             │
│  - Checks MySQL for user                                   │
│  - Generates JWT token with:                               │
│    * user_id (sub)                                         │
│    * tenant_name                                           │
│    * username/email                                        │
└────────────┬───────────────────────────────────────────────┘
             │
             │  Response: {access_token: "eyJhbGc..."}
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Frontend stores token in localStorage                     │
└────────────┬───────────────────────────────────────────────┘
             │
             │
┌────────────┴──────┐
│  Step 2           │  NAVIGATE TO CHAT PAGE
└────────────┬──────┘
             │
             │  Navigate to /redis-chat
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Chat Page Loads                                           │
│  - GET /api/v1/chat/channels                               │
│  - Headers: Authorization: Bearer {token}                  │
└────────────┬───────────────────────────────────────────────┘
             │
             │  Response: {channels: []}
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Display empty state: "No channels yet"                    │
└────────────┬───────────────────────────────────────────────┘
             │
             │
┌────────────┴──────┐
│  Step 3           │  CREATE CHANNEL
└────────────┬──────┘
             │
             │  User clicks "+" button
             │  Fills in: name="engineering", description="Team chat"
             │  Clicks "Create Channel"
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  POST /api/v1/chat/channels                                │
│  Headers: Authorization: Bearer {token}                    │
│  Body: {                                                   │
│    name: "engineering",                                    │
│    description: "Team chat",                               │
│    is_private: false                                       │
│  }                                                         │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Backend (FastAPI)                                         │
│  1. Extracts JWT:                                          │
│     - user_id: "user-123"                                  │
│     - tenant_name: "acme-corp"                             │
│     - username: "john@acme.com"                            │
│                                                            │
│  2. Calls redis_chat_service.create_channel()              │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Redis Operations:                                         │
│                                                            │
│  1. Generate channel_id: "ch-abc-123"                      │
│                                                            │
│  2. Store channel data:                                    │
│     HSET channel:ch-abc-123 {                              │
│       id: "ch-abc-123",                                    │
│       name: "engineering",                                 │
│       tenant_name: "acme-corp",                            │
│       created_by_user_id: "user-123",                      │
│       created_by_username: "john@acme.com",                │
│       created_at: "2025-12-21T10:00:00Z",                  │
│       member_count: 1                                      │
│     }                                                      │
│                                                            │
│  3. Add to tenant's channels:                              │
│     SADD tenant:acme-corp:channels "ch-abc-123"            │
│                                                            │
│  4. Add creator as member:                                 │
│     SADD channel:ch-abc-123:members "user-123"             │
│                                                            │
│  5. Store member details:                                  │
│     HSET channel:ch-abc-123:member:user-123 {              │
│       user_id: "user-123",                                 │
│       username: "john@acme.com",                           │
│       role: "admin",                                       │
│       joined_at: "2025-12-21T10:00:00Z"                    │
│     }                                                      │
│                                                            │
│  6. Add to user's channels:                                │
│     SADD user:acme-corp:user-123:channels "ch-abc-123"     │
└────────────┬───────────────────────────────────────────────┘
             │
             │  Response: {success: true, data: {...}}
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Frontend updates:                                         │
│  - Adds channel to sidebar                                 │
│  - Sets as active channel                                  │
│  - Loads messages (empty)                                  │
└────────────┬───────────────────────────────────────────────┘
             │
             │
┌────────────┴──────┐
│  Step 4           │  ADD TEAM MEMBERS
└────────────┬──────┘
             │
             │  User clicks "Add Members"
             │  Enters:
             │    - user_ids: "user-456, user-789"
             │    - usernames: "jane@acme.com, bob@acme.com"
             │  Clicks "Add Members"
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  POST /api/v1/chat/channels/ch-abc-123/members             │
│  Headers: Authorization: Bearer {token}                    │
│  Body: {                                                   │
│    user_ids: ["user-456", "user-789"],                     │
│    usernames: ["jane@acme.com", "bob@acme.com"]            │
│  }                                                         │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Backend validates:                                        │
│  - User is member of channel ✓                             │
│  - Same tenant ✓                                           │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Redis Operations (for each user):                         │
│                                                            │
│  For user-456:                                             │
│  - SADD channel:ch-abc-123:members "user-456"              │
│  - HSET channel:ch-abc-123:member:user-456 {...}           │
│  - SADD user:acme-corp:user-456:channels "ch-abc-123"      │
│                                                            │
│  For user-789:                                             │
│  - SADD channel:ch-abc-123:members "user-789"              │
│  - HSET channel:ch-abc-123:member:user-789 {...}           │
│  - SADD user:acme-corp:user-789:channels "ch-abc-123"      │
│                                                            │
│  Update member count:                                      │
│  - HSET channel:ch-abc-123 member_count 3                  │
└────────────┬───────────────────────────────────────────────┘
             │
             │  Response: {success: true, added_count: 2}
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Frontend shows: "2 member(s) added successfully"          │
│  Members sidebar updates to show 3 members                 │
└────────────┬───────────────────────────────────────────────┘
             │
             │
┌────────────┴──────┐
│  Step 5           │  SEND MESSAGES
└────────────┬──────┘
             │
             │  John types: "Welcome everyone!"
             │  Presses Enter / Clicks "Send"
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  POST /api/v1/chat/channels/ch-abc-123/messages            │
│  Headers: Authorization: Bearer {token}                    │
│  Body: {                                                   │
│    content: "Welcome everyone!",                           │
│    message_type: "text"                                    │
│  }                                                         │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Backend:                                                  │
│  1. Validates user is member ✓                             │
│  2. Generates message_id: "msg-001"                        │
│  3. Creates message object                                 │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Redis Operations:                                         │
│                                                            │
│  1. Create message JSON:                                   │
│     {                                                      │
│       id: "msg-001",                                       │
│       channel_id: "ch-abc-123",                            │
│       user_id: "user-123",                                 │
│       username: "john@acme.com",                           │
│       content: "Welcome everyone!",                        │
│       type: "text",                                        │
│       created_at: "2025-12-21T10:15:00Z",                  │
│       edited: false,                                       │
│       deleted: false                                       │
│     }                                                      │
│                                                            │
│  2. Store in message list:                                 │
│     RPUSH messages:ch-abc-123 "{JSON}"                     │
│                                                            │
│  3. Publish to channel (real-time):                        │
│     PUBLISH channel:ch-abc-123 {                           │
│       type: "new_message",                                 │
│       data: {...}                                          │
│     }                                                      │
└────────────┬───────────────────────────────────────────────┘
             │
             │  Response: {success: true, data: {...}}
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Frontend:                                                 │
│  - Displays message immediately (optimistic update)        │
│  - Clears input field                                      │
│  - Scrolls to bottom                                       │
└────────────┬───────────────────────────────────────────────┘
             │
             │
┌────────────┴──────┐
│  Step 6           │  OTHER USERS SEE MESSAGES
└────────────┬──────┘
             │
             │  Jane (user-456) opens chat
             │  GET /api/v1/chat/channels/ch-abc-123/messages
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Redis Operations:                                         │
│                                                            │
│  1. Get messages:                                          │
│     LRANGE messages:ch-abc-123 -50 -1                      │
│                                                            │
│  2. Parse JSON strings                                     │
│  3. Filter deleted messages                                │
│  4. Reverse order (newest first)                           │
└────────────┬───────────────────────────────────────────────┘
             │
             │  Response: {messages: [...]}
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Jane sees:                                                │
│  ┌──────────────────────────────────────────┐             │
│  │  👤 john@acme.com     10:15 AM            │             │
│  │  Welcome everyone!                        │             │
│  └──────────────────────────────────────────┘             │
└────────────┬───────────────────────────────────────────────┘
             │
             │  Jane types: "Thanks! Excited to be here!"
             │  Sends message
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Same message flow as Step 5                               │
│  Message stored in Redis                                   │
│  All members can see it                                    │
└────────────┬───────────────────────────────────────────────┘
             │
             │
┌────────────┴──────┐
│  Step 7           │  ONGOING CONVERSATION
└────────────┬──────┘
             │
             │  Bob (user-789) sends: "Let's discuss the roadmap!"
             │  John replies: "Great idea! I'll share the doc."
             │  Jane replies: "Perfect timing!"
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  Channel now has 4 messages                                │
│  All 3 members can see all messages                        │
│  Messages are tenant-isolated (acme-corp only)             │
└────────────────────────────────────────────────────────────┘

```

---

## 🔑 Key Isolation Points

### Tenant Isolation

```
Company A (tenant: acme-corp)
├── Channels: engineering, design, product
├── Users: john, jane, bob
└── Messages: Only visible to acme-corp users

Company B (tenant: globex-inc)  
├── Channels: sales, marketing
├── Users: alice, charlie
└── Messages: Only visible to globex-inc users

❌ Cross-company access: IMPOSSIBLE
✅ Data isolation: GUARANTEED
```

---

## 📋 Complete API Flow

### Create Channel Flow

```
Frontend                Backend (FastAPI)           Redis Cloud
   │                           │                          │
   │  POST /chat/channels      │                          │
   ├──────────────────────────▶│                          │
   │  {name, description}      │                          │
   │                           │                          │
   │                           │  Extract JWT claims      │
   │                           │  (user_id, tenant_name)  │
   │                           │                          │
   │                           │  HSET channel:{id}       │
   │                           ├─────────────────────────▶│
   │                           │                          │
   │                           │  SADD tenant:{tenant}:   │
   │                           │       channels           │
   │                           ├─────────────────────────▶│
   │                           │                          │
   │                           │  SADD channel:{id}:      │
   │                           │       members            │
   │                           ├─────────────────────────▶│
   │                           │                          │
   │                           │  Success                 │
   │                           │◀─────────────────────────┤
   │                           │                          │
   │  {success, data}          │                          │
   │◀──────────────────────────┤                          │
   │                           │                          │
   │  Update UI                │                          │
   │  Show channel             │                          │
   │                           │                          │
```

### Send Message Flow

```
Frontend                Backend (FastAPI)           Redis Cloud
   │                           │                          │
   │  POST /channels/{id}/     │                          │
   │       messages            │                          │
   ├──────────────────────────▶│                          │
   │  {content, type}          │                          │
   │                           │                          │
   │                           │  Validate membership     │
   │                           │                          │
   │                           │  Generate message_id     │
   │                           │                          │
   │                           │  RPUSH messages:{id}     │
   │                           ├─────────────────────────▶│
   │                           │                          │
   │                           │  PUBLISH channel:{id}    │
   │                           ├─────────────────────────▶│
   │                           │  (Real-time broadcast)   │
   │                           │                          │
   │                           │  Success                 │
   │                           │◀─────────────────────────┤
   │                           │                          │
   │  {success, data}          │                          │
   │◀──────────────────────────┤                          │
   │                           │                          │
   │  Display message          │                          │
   │  (optimistic update)      │                          │
   │                           │                          │
```

---

## ✅ Success Criteria

After following this workflow, you should have:

1. ✅ **Channel created** in Redis
2. ✅ **Members added** to the channel
3. ✅ **Messages sent** and visible to all members
4. ✅ **Tenant isolation** working (users only see their company's data)
5. ✅ **Real-time updates** ready (via Redis Pub/Sub)

---

## 🎯 Next Steps

1. **WebSocket Integration** - Add real-time message subscriptions
2. **File Upload** - Support image/file sharing in messages
3. **Notifications** - Notify users of new messages
4. **Search** - Search messages and channels
5. **Reactions** - Add emoji reactions to messages

---

**Status**: ✅ Complete Workflow Documented  
**Date**: 2025-12-21  
**System**: Redis Chat with Tenant Isolation
