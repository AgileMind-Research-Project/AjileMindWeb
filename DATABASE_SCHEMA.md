# Team Label Feature - Database Schema

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────┐
│        users            │
│─────────────────────────│
│ id (PK)                 │
│ email                   │
│ full_name               │
│ ...                     │
└──────────┬──────────────┘
           │
           │ created_by (FK)
           │
┌──────────▼──────────────┐
│        teams            │
│─────────────────────────│
│ id (PK)                 │◄─────────┐
│ name                    │          │
│ description             │          │
│ color                   │          │
│ icon                    │          │
│ created_by (FK) ────────┘          │
│ created_at              │          │
│ updated_at              │          │
└──────────┬──────────────┘          │
           │                         │
           │ team_id (FK)            │
           │                         │
┌──────────▼──────────────┐          │
│    team_members         │          │
│─────────────────────────│          │
│ id (PK)                 │          │
│ team_id (FK) ───────────┘          │
│ user_id (FK) ───────────┐          │
│ role                    │          │
│ joined_at               │          │
└─────────────────────────┘          │
                                     │
┌─────────────────────────┐          │
│       channels          │          │
│─────────────────────────│          │
│ id (PK)                 │          │
│ name                    │          │
│ description             │          │
│ type                    │          │
│ is_private              │          │
│ created_by (FK)         │          │
│ team_id (FK) ───────────┘
│ team_name (denormalized)│
│ created_at              │
│ updated_at              │
└──────────┬──────────────┘
           │
           │ channel_id (FK)
           │
┌──────────▼──────────────┐
│   channel_members       │
│─────────────────────────│
│ id (PK)                 │
│ channel_id (FK)         │
│ user_id (FK)            │
│ role                    │
│ joined_at               │
│ last_read_at            │
└─────────────────────────┘
```

## Table Details

### 1. teams (NEW)

**Purpose**: Stores team information and metadata

| Column      | Type        | Null | Default         | Description                    |
|-------------|-------------|------|-----------------|--------------------------------|
| id          | CHAR(36)    | NO   | UUID()          | Primary key                    |
| name        | VARCHAR(100)| NO   |                 | Team display name              |
| description | TEXT        | YES  | NULL            | Team description               |
| color       | VARCHAR(7)  | YES  | NULL            | Hex color code (e.g., #2563EB) |
| icon        | VARCHAR(50) | YES  | NULL            | Emoji or icon identifier       |
| created_by  | CHAR(36)    | NO   |                 | Creator user ID (FK → users)   |
| created_at  | TIMESTAMP   | NO   | CURRENT_TIMESTAMP| Created timestamp             |
| updated_at  | TIMESTAMP   | NO   | CURRENT_TIMESTAMP ON UPDATE| Updated timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX idx_name (name)
- INDEX idx_created_by (created_by)
- FOREIGN KEY (created_by) → users(id)

**Sample Data**:
```sql
INSERT INTO teams (id, name, description, color, icon, created_by) VALUES
('team-001', 'Engineering', 'Software development', '#2563EB', '🛠️', 'user-123'),
('team-002', 'Product', 'Product management', '#8B5CF6', '🚀', 'user-123'),
('team-003', 'Design', 'UX/UI Design', '#EC4899', '🎨', 'user-123'),
('team-004', 'Marketing', 'Marketing team', '#10B981', '📢', 'user-123');
```

---

### 2. team_members (NEW)

**Purpose**: Tracks which users belong to which teams

| Column     | Type      | Null | Default           | Description                  |
|------------|-----------|------|-------------------|------------------------------|
| id         | CHAR(36)  | NO   | UUID()            | Primary key                  |
| team_id    | CHAR(36)  | NO   |                   | Team ID (FK → teams)         |
| user_id    | CHAR(36)  | NO   |                   | User ID (FK → users)         |
| role       | ENUM      | NO   | 'member'          | owner/admin/member           |
| joined_at  | TIMESTAMP | NO   | CURRENT_TIMESTAMP | When user joined team        |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE KEY unique_team_member (team_id, user_id)
- INDEX idx_team_id (team_id)
- INDEX idx_user_id (user_id)
- FOREIGN KEY (team_id) → teams(id)
- FOREIGN KEY (user_id) → users(id)

**Sample Data**:
```sql
INSERT INTO team_members (id, team_id, user_id, role) VALUES
('tm-001', 'team-001', 'user-123', 'owner'),
('tm-002', 'team-001', 'user-456', 'member'),
('tm-003', 'team-002', 'user-123', 'admin');
```

---

### 3. channels (MODIFIED)

**Purpose**: Chat channels (DM, group, or team channels)

**NEW COLUMNS ADDED**:

| Column     | Type         | Null | Default | Description                        |
|------------|--------------|------|---------|------------------------------------|
| team_id    | CHAR(36)     | YES  | NULL    | Optional team association (FK)     |
| team_name  | VARCHAR(100) | YES  | NULL    | Denormalized team name (for perf)  |

**All Columns** (including existing):

| Column      | Type         | Null | Default           | Description                  |
|-------------|--------------|------|-------------------|------------------------------|
| id          | CHAR(36)     | NO   | UUID()            | Primary key                  |
| name        | VARCHAR(255) | NO   |                   | Channel name                 |
| description | TEXT         | YES  | NULL              | Channel description          |
| type        | ENUM         | NO   | 'channel'         | dm/group/channel             |
| is_private  | BOOLEAN      | NO   | FALSE             | Private channel flag         |
| created_by  | CHAR(36)     | NO   |                   | Creator user ID              |
| **team_id** | **CHAR(36)** | **YES** | **NULL**       | **Team ID (NEW)**            |
| **team_name**| **VARCHAR(100)**| **YES**| **NULL**    | **Team name (NEW)**          |
| created_at  | TIMESTAMP    | NO   | CURRENT_TIMESTAMP | Created timestamp            |
| updated_at  | TIMESTAMP    | NO   | CURRENT_TIMESTAMP ON UPDATE | Updated timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX idx_type (type)
- INDEX idx_created_by (created_by)
- **INDEX idx_team_id (team_id)** ← NEW
- FOREIGN KEY (created_by) → users(id)
- **FOREIGN KEY (team_id) → teams(id)** ← NEW

**Sample Data**:
```sql
-- Channels with team assignment
INSERT INTO channels (id, name, description, type, is_private, created_by, team_id) VALUES
('ch-001', 'general', 'General engineering chat', 'channel', FALSE, 'user-123', 'team-001'),
('ch-002', 'backend', 'Backend development', 'channel', FALSE, 'user-123', 'team-001'),
('ch-003', 'frontend', 'Frontend development', 'channel', FALSE, 'user-123', 'team-001'),
('ch-004', 'roadmap', 'Product roadmap', 'channel', FALSE, 'user-123', 'team-002');

