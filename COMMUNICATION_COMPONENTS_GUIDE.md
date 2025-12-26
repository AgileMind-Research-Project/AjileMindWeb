# Communication Components Explanation 📡

This directory contains **5 reusable React components** that work together to create a complete real-time chat system. Here's a detailed explanation of each component's purpose and how they work.

---

## 📁 Component Files Overview

```
src/components/communication/
├── Avatar.tsx           - User avatar with online status
├── ChannelSidebar.tsx   - Channel list and navigation
├── MessageBubble.tsx    - Individual message display
├── MessageInput.tsx     - Message composition and sending
└── MessageList.tsx      - Message feed with scrolling
```

---

## 1️⃣ **Avatar.tsx** - User Profile Display

### **Purpose**
Displays a user's avatar with their initials and an online status indicator.

### **Key Features**
- ✅ Generates colorful circular avatars with user initials
- ✅ Shows online status (online, away, busy, offline) with colored dots
- ✅ Supports 5 different sizes: xs, sm, md, lg, xl
- ✅ Uses consistent color based on username (same user = same color)

### **Props**
```typescript
{
  userId?: string         // User ID for presence lookup
  name?: string          // Display name
  email?: string         // Fallback if no name
  size?: 'xs'|'sm'|'md'|'lg'|'xl'  // Avatar size
  showOnline?: boolean   // Show online status dot
  className?: string     // Additional CSS classes
}
```

### **How It Works**
1. Extracts initials from name/email (up to 2 letters)
2. Generates a consistent background color based on name hash
3. Looks up user's online status from `presenceStore`
4. Displays colored dot indicator in bottom-right corner
5. Status colors:
   - 🟢 Green = Online
   - 🟡 Yellow = Away
   - 🔴 Red = Busy/DND
   - ⚫ Gray = Offline (not shown)

### **Usage Example**
```tsx
<Avatar 
  userId="user-123"
  name="John Doe"
  email="john@example.com"
  size="md"
  showOnline={true}
/>
```

---

## 2️⃣ **ChannelSidebar.tsx** - Channel Navigation

### **Purpose**
Displays a list of all channels with search, filtering, and navigation.

### **Key Features**
- ✅ Shows all available channels (DMs, groups, channels)
- ✅ Real-time search/filter by channel name
- ✅ Unread message counts and badges
- ✅ Active channel highlighting
- ✅ Channel type icons (DM, Group, Channel)
- ✅ "Create Channel" button integration
- ✅ Team/workspace grouping support
- ✅ Loading states

### **Props**
```typescript
{
  onCreateChannel?: () => void  // Called when create button clicked
}
```

### **How It Works**
1. Reads channels from Zustand `chatStore`
2. Filters channels based on search query
3. Groups channels by team (if applicable)
4. Shows unread counts from store
5. Handles channel selection (updates `activeChannelId`)
6. Displays appropriate icon for each channel type:
   - 💬 DM (Direct Message)
   - 👥 Group Chat
   - # Channel

### **UI Structure**
```
┌─────────────────────────┐
│ [Search Box]            │
├─────────────────────────┤
│ # engineering      [3]  │  ← Active
│ # design                │
│ 👥 Team Alpha           │
│ 💬 John Doe             │
├─────────────────────────┤
│ [+ Create Channel]      │
└─────────────────────────┘
```

### **Usage Example**
```tsx
<ChannelSidebar 
  onCreateChannel={() => setShowModal(true)}
/>
```

---

## 3️⃣ **MessageBubble.tsx** - Individual Message

### **Purpose**
Renders a single chat message with sender info, timestamp, and actions.

### **Key Features**
- ✅ Different styles for own messages vs others
- ✅ Shows sender avatar and name
- ✅ Relative timestamps ("2 minutes ago")
- ✅ Edit/Delete actions on hover (own messages only)
- ✅ File attachment preview
- ✅ "Edited" indicator
- ✅ "Deleted" message state
- ✅ Supports text wrapping and line breaks

### **Props**
```typescript
{
  message: Message       // Message object from store
  isOwn: boolean        // Is this user's message?
  showAvatar?: boolean  // Show sender avatar
  onEdit?: () => void   // Edit callback
  onDelete?: () => void // Delete callback
}
```

### **How It Works**
1. Formats timestamp using `date-fns`
2. Shows avatar only when sender changes (consecutive messages)
3. Aligns own messages to right (blue), others to left (gray)
4. Shows edit/delete buttons on hover (own messages only)
5. Displays file icon and name for attachments
6. Shows "(edited)" label if message was modified

