# How to Add Users to a Channel

This guide explains how to add users/members to a chat channel in the Redis Chat system.

## 🎯 Feature Overview

The **Add Members** feature allows channel members to invite other users from their company into a channel. This feature:
- ✅ Shows all available users from your tenant/company
- ✅ Allows multi-select of users
- ✅ Displays user details (name, email, role)
- ✅ Provides real-time feedback on selections
- ✅ Works with the Redis backend API

## 📍 Location

The "Add Members" button appears in the **chat header** when you have a channel selected:

```
┌─────────────────────────────────────────┐
│  Channel Name                           │
│  Optional description                   │
│                                         │
│  [Add Members] [●Connected] [5 members] │
└─────────────────────────────────────────┘
```

## 🚀 How to Use

### Step 1: Select a Channel
1. Navigate to `http://localhost:3008/chat`
2. Click on any channel from the sidebar (e.g., "devg", "engineering")

### Step 2: Open Add Members Modal
1. Look for the **"Add Members"** button in the chat header
2. It appears as a blue button with a user-plus icon
3. Click the button to open the modal

### Step 3: Select Users
1. The modal will load and display all available users in your company
2. Each user shows:
   - **Name**: First and last name
   - **Email**: User's email address
   - **Role**: Their role (if assigned)
3. Click the checkbox next to each user you want to add
4. The bottom of the modal shows: "X users selected"
5. The Add button text updates to show: "Add X Members"

### Step 4: Add Selected Users
1. Click the **"Add [Number] Members"** button
2. Wait for the success message (shows number of members added)
3. The modal will close automatically
4. The channel's member count in the header will update

## 🔧 Backend API

### Endpoint
```
POST /api/v1/chat/channels/{channel_id}/members
```

### Request Body
```json
{
  "user_ids": ["user-123", "user-456"],
  "usernames": ["john.doe@company.com", "jane.smith@company.com"]
}
```

### Response
```json
{
  "success": true,
  "message": "2 member(s) added successfully",
  "data": {
    "added_count": 2
  }
}
```

## 🧪 Testing (Alternative Method)

If the frontend is experiencing issues, you can test the API directly using curl:

### 1. Get Your JWT Token
```javascript
// In browser console (F12)
localStorage.getItem('access_token')
// or
JSON.parse(localStorage.getItem('auth-storage')).state.accessToken
```

### 2. Get Available Users
```bash
curl -X GET "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Get Your Channels
```bash
curl -X GET "http://localhost:8000/api/v1/chat/channels" \  
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Add Members to a Channel
```bash
curl -X POST "http://localhost:8000/api/v1/chat/channels/CHANNEL_ID/members" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["user-123", "user-456"],
    "usernames": ["user1@example.com", "user2@example.com"]
  }'
```

## 📋 Requirements

### For Users to Be Added:
- ✅ They must exist in the Users system
- ✅ They must belong to the same tenant/company
- ✅ The requester must be a member of the channel

### Permissions:
- **Any channel member** can add other members
- **Only the creator** can remove members (or members can leave themselves)

## 💡 UI Features

### Loading States
- **Loading Users**: Shows a spinner while fetching available users
- **Adding Members**: Button shows "Adding..." during API call

### Validation
- Button is disabled when no users are selected
- Cancel button allows closing without changes
- Success/error messages provide feedback

### User Display
```
┌─────────────────────────────────────────┐
│  [✓] John Doe                           │
│      john.doe@company.com               │
│      Admin                              │
├─────────────────────────────────────────┤
│  [ ] Jane Smith                         │
│      jane.smith@company.com             │
│      Developer                          │
└─────────────────────────────────────────┘

2 users selected

[Cancel]  [Add 2 Members]
```

## 🐛 Troubleshooting

### Issue: "Add Members" button not visible
**Solution:**
- Ensure a channel is selected (click on a channel in the sidebar)
- Check that you're logged in (have valid JWT token)
- Verify the channel header is visible

### Issue: No users appear in the modal
**Solution:**
- Check that users exist in your tenant
- Verify API endpoint `/api/v1/users` is working
- Check browser console for errors
- Verify JWT token is valid

### Issue: "Failed to add members"
**Solution:**
- Verify you're a member of the channel
- Check that user IDs are valid
- Ensure tenant matching is correct
- Check backend logs for detailed errors

## 📝 Code Implementation

### Frontend Component Location
```
d:\Research\AjileMindWeb\src\app\chat\page.tsx
```

### Key Functions
- `handleOpenAddMembers()` - Opens the modal and loads users
- `loadAvailableUsers()` - Fetches users from API
- `handleToggleUser(userId)` - Toggles user selection
- `handleAddMembers()` - Sends request to add selected users

### API Methods
```typescript
redisChatAPI.getUsers()
redisChatAPI.addMembers(channelId, userIds, usernames)
```

## ✅ Success Indicators

When everything works correctly:
1. ✅ Modal opens with list of users
2. ✅ Users can be selected/deselected
3. ✅ Selection count updates in real-time
4. ✅ "Add Members" button shows correct count
5. ✅ Success message appears after adding
6. ✅ Member count in header increases
7. ✅ Modal closes automatically

## 🔒 Security Notes

- All requests require JWT authentication
- Users can only see/add users from their own tenant
- Backend validates tenant isolation on every request
- Only channel members can add other members

---

**Last Updated**: 2025-12-21  
**Feature Status**: Implemented ✅  
**Backend API**: Ready ✅  
**Frontend UI**: Ready ✅