-- Channel without team (goes to "Unassigned")
INSERT INTO channels (id, name, description, type, is_private, created_by, team_id) VALUES
('ch-005', 'random', 'Random chat', 'channel', FALSE, 'user-123', NULL);
```

---

## Triggers

### 1. trg_channels_sync_team_name

**Purpose**: Automatically updates `team_name` when `team_id` changes

```sql
CREATE TRIGGER trg_channels_sync_team_name
BEFORE UPDATE ON channels
FOR EACH ROW
BEGIN
    IF NEW.team_id IS NOT NULL AND 
       (OLD.team_id IS NULL OR OLD.team_id != NEW.team_id) THEN
        SET NEW.team_name = (SELECT name FROM teams WHERE id = NEW.team_id);
    ELSEIF NEW.team_id IS NULL THEN
        SET NEW.team_name = NULL;
    END IF;
END;
```

**Explanation**: When you update a channel's `team_id`, the `team_name` is automatically fetched and stored. This denormalization improves query performance.

---

### 2. trg_channels_insert_team_name

**Purpose**: Automatically sets `team_name` on channel creation

```sql
CREATE TRIGGER trg_channels_insert_team_name
BEFORE INSERT ON channels
FOR EACH ROW
BEGIN
    IF NEW.team_id IS NOT NULL THEN
        SET NEW.team_name = (SELECT name FROM teams WHERE id = NEW.team_id);
    END IF;