### **Message Layout**
```
Other's Message:
[Avatar] John Doe
         ┌─────────────────┐
         │ Hello there!    │
         └─────────────────┘
         2 minutes ago

Own Message:
                     ┌─────────────────┐
                     │ Hi! How are you?│ [✎] [🗑]
                     └─────────────────┘
                     just now (edited)
```

### **Usage Example**
```tsx
<MessageBubble
  message={messageObj}
  isOwn={message.sender_id === currentUserId}
  showAvatar={true}
  onEdit={() => editMessage(message.id)}
  onDelete={() => deleteMessage(message.id)}
/>
```

---

## 4️⃣ **MessageInput.tsx** - Message Composition

### **Purpose**
Input field for typing and sending messages with file upload support.

### **Key Features**
- ✅ Auto-expanding textarea
- ✅ File attachment with preview
- ✅ Typing indicators trigger
- ✅ Keyboard shortcuts (Enter to send, Shift+Enter for newline)
- ✅ Upload progress indicator
- ✅ Disabled state support
- ✅ File type restrictions
- ✅ Visual feedback for actions

### **Props**
```typescript
{
  onSendMessage: (content: string, fileId?: string) => void
  onTypingStart?: () => void     // Trigger typing indicator
  onTypingStop?: () => void      // Stop typing indicator
  onFileUpload?: (file: File) => Promise<string>  // Upload handler
  placeholder?: string           // Input placeholder
  disabled?: boolean            // Disable input
}
```

### **How It Works**
1. **Typing Detection**: Calls `onTypingStart` when user types
2. **Auto-stop**: Triggers `onTypingStop` after 2 seconds of inactivity
3. **File Upload**: 
   - Click attachment icon → Opens file picker
   - Uploads file via `onFileUpload` callback
   - Shows preview with remove option
4. **Message Sending**:
   - Validates content (not empty)
   - Sends message with optional file ID
   - Clears input and resets state
5. **Auto-expand**: Textarea grows with content (max 32px height)

### **Accepted File Types**
- Images: `image/*`
- Videos: `video/*`
- Documents: `.pdf, .doc, .docx, .xls, .xlsx`
- Archives: `.zip, .rar`

### **UI Elements**
```
┌─────────────────────────────────────┐
│ [📎] [Type a message...      ] [➤] │
│                                     │
│ Press Enter to send, Shift+Enter   │
└─────────────────────────────────────┘

With Attachment:
┌─────────────────────────────────────┐
│ 📎 document.pdf              [X]    │
├─────────────────────────────────────┤
│ [📎] [Type a message...      ] [➤] │
└─────────────────────────────────────┘
```

### **Usage Example**
```tsx
<MessageInput
  onSendMessage={(content, fileId) => sendMsg(content, fileId)}
  onTypingStart={() => notifyTyping()}
  onTypingStop={() => stopTyping()}
  onFileUpload={async (file) => uploadFile(file)}
  placeholder="Type a message..."
/>
```

---

## 5️⃣ **MessageList.tsx** - Message Feed

### **Purpose**
Displays scrollable list of all messages in current channel with typing indicators.

### **Key Features**
- ✅ Infinite scroll support (load more on scroll to top)
- ✅ Auto-scroll to bottom on new messages
- ✅ Typing indicator animation
- ✅ Empty state ("No messages yet")
- ✅ Groups consecutive messages from same sender
- ✅ **Fixed**: Uses `useMemo` to prevent infinite loops
- ✅ Efficient rendering with proper keys

### **Props**
```typescript
{
  channelId: string                    // Current channel ID
  currentUserId: string                // For "isOwn" check
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onLoadMore?: () => void              // Load older messages
}
```

### **How It Works**
1. **Data Retrieval**: 
   - Uses `useMemo` to get messages from Zustand store
   - Prevents re-render loops by stabilizing references
2. **Auto-scroll**: Scrolls to bottom when new message arrives
3. **Load More**: Detects scroll to top, calls `onLoadMore`
4. **Avatar Grouping**: Shows avatar only on first message in sequence
5. **Typing Indicator**: Displays animated dots when others are typing
6. **Empty State**: Shows friendly message when no messages exist

### **Performance Fix** ⚠️
```typescript
// ❌ OLD (caused infinite loop)
const messages = useChatStore((state) => state.messages[channelId] || []);

// ✅ NEW (stable reference)
const messagesRecord = useChatStore((state) => state.messages);
const messages = useMemo(
  () => messagesRecord[channelId] || [], 
  [messagesRecord, channelId]
);
```

