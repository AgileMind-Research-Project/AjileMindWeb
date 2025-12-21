# Team Label Feature - User Guide

## Quick Start

This guide explains how to run the application and test the new team label feature in the channel sidebar.

## Table of Contents

1. [Running the Application](#running-the-application)
2. [Accessing the Chat Interface](#accessing-the-chat-interface)
3. [Understanding Team Labels](#understanding-team-labels)
4. [Testing the Feature](#testing-the-feature)
5. [Setting Up Teams](#setting-up-teams)
6. [Troubleshooting](#troubleshooting)

---

## Running the Application

### Prerequisites

- Node.js (v16 or later)
- npm or yarn package manager
- Backend API running (for full functionality)

### Starting the Development Server

1. **Navigate to the project directory**:
   ```bash
   cd d:\Research\AjileMindWeb
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Open your browser and navigate to: `http://localhost:3008`
   - Or whichever port is displayed in the terminal

### Expected Output

You should see output similar to:
```
> agile-mind-frontend@0.1.0 dev
> next dev --port 3008

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3008
  - Ready in 2.5s
```

---

## Accessing the Chat Interface

### Navigation

1. **Login** to the application (if required)
2. **Navigate to Chat**: 
   - Click on the Chat menu item, or
   - Go directly to: `http://localhost:3008/chat`

### First Time Setup

If you're accessing the chat for the first time:
- The sidebar may show "No channels found"
- You'll need to create channels or have your admin assign you to teams/channels
- Team labels will appear once channels with team information are loaded

---

## Understanding Team Labels

### Visual Elements

**Team Header**:
- Features a blue-to-indigo gradient background
- Displays the team name in bold, uppercase text
- Shows a channel count badge on the right
- Includes decorative team icon

**Channel List**:
- Channels are listed under their team header
- Each channel shows:
  - Channel icon (based on type: DM, Group, or Channel)
  - Channel name
  - Optional description (below the name)
  - Unread message count (if any)
  - Privacy indicator (if private)

**Visual Hierarchy**:
```
┌─────────────────────────────┐
│ Channels             [+]    │ ← Header
├─────────────────────────────┤
│ [Search box]                │ ← Search
├─────────────────────────────┤
│ 🛠️ ENGINEERING       [3]    │ ← Team Header
│   # general                 │
│   # backend                 │ ← Channels
│   # frontend                │
├─────────────────────────────┤
│ 🚀 PRODUCT           [2]    │ ← Team Header
│   # roadmap                 │ ← Channels
│   # feedback                │
└─────────────────────────────┘
```

### Channel Organization

Channels are organized as follows:
1. **By Team**: Channels are grouped by their `team_name`
2. **Unassigned**: Channels without a team go under "Unassigned"
3. **Alphabetical**: Currently shown in the order received from the API
4. **Search**: Filtered channels maintain team grouping

---

## Testing the Feature

### Test Scenario 1: Viewing Team Groups

**Steps**:
1. Navigate to `/chat`
2. Observe the sidebar on the left
3. Verify that channels are grouped under team headers
4. Check that each team shows the correct channel count

**Expected Result**:
- Team headers are visible with gradient backgrounds
- Channels are organized under their respective teams
- Channel counts match the actual number of channels

### Test Scenario 2: Searching Across Teams

**Steps**:
1. In the chat sidebar, locate the search box
2. Type a channel name (e.g., "general")
3. Observe the filtered results

**Expected Result**:
- Only matching channels are shown
- Team headers remain visible for teams with matching channels
- Teams with no matching channels are hidden

### Test Scenario 3: Channel Selection

**Steps**:
1. Click on a channel in any team
2. Verify the channel becomes active (highlighted)
3. Check that the main chat area displays the channel messages

**Expected Result**:
- Selected channel has a blue background and left border
- Chat header shows the channel name
- Messages load for the selected channel

### Test Scenario 4: Unassigned Channels

**Steps**:
1. Create or view a channel without team information
2. Check the sidebar

**Expected Result**:
- Channel appears under "Unassigned" team group
- Functions the same as team-assigned channels

---

## Setting Up Teams

### For Administrators

#### Option 1: Via Database

If you have direct database access:

```sql
-- Create a team
INSERT INTO teams (id, name, created_at)
VALUES ('team_001', 'Engineering', CURRENT_TIMESTAMP);

-- Assign a channel to a team
UPDATE channels
SET team_id = 'team_001'
WHERE id = 'channel_123';
```

#### Option 2: Via API

If your backend provides team management endpoints:

```javascript
// Create a team
const createTeam = async (teamName) => {
    const response = await fetch('/api/v1/teams', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: teamName })
    });
    return response.json();
};

// Assign channel to team
const assignChannelToTeam = async (channelId, teamId) => {
    const response = await fetch(`/api/v1/channels/${channelId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ team_id: teamId })
    });
    return response.json();
};
```

### For Developers

To test with mock data during development:

1. **Modify the store initialization** in `chatStore.ts`:

```typescript
// Add sample channels with teams
const sampleChannels = [
    {
        id: '1',
        name: 'general',
        team_name: 'Engineering',
        team_id: 'eng_001',
        type: 'channel',
        is_private: false,
        // ... other fields
    },
    {
        id: '2',
        name: 'design-review',
        team_name: 'Design',
        team_id: 'design_001',
        type: 'channel',
        is_private: false,
        // ... other fields
    }
];
```

2. **Mock the API response** in your development environment

---

## Troubleshooting

### Issue: No Team Labels Visible

**Symptoms**:
- Channels are listed but no team headers appear
- All channels appear under one group or unsorted

**Solutions**:
1. **Check Data**: Verify channels have `team_name` field
   ```javascript
   console.log(useChatStore.getState().channels);
   ```

2. **Check API Response**: Ensure backend returns team information
   - Open browser DevTools → Network tab
   - Find the channels API call
   - Verify response includes `team_name` and `team_id` fields

3. **Clear Cache**: 
   - Clear browser cache
   - Restart the dev server

### Issue: Team Labels Not Updating

**Symptoms**:
- Changed team assignments don't reflect in UI
- Stale team information displayed

**Solutions**:
1. **Refresh the page**: Force reload with `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Check WebSocket connection**: Teams may update via WebSocket events
3. **Verify store updates**: Check browser console for errors

### Issue: Search Not Working with Teams

**Symptoms**:
- Search doesn't filter channels properly
- Team grouping breaks after search

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify the `groupedChannels` useMemo dependency array
3. Clear search input and try again

### Issue: Development Server Won't Start

**Symptoms**:
- Port already in use error
- Connection refused error

**Solutions**:
1. **Find and kill the existing process**:
   ```powershell
   # Windows
   netstat -ano | findstr :3008
   taskkill /PID <PID> /F
   ```

2. **Use a different port**:
   ```bash
   next dev --port 3009
   ```

### Issue: Styling Issues

**Symptoms**:
- Team headers don't show gradient
- Layout is broken
- Styles not applying

**Solutions**:
1. **Verify Tailwind is working**: Check if other Tailwind styles work
2. **Rebuild the project**:
   ```bash
   npm run build
   npm run dev
   ```
3. **Check for CSS conflicts**: Look for custom CSS overriding styles

---

## Additional Resources

- **Feature Documentation**: See `TEAM_LABEL_FEATURE.md` for technical details
- **Main Documentation**: See `README.md` for general project information
- **Communication Setup**: See `COMMUNICATION_SETUP.md` for WebSocket configuration

## Support

If you encounter issues not covered in this guide:
1. Check the browser console for error messages
2. Review the server logs for backend errors
3. Contact the development team with:
   - Steps to reproduce the issue
   - Screenshots or error messages
   - Browser and OS information
