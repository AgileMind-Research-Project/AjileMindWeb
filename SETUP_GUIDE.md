# Team Label Feature - Complete Setup Guide

This guide explains how to run the team label feature, what database setup is needed, and which tables to create.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The team label feature adds team organization to your chat application. It requires:

1. **Database changes**: New `teams` table and updates to `channels` table
2. **Backend updates** (optional): Enhanced API to return team information
3. **Frontend**: Already implemented and ready to use

---

## Database Setup

### Step 1: Run the Migration Script

The migration script creates the necessary tables and updates existing ones.

**File**: `d:\Research\AjileMindApi\database_team_label_migration.sql`

#### Option A: Using MySQL Command Line

```bash
# Login to MySQL
mysql -u your_username -p

# Select your database
USE your_tenant_database;

# Run the migration
source d:\Research\AjileMindApi\database_team_label_migration.sql;
```

#### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your database
3. Open the migration file: `database_team_label_migration.sql`
4. Execute the script (click the lightning bolt icon)

#### Option C: Using phpMyAdmin

1. Login to phpMyAdmin
2. Select your tenant database
3. Go to SQL tab
4. Paste the contents of `database_team_label_migration.sql`
5. Click "Go"

### Step 2: Verify Migration

Run this query to verify the tables were created:

```sql
-- Check tables
SHOW TABLES LIKE 'teams';
SHOW TABLES LIKE 'team_members';

-- Check channels table was updated
DESCRIBE channels;
-- Should show team_id and team_name columns
```

### What the Migration Creates

#### 1. **`teams` table**
Stores team information:

| Column | Type | Description |
|--------|------|-------------|
| id | CHAR(36) | Primary key (UUID) |
| name | VARCHAR(100) | Team name |
| description | TEXT | Team description |
| color | VARCHAR(7) | Hex color for badges |
| icon | VARCHAR(50) | Emoji or icon |
| created_by | CHAR(36) | Creator user ID |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

#### 2. **`team_members` table**
Tracks team membership:

| Column | Type | Description |
|--------|------|-------------|
| id | CHAR(36) | Primary key (UUID) |
| team_id | CHAR(36) | Foreign key to teams |
| user_id | CHAR(36) | Foreign key to users |
| role | ENUM | owner/admin/member |
| joined_at | TIMESTAMP | Join timestamp |

#### 3. **`channels` table updates**
Adds two new columns:

| Column | Type | Description |
|--------|------|-------------|
| team_id | CHAR(36) | Foreign key to teams (nullable) |
| team_name | VARCHAR(100) | Denormalized team name (nullable) |

#### 4. **Triggers**
- `trg_channels_sync_team_name`: Automatically syncs team_name when team_id changes
- `trg_channels_insert_team_name`: Sets team_name on channel creation

#### 5. **View**
- `v_channels_with_teams`: Convenient view joining channels and teams

---

## Backend Setup

### Current Status

Your backend at `d:\Research\AjileMindApi\app\api\v1\chat.py` already returns channel data. The team fields will automatically be included once the database is updated.

### Optional: Enhance the API

If you want to ensure team information is always returned, update the `get_user_channels` method in your chat service.

**File**: `d:\Research\AjileMindApi\app\services\chat_service.py` (if exists)

Look for the SQL query that fetches channels and ensure it selects `team_id` and `team_name`:

```python
# Example query enhancement
query = """
    SELECT 
        c.id,
        c.name,
        c.description,
        c.type,
        c.is_private,
        c.created_by,
        c.created_at,
        c.updated_at,
        c.team_id,        -- ADD THIS
        c.team_name,      -- ADD THIS
        ...
    FROM channels c
    INNER JOIN channel_members cm ON c.id = cm.channel_id
    WHERE cm.user_id = %s
"""
```

### Test Backend API

```bash
# Test the channels endpoint
curl -X GET "http://localhost:8000/api/v1/chat/channels" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response should include team fields:
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": "ch_123",
        "name": "general",
        "team_id": "team_456",
        "team_name": "Engineering",
        ...
      }
    ]
  }
}
```

---

## Frontend Setup

### ✅ Already Complete!

The frontend is already set up with:
- Updated `Channel` interface in `chatStore.ts`
- Team grouping logic in `ChannelSidebar.tsx`
- Beautiful team headers with gradients

**No additional frontend setup needed!**

---

## Running the Application

### Prerequisites

1. ✅ Database migration completed
2. ✅ Backend API running
3. ✅ Node.js and npm installed

### Step 1: Start the Backend API

```bash
# Navigate to API directory
cd d:\Research\AjileMindApi

# Activate virtual environment (if using Python venv)
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### Step 2: Start the Frontend

```bash
# Navigate to frontend directory
cd d:\Research\AjileMindWeb

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

**Expected output:**
```
> agile-mind-frontend@0.1.0 dev
> next dev --port 3008

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3008
  - Ready in 2.5s
```

### Step 3: Access the Application

1. **Open browser**: `http://localhost:3008`
2. **Login** with your credentials
3. **Navigate to Chat**: `http://localhost:3008/chat`
4. **See team labels** in the sidebar!

---

## Testing

### Test 1: Create Sample Teams and Channels