### **UI Flow**
```
┌────────────────────────────┐
│ ↑ [Scroll to load more]    │
├────────────────────────────┤
│ [Message 1]                │
│ [Message 2]                │
│ [Message 3]                │
│ ...                        │
│ [Message N]                │
│ ● ● ● 2 people typing...   │ ← Typing indicator
│                            │
│ [Auto-scroll anchor]       │
└────────────────────────────┘
```

### **Usage Example**
```tsx
<MessageList
  channelId="channel-123"
  currentUserId="user-456"
  onEdit={(id) => editMessage(id)}
  onDelete={(id) => deleteMessage(id)}
  onLoadMore={() => loadOlderMessages()}
/>
```

---

## 🔄 How Components Work Together

### **Complete Chat Interface Flow**

```
┌─────────────────────────────────────────────────────┐
│                   Chat Page                         │
├─────────────┬───────────────────────────────────────┤
│             │                                       │
│  Channel    │        Active Channel Header         │
│  Sidebar    │  [Channel Name] [Add Members] [...]  │
│             ├───────────────────────────────────────┤
│  # eng      │                                       │
│  # design   │        Message List                   │
│  👥 team    │  [Avatar] User: Message               │
│  💬 John    │  [Avatar] User: Message               │
│             │  [Your Message]              [✎] [🗑] │
│ [+ Create]  │  ● ● ● Someone is typing...           │
│             ├───────────────────────────────────────┤
│             │   Message Input                       │
│             │  [📎] [Type here...         ] [➤]    │
└─────────────┴───────────────────────────────────────┘
```

### **Data Flow**

```
User Action → Component → Zustand Store → Backend API
                ↓
            UI Update (via subscription)
```

**Example: Sending a Message**
1. User types in **MessageInput**
2. MessageInput triggers `onTypingStart`
3. User presses Enter
4. MessageInput calls `onSendMessage(content)`
5. Parent page sends to backend API
6. Backend broadcasts to WebSocket
7. **MessageList** receives update via store
8. **MessageBubble** renders new message
9. **MessageList** auto-scrolls to bottom

---

## 🛠️ State Management

All components use **Zustand** stores:

### **chatStore** (Primary)
```typescript
- channels: Channel[]           // All channels
- activeChannelId: string       // Selected channel
- messages: Record<id, Message[]>  // Messages by channel
- typingUsers: Record<id, userId[]>  // Who's typing
```

### **presenceStore** (Avatar)
```typescript
- users: Record<userId, Presence>
- getUserPresence(userId)  // Get online status
```

---

## 📦 Dependencies Used

- **React**: Component framework
- **Zustand**: State management
- **date-fns**: Timestamp formatting
- **Tailwind CSS**: Styling
- **TypeScript**: Type safety

---

## 🎨 Design Patterns

1. **Container/Presentational**: Components handle both logic and presentation
2. **Prop Callbacks**: Parent controls actions (onEdit, onDelete, etc.)
3. **Optimistic UI**: Immediate feedback, backend sync in background
4. **Memoization**: `useMemo` prevents unnecessary re-renders
5. **Compound Components**: Small focused components compose into larger features

---

## 🚀 Usage in Chat Page

```tsx
import { ChannelSidebar } from '@/components/communication/ChannelSidebar';
import { MessageList } from '@/components/communication/MessageList';
import { MessageInput } from '@/components/communication/MessageInput';

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      {/* Sidebar - 320px */}
      <ChannelSidebar onCreateChannel={handleCreate} />
      
      {/* Main Area - Flex */}
      <div className="flex-1 flex flex-col">
        {/* Messages - Flex grow */}
        <MessageList
          channelId={activeChannelId}
          currentUserId={userId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        
        {/* Input - Fixed height */}
        <MessageInput
          onSendMessage={handleSend}
          onTypingStart={notifyTyping}
          onTypingStop={stopTyping}
        />
      </div>
    </div>
  );
}
```

---

## ✅ Summary

| Component | Primary Role | Key Feature |
|-----------|-------------|------------|
| **Avatar** | User Identity | Colored initials + online status |
| **ChannelSidebar** | Navigation | Channel list with search |
| **MessageBubble** | Message Display | Own vs others styling |
| **MessageInput** | Composition | Type & send with files |
| **MessageList** | Feed Container | Scroll, load more, typing |

These components create a **complete, production-ready chat system** similar to Slack, Discord, or Microsoft Teams! 🎉

---

**Last Updated**: 2025-12-22  
**Component Status**: All Functional ✅  
**Known Issues**: None 🎊
