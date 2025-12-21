# Team Label Feature - Quick Start 

## ⚡ TL;DR (Too Long; Didn't Read)

Want to get the team label feature running quickly? Follow these steps:

### 1️⃣ Run Database Migration (2 minutes)

```bash
# Login to MySQL
mysql -u your_username -p

# Select your database
USE your_tenant_database;

# Run migration
source d:\Research\AjileMindApi\database_team_label_migration.sql;
```

### 2️⃣ Add Sample Data (1 minute)

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID
SET @user_id = 'YOUR_USER_ID';

-- Create teams
INSERT INTO teams (id, name, description, color, icon, created_by) VALUES
    (UUID(), 'Engineering', 'Software development', '#2563EB', '🛠️', @user_id),
    (UUID(), 'Product', 'Product management', '#8B5CF6', '🚀', @user_id),
    (UUID(), 'Design', 'UX/UI Design', '#EC4899', '🎨', @user_id);

-- Assign channels to teams (update existing channels)
UPDATE channels 
SET team_id = (SELECT id FROM teams WHERE name = 'Engineering')
WHERE name IN ('general', 'backend', 'frontend');
```

### 3️⃣ Start Servers (30 seconds)

```bash
# Terminal 1: Backend
cd d:\Research\AjileMindApi
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend  
cd d:\Research\AjileMindWeb
npm run dev
```

### 4️⃣ View Result (5 seconds)

Open browser: `http://localhost:3008/chat`

**You should see:**
```
┌─────────────────────────────┐
│ Channels             [+]    │
├─────────────────────────────┤
│ 🛠️ ENGINEERING       [3]    │ ← Team Header
│   # general                 │
│   # backend                 │
│   # frontend                │
├─────────────────────────────┤
│ 🚀 PRODUCT           [1]    │
│   # roadmap                 │
└─────────────────────────────┘
```

---

## 📚 What You Need

### Database Tables

The migration creates:

| Table | Purpose |
|-------|---------|
| **teams** | Stores team info (name, icon, color) |
| **team_members** | Tracks who belongs to which team |
| **channels** *(modified)* | Adds `team_id` and `team_name` columns |

### Files Created

All files are ready in your workspace:

| File | Location | Purpose |
|------|----------|---------|
| Migration SQL | `d:\Research\AjileMindApi\database_team_label_migration.sql` | Database setup |
| Setup Guide | `d:\Research\AjileMindWeb\SETUP_GUIDE.md` | Complete setup instructions |
| Schema Docs | `d:\Research\AjileMindWeb\DATABASE_SCHEMA.md` | Database structure details |
| Feature Docs | `d:\Research\AjileMindWeb\TEAM_LABEL_FEATURE.md` | Technical documentation |
| User Guide | `d:\Research\AjileMindWeb\TEAM_LABEL_GUIDE.md` | How to use the feature |

---

## 🔧 Common Tasks

### Create a New Team

```sql
INSERT INTO teams (id, name, description, color, icon, created_by)
VALUES (UUID(), 'Sales', 'Sales team', '#F59E0B', '💼', 'YOUR_USER_ID');
```

### Assign Channel to Team

```sql
-- Option 1: Update existing channel
UPDATE channels 
SET team_id = (SELECT id FROM teams WHERE name = 'Sales')
WHERE name = 'sales-general';

-- Option 2: Create new channel with team
INSERT INTO channels (id, name, type, created_by, team_id)
VALUES (
    UUID(), 
    'deals', 
    'channel', 
    'YOUR_USER_ID',
    (SELECT id FROM teams WHERE name = 'Sales')
);
```

### Remove Team from Channel

```sql
UPDATE channels 
SET team_id = NULL, team_name = NULL
WHERE name = 'random';
-- This channel will appear under "Unassigned"
```

### Get Team List

```sql
SELECT id, name, icon, description 
FROM teams 
ORDER BY name;
```

---

## 🐛 Quick Troubleshooting

### Problem: No team labels visible

**Check 1**: Do channels have team_name?
```sql
SELECT name, team_name FROM channels;
```

If all NULL → Assign teams to channels

**Check 2**: Is backend returning team fields?
- Open DevTools → Network
- Find `/api/v1/chat/channels` request
- Check if response has `team_name`

If missing → Backend might need update (rare)

---

### Problem: Database migration fails

**Error**: Table already exists

**Solution**: Tables already created! You can skip migration.

**Error**: Foreign key constraint fails

**Solution**: Run communication schema first:
```bash
mysql -u username -p db_name < database_communication_schema.sql
mysql -u username -p db_name < database_team_label_migration.sql
```

---

### Problem: Frontend not showing changes

**Solution 1**: Hard refresh
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Solution 2**: Clear browser cache
- Open DevTools → Application → Clear storage

**Solution 3**: Restart dev server
```bash
# Stop: Ctrl+C
# Start:
npm run dev
```

---

## 📖 Full Documentation

For detailed information, see:

1. **SETUP_GUIDE.md** - Complete setup with all details
2. **DATABASE_SCHEMA.md** - Database structure and queries  
3. **TEAM_LABEL_FEATURE.md** - Technical implementation
4. **TEAM_LABEL_GUIDE.md** - User guide and testing

---

## ✅ Success Checklist

Quick verification:

- [ ] Migration script ran without errors
- [ ] `teams` table exists: `SHOW TABLES LIKE 'teams';`
- [ ] `channels` has team columns: `DESCRIBE channels;`
- [ ] Sample teams created: `SELECT * FROM teams;`
- [ ] Channels assigned to teams: `SELECT name, team_name FROM channels;`
- [ ] Backend API running on port 8000
- [ ] Frontend running on port 3008
- [ ] Can access chat page at `http://localhost:3008/chat`
- [ ] Team headers visible in sidebar
- [ ] Channels grouped under teams
- [ ] Can click and select channels

---

## 💡 Pro Tips

### Tip 1: Customize Team Colors

```sql
UPDATE teams 
SET color = '#FF6B6B', icon = '🔥'
WHERE name = 'Engineering';
```

Team headers will use these colors!

### Tip 2: Bulk Assign Channels

```sql
-- Assign all 'eng-*' channels to Engineering team
UPDATE channels 
SET team_id = (SELECT id FROM teams WHERE name = 'Engineering')
WHERE name LIKE 'eng-%';
```

### Tip 3: View Team Summary

```sql
SELECT 
    t.name as team,
    t.icon,
    COUNT(c.id) as channels,
    COUNT(DISTINCT cm.user_id) as members
FROM teams t
LEFT JOIN channels c ON t.id = c.team_id
LEFT JOIN channel_members cm ON c.id = cm.channel_id
GROUP BY t.id, t.name, t.icon;
```

---

## 🎯 Next Steps

After basic setup:

1. ✅ **Create your teams** matching your organization
2. ✅ **Assign channels** to appropriate teams
3. ✅ **Test search** functionality
4. ✅ **Invite team members** to channels
5. 🔮 **Future**: Build team management UI

---

## 🆘 Need Help?

**Read full guides:**
- Setup issues → `SETUP_GUIDE.md`
- Database questions → `DATABASE_SCHEMA.md`
- Feature questions → `TEAM_LABEL_FEATURE.md`
- Usage help → `TEAM_LABEL_GUIDE.md`

**Check logs:**
- Frontend: Browser console (F12)
- Backend: Terminal output

---

**Status**: ✅ Feature ready to use  
**Estimated setup time**: ~5 minutes  
**Difficulty**: Easy  

🚀 **Happy coding!**
