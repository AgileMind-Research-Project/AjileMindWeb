# Communication Module - Frontend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd d:\Research\AjileMindWeb

# Install required packages
npm install zustand date-fns

# Or with yarn
yarn add zustand date-fns
```

### 2. Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
```

### 3. Run Development Server

```bash
npm run dev
# Navigate to http://localhost:3000/chat
```

## File Structure

```
src/
├── app/
│   └── chat/
│       └── page.tsx                 # Main chat page
├── components/
│   └── communication/
│       ├── Avatar.tsx               # User avatar with presence
│       ├── MessageBubble.tsx        # Chat message display
│       ├── MessageList.tsx          # Message list container
│       ├── MessageInput.tsx         # Message input with file upload
│       └── ChannelSidebar.tsx       # Channel list sidebar
└── lib/
    ├── api/
    │   └── communicationAPI.ts      # API client utilities
    ├── hooks/
    │   └── useChat.ts               # Chat WebSocket hook
    ├── store/
    │   ├── chatStore.ts             # Chat state management
    │   ├── meetingStore.ts          # Meeting state management
    │   └── presenceStore.ts         # Presence state management
    └── websocket/
        └── WebSocketContext.tsx     # WebSocket provider
```

## Features Implemented

### ✅ Chat System
- Real-time messaging via WebSocket
- Channel sidebar with search
- Message list with auto-scroll
- Typing indicators
- File sharing
- Message edit/delete
- Unread count badges

### ✅ State Management
- Zustand stores for chat, meeting, presence
- Optimistic UI updates
- Automatic reconnection
- Connection state tracking

### ✅ WebSocket Integration
- JWT authentication
- Automatic reconnection with exponential backoff
- Event subscription system
- Rate limiting support

## Usage Examples

### Using the Chat Page

```typescript
// Navigate to /chat route
// The page handles:
// - Loading channels
// - Real-time messages
// - File uploads
// - Typing indicators
```

### Using Chat Hook in Custom Component

```typescript
import { useChat } from '@/lib/hooks/useChat';

function MyComponent({ channelId }: { channelId: string }) {
  const { sendMessage, isConnected } = useChat(channelId);

  const handleSend = () => {
    sendMessage('Hello!');
  };

  return <button onClick={handleSend}>Send</button>;
}
```

### Accessing Chat Store

```typescript
import { useChatStore } from '@/lib/store/chatStore';

function ChannelComponent() {
  const channels = useChatStore((state) => state.channels);
  const activeChannel = useChatStore((state) => state.getActiveChannel());

  return <div>{activeChannel?.name}</div>;
}
```

## Next Steps - To Implement

### Meeting Components (Phase 10)
- VideoTile component
- MeetingControls (mute, video, screen share)
- ParticipantsList
- WebRTC connection management

### Additional Features
- Message reactions
- Message threading
- Voice messages
- Push notifications
- Offline support

## Troubleshooting

**WebSocket not connecting:**
- Check API_URL in .env.local
- Verify backend is running
- Check JWT token in localStorage

**Messages not appearing:**
- Check browser console for errors
- Verify WebSocket connection status
- Check network tab for WebSocket frames

**File upload fails:**
- Check file size limits
- Verify CORS configuration
- Check backend file storage setup

## Production Deployment

### Build

```bash
npm run build
npm start
```

### Nginx Configuration

```nginx
# WebSocket proxy
location /api/v1 {
    proxy_pass http://backend:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### Environment

- Set `NEXT_PUBLIC_API_URL` to production API URL
- Ensure HTTPS for WSS (WebSocket Secure)
- Configure CORS on backend for frontend domain

## Testing

```bash
# Run in development
npm run dev

# Test chat:
# 1. Open http://localhost:3000/chat
# 2. Create or select a channel
# 3. Send messages
# 4. Open in another browser/tab to test real-time
# 5. Upload a file
# 6. Edit/delete own messages
```

---

**Status**: Frontend chat system complete and functional!  
**Backend**: Already implemented and running  
**Next**: Implement meeting components with WebRTC