END;
```

**Explanation**: When creating a new channel with a `team_id`, the trigger automatically populates `team_name`.

---

## Views

### v_channels_with_teams

**Purpose**: Convenient view that joins channels with team information

```sql
CREATE OR REPLACE VIEW v_channels_with_teams AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.type,
    c.is_private,
    c.created_by,
    c.created_at,
    c.updated_at,
    c.team_id,
    t.name as team_name,
    t.color as team_color,
    t.icon as team_icon,
    (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count
FROM channels c
LEFT JOIN teams t ON c.team_id = t.id;
```

**Usage**:
```sql
-- Get all channels with their team info
SELECT * FROM v_channels_with_teams;

-- Get channels for a specific team
SELECT * FROM v_channels_with_teams WHERE team_id = 'team-001';
```

---

## Data Flow

### Creating a Channel with Team

```sql
-- Step 1: Insert into channels with team_id
INSERT INTO channels (id, name, type, created_by, team_id)
VALUES (UUID(), 'new-channel', 'channel', 'user-123', 'team-001');

-- Step 2: Trigger automatically sets team_name from teams table
-- (trg_channels_insert_team_name executes)

-- Step 3: Result:
-- id: <new-uuid>
-- name: 'new-channel'
-- team_id: 'team-001'
-- team_name: 'Engineering' (automatically populated)
```

### Updating a Channel's Team

```sql
-- Change channel from one team to another
UPDATE channels 
SET team_id = 'team-002'
WHERE id = 'ch-001';

-- Trigger automatically updates team_name to match new team
-- (trg_channels_sync_team_name executes)
```

---

## Migration Summary

### What Gets Created

✅ **New Tables**:
- `teams` (with 4 sample teams if you uncomment sample data)
- `team_members`

✅ **Modified Tables**:
- `channels` (adds `team_id` and `team_name` columns)

✅ **Triggers**:
- `trg_channels_sync_team_name`
- `trg_channels_insert_team_name`

✅ **Views**:
- `v_channels_with_teams`

### What Stays the Same

✅ **Unchanged**:
- All existing channel data preserved
- All existing channel functionality works
- Channels without teams work fine (shown as "Unassigned")
- No breaking changes to existing queries (team fields are nullable)

---

## Example Queries

### Get All Teams
```sql
SELECT * FROM teams ORDER BY name;
```

### Get Channels Grouped by Team
```sql
SELECT 
    COALESCE(team_name, 'Unassigned') as team,
    COUNT(*) as channel_count,
    GROUP_CONCAT(name) as channels
FROM channels
GROUP BY team_name
ORDER BY team_name;
```

### Get User's Channels with Team Info
```sql
SELECT 
    c.id,
    c.name,
    c.team_name,
    t.icon as team_icon,
    t.color as team_color
FROM channels c
LEFT JOIN teams t ON c.team_id = t.id
INNER JOIN channel_members cm ON c.id = cm.channel_id
WHERE cm.user_id = 'user-123'
ORDER BY c.team_name, c.name;
```

### Count Channels Per Team
```sql
SELECT 
    t.name as team_name,
    t.icon,
    COUNT(c.id) as channel_count
FROM teams t
LEFT JOIN channels c ON t.id = c.team_id
GROUP BY t.id, t.name, t.icon
ORDER BY channel_count DESC;
```

---

## Performance Considerations

### Why Denormalize team_name?

**Problem**: Joining `channels` with `teams` on every query can be slow with many channels.

**Solution**: Store `team_name` directly in the `channels` table.

**Trade-off**:
- ✅ Faster reads (no JOIN needed)
- ✅ Better for high-traffic API endpoints
- ⚠️ Slightly slower writes (trigger execution)
- ⚠️ Data duplication (team name stored twice)

**Mitigation**: Triggers ensure consistency automatically.

---

## Rollback

If you need to remove the team feature:

```sql
-- Remove triggers
DROP TRIGGER IF EXISTS trg_channels_insert_team_name;
DROP TRIGGER IF EXISTS trg_channels_sync_team_name;

-- Remove view
DROP VIEW IF EXISTS v_channels_with_teams;

-- Remove columns from channels
ALTER TABLE channels 
DROP FOREIGN KEY fk_channels_team_id,
DROP COLUMN team_id,
DROP COLUMN team_name;

-- Drop tables
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
```

---

**File**: `database_team_label_migration.sql`  
**Last Updated**: 2025-12-21  
**Version**: 1.0
