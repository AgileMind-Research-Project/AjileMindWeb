# Meeting Components

## Overview
Components for daily scrum meetings, transcription, and blocker management.

## Components

### MeetingScheduler.tsx
Schedule and configure meetings.

```tsx
import { MeetingScheduler } from '@/components/meetings/MeetingScheduler'

<MeetingScheduler 
  onSchedule={(meeting) => createMeeting(meeting)}
/>
```

**Features:**
- Date/time selection
- Recurring meetings
- Participant selection
- Teams integration
- Calendar sync
- Reminder settings

### TranscriptViewer.tsx
Display and interact with meeting transcripts.

```tsx
import { TranscriptViewer } from '@/components/meetings/TranscriptViewer'

<TranscriptViewer 
  meetingId="meeting-123"
  transcript={transcriptData}
  highlightBlockers={true}
/>
```

**Features:**
- Timestamped transcript
- Speaker identification
- Blocker highlighting
- Search functionality
- Action item detection
- Export options

### BlockersList.tsx
Display and manage detected blockers.

```tsx
import { BlockersList } from '@/components/meetings/BlockersList'

<BlockersList 
  blockers={blockers}
  onResolve={(blocker) => resolveBlocker(blocker)}
/>
```

**Features:**
- Severity indicators
- Status tracking
- Assignment
- Resolution notes
- Link to tasks
- Jira sync

### ActionItemsPanel.tsx
Manage action items from meetings.

```tsx
import { ActionItemsPanel } from '@/components/meetings/ActionItemsPanel'

<ActionItemsPanel 
  meetingId="meeting-123"
  onCreateTask={(item) => createTaskFromAction(item)}
/>
```

**Features:**
- Action item list
- Owner assignment
- Due dates
- Convert to tasks
- Status tracking
- Bulk operations

### MeetingSummary.tsx
AI-generated meeting summary.

```tsx
import { MeetingSummary } from '@/components/meetings/MeetingSummary'

<MeetingSummary meeting={meeting} />
```

**Features:**
- Key discussion points
- Detected blockers count
- Action items summary
- Sentiment analysis
- Participant list
- Duration

### LiveMeeting.tsx
Real-time meeting interface.

```tsx
import { LiveMeeting } from '@/components/meetings/LiveMeeting'

<LiveMeeting 
  meetingId="meeting-123"
  onEnd={() => navigate('/meetings')}
/>
```

**Features:**
- Real-time transcription
- Live blocker detection
- Speaking time tracking
- Note taking
- Screen sharing
- Recording controls

---

**Related:** [AI Components](../ai/README.md)
