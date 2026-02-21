# User-Bound Project Channel Filtering

## Changes
1.  **Frontend (`chat/page.tsx`)**:
    - **Replaced filtering logic**: Now reads the user's accessible project IDs directly from `localStorage.getItem('auth-storage')`.
    - **Strict Filtering**:
        - Only displays channels where `team_id` matches one of the project IDs found in local storage (e.g. `[10270, 10237, 10204]`).
        - Always displays non-project channels (General, DMs).
    - **Performance**: Removed the extra `getProjects` API call from the critical path.

## How to Test
1.  **Ensure Backend Running**: Make sure the Python API is running with the previous fix (returning all channels).
2.  **Check Local Storage**: Verify `auth-storage` -> `state.user.projects` contains the project IDs you expect to see.
3.  **Reload Page**: Refresh `/chat`. You should see channels for projects `10237`, `10270`, etc., but not for projects you lack access to.
