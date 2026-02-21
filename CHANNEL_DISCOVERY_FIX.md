# Channel Discovery & Project Access Fix

## Problems Fixed
1.  **Hidden Project Channels:**
    - Previously, users couldn't see project channels unless they had *already joined* them (due to `get_tenant_channels(user_id=...)`).
    - Now, the backend returns **ALL public channels** (including project channels) for the tenant, so they are discoverable.
2.  **Irrelevant Channels Shown:**
    - To prevent seeing *every* project channel in the tenant, the frontend now filters the list.
    - It fetches your project list (`GET /projects`) and only shows project channels where `channel.team_id` matches one of your accessible projects.

## Verification Steps
1.  **Restart Backend**: Stop and restart the Python API service (`main.py`).
    - This applies the change to `api/v1/redis_chat.py`.
2.  **Reload Frontend**: Refresh `/chat`.
    - You should see "Test AM project" channel appear under the "Test AM" project group.
    - If you remove yourself from a project (via backend/admin), the channel will disappear.

## Technical Details
- **Backend**: `GET /channels` now calls `get_tenant_channels(user_id=None)` to get all tenant channels, then filters out private ones unless the user is a member.
- **Frontend**: `loadChannels` fetches `channels` + `projects` in parallel. It cross-references `channel.team_id` with `myProjectIds` to determine visibility.