```sql
-- Get your user ID (replace with actual user)
SET @user_id = 'YOUR_USER_ID_HERE';

-- Create teams
INSERT INTO teams (id, name, description, color, icon, created_by) VALUES
    (UUID(), 'Engineering', 'Software development team', '#2563EB', '🛠️', @user_id),
    (UUID(), 'Product', 'Product management', '#8B5CF6', '🚀', @user_id),
    (UUID(), 'Design', 'Design team', '#EC4899', '🎨', @user_id);

-- Create channels assigned to teams
INSERT INTO channels (id, name, description, type, is_private, created_by, team_id) VALUES
    (UUID(), 'general', 'General engineering chat', 'channel', FALSE, @user_id, 
     (SELECT id FROM teams WHERE name = 'Engineering')),
    (UUID(), 'backend', 'Backend development', 'channel', FALSE, @user_id,
     (SELECT id FROM teams WHERE name = 'Engineering')),
    (UUID(), 'frontend', 'Frontend development', 'channel', FALSE, @user_id,
     (SELECT id FROM teams WHERE name = 'Engineering'));

-- Add yourself to the channels
INSERT INTO channel_members (id, channel_id, user_id, role)
SELECT UUID(), id, @user_id, 'owner'
FROM channels
WHERE team_id = (SELECT id FROM teams WHERE name = 'Engineering');
```

### Test 2: Verify in Frontend

1. Refresh the chat page
2. You should see:
   ```
   🛠️ ENGINEERING [3]
     # general
     # backend
     # frontend
   ```

### Test 3: Test Search

1. Type "general" in search box
2. Should filter channels but keep team headers
3. Only matching channels should show

### Test 4: Test Channel Selection

1. Click on any channel
2. Should highlight with blue background
3. Messages should load in main area

---

## Database Schema Summary

### Tables to Create (via migration):

1. **teams** - Stores team information
2. **team_members** - Tracks team membership

### Tables to Modify:

1. **channels** - Add `team_id` and `team_name` columns

### Views Created:

1. **v_channels_with_teams** - Channels with team info joined

---

## Troubleshooting

### Issue: Migration Fails

**Error**: "Table 'users' doesn't exist"

**Solution**: Run the main communication schema first:
```bash
mysql -u username -p database_name < database_communication_schema.sql
mysql -u username -p database_name < database_team_label_migration.sql
```

---

### Issue: No Team Labels Visible

**Symptoms**: Channels show but no team grouping

**Solutions**:

1. **Check database**:
   ```sql
   SELECT id, name, team_name FROM channels;
   ```
   - If `team_name` is NULL for all, teams aren't assigned

2. **Assign channels to teams**:
   ```sql
   UPDATE channels 
   SET team_id = (SELECT id FROM teams WHERE name = 'Engineering'),
       team_name = 'Engineering'
   WHERE name = 'general';
   ```

3. **Check API response**:
   - Open browser DevTools → Network tab
   - Find `/api/v1/chat/channels` request
   - Verify response includes `team_name` field

---

### Issue: Backend Not Returning Team Fields

**Solution**: Update your SQL queries to include team fields:

```python
# In your chat service
query = """
    SELECT 
        c.*,           -- This will now include team_id and team_name
        COUNT(m.id) as unread_count
    FROM channels c
    LEFT JOIN channel_members cm ON c.id = cm.channel_id
    LEFT JOIN messages m ON m.channel_id = c.id 
        AND m.created_at > cm.last_read_at
    WHERE cm.user_id = %s
    GROUP BY c.id
"""
```

---

### Issue: Port Already in Use

**Error**: "Address already in use :::3008"

**Solution**:
```powershell
# Windows - Find and kill process
netstat -ano | findstr :3008
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3009
```

---

### Issue: Database Connection Error

**Error**: "Can't connect to MySQL server"

**Solution**:
1. Verify MySQL is running
2. Check connection credentials in backend `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=your_database
   ```

---

## Quick Reference Commands

### Database
```bash
# Run migration
mysql -u username -p database_name < database_team_label_migration.sql

# Verify
mysql -u username -p database_name -e "SHOW TABLES LIKE 'teams';"
```

### Backend
```bash
cd d:\Research\AjileMindApi
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd d:\Research\AjileMindWeb
npm run dev
```

### Access
- Frontend: http://localhost:3008
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Summary Checklist

- [ ] Database migration completed successfully
- [ ] `teams` table created
- [ ] `team_members` table created
- [ ] `channels` table has `team_id` and `team_name` columns
- [ ] Sample teams created
- [ ] Channels assigned to teams
- [ ] Backend API running
- [ ] Frontend running
- [ ] Can access chat page
- [ ] Team labels visible in sidebar
- [ ] Can click and select channels
- [ ] Search works across teams

---

## Next Steps

After basic setup:

1. **Create more teams**: Add teams for your organization
2. **Assign channels**: Link existing channels to teams
3. **Add team members**: Use `team_members` table
4. **Customize**: Change team colors and icons
5. **Enhance**: Add team management UI (admin panel)

---

## Support

For issues:
- Check this guide's troubleshooting section
- Review `TEAM_LABEL_FEATURE.md` for technical details
- Review `TEAM_LABEL_GUIDE.md` for user guide
- Check browser console for errors
- Check backend logs for API errors

**Documentation Files**:
- `SETUP_GUIDE.md` - This file (complete setup)
- `TEAM_LABEL_FEATURE.md` - Technical documentation
- `TEAM_LABEL_GUIDE.md` - User guide
- `IMPLEMENTATION_SUMMARY.md` - Quick reference

---

**Last Updated**: 2025-12-21  
**Version**: 1.0
