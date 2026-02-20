# Developer Role Fixes & Updates

## 1. Sidebar Labels Restored
Restored the sidebar labels to the standard **"Projects"** and **"Chat"**.
- Separate "My Projects" and "Project Chat" items were removed.
- **DEVELOPER** role added to the `roles` list of the main "Projects" and "Chat" items.
- Developers now access the same menu items as other roles.

## 2. Channel Visibility Fixed
Removed the strict `project_lead` / `project_manager` filtering from the frontend.
- **Problem:** Developers who created channels or were added as members but weren't "Project Managers" were having their channels hidden by the frontend filter.
- **Fix:** The app now trusts the backend API (`GET /channels`), which returns all channels the user is a member of.
- **Result:** If you are a member of a project channel (e.g. "Test AM project"), it will now appear in your sidebar, grouped under the project name.

## 3. Project Data Persistence
Updated the backend to strictly enable `project_id` and `team_name` persistence.
- **Backend File:** `app/api/v1/redis_chat.py` and `redis_chat_service.py`
- **Change:** `create_channel` now accepts and stores `project_id`.
- **Action:** Please restart the Python backend for this to take full effect for new channels.

### Verification
Reload the page at `/chat`. You should now see "Test AM project" in the sidebar.
