# Super Admin Channel Deletion

## Features Implemented
1.  **Backend API**: Added `DELETE /channels/{id}` endpoint.
    - Security: Strict role check (`SUPER_ADMIN` required).
    - Functionality: Removes channel data, messages, and membership lists from Redis.
2.  **Frontend**: Added "Delete Channel" UI.
    - Location: Channel Chat Header (next to "Add Members").
    - Visibility: Only rendered if users' roles include `SUPER_ADMIN`.
    - Logic: Prompts for confirmation before calling the API.

## How to Verify
1.  **Restart Backend**: Restart the Python service (`main.py`) to load the new endpoint.
2.  **Log in as Developer**: Verify the "Delete" button is **NOT** visible.
3.  **Log in as Super Admin**: Verify the "Delete" button (red icon) **IS** visible.
4.  **Test Deletion**: Click Delete -> Confirm. Channel should disappear from the sidebar.

## Technical Details
- **Role Detection**: Frontend reads `roles` from the decoded JWT token payload.
- **Service Logic**: `RedisChatService.delete_channel` handles cleanup of all related keys (`set`s and `hash`es).
