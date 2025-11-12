# Meeting Management Use Cases

## Overview
Daily scrum meetings, transcription, blocker detection, and action item tracking.

---

## Use Case 1: Schedule Meeting

**Actor:** Scrum Master / Team Lead

**Goal:** Schedule a team meeting

**Preconditions:**
- User has meeting scheduling permissions
- Team members exist

**Flow:**
1. User clicks "Schedule Meeting"
2. System shows meeting form with fields:
   - Title
   - Type (standup/planning/retrospective/review)
   - Date & time
   - Duration
   - Participants (multi-select)
   - Recurring options
   - Teams integration toggle
3. User fills in details
4. User enables Teams integration
5. User clicks "Schedule"
6. System validates inputs
7. System creates meeting
8. System sends calendar invites
9. If Teams enabled: Creates Teams meeting link
10. System sends notifications to participants

**Postconditions:**
- Meeting scheduled
- Participants notified
- Calendar invites sent
- Teams link created (if enabled)

**Alternative Flows:**
- **A1:** Time conflict → Show warning, allow anyway
- **A2:** Teams unavailable → Schedule without Teams link
- **A3:** Recurring meeting → Create series

**API Endpoints:**
- `POST /api/v1/meetings`
- `POST /api/v1/integrations/teams/meetings` (if Teams enabled)

**Components:**
- `MeetingScheduler.tsx`
- `useMeetings` hook
- `meetingsAPI.schedule()`

---

## Use Case 2: Start Live Meeting

**Actor:** Meeting Facilitator

**Goal:** Begin meeting with live transcription

**Preconditions:**
- Meeting is scheduled
- Current time is within meeting window

**Flow:**
1. User navigates to scheduled meeting
2. User clicks "Start Meeting"
3. System opens live meeting interface
4. System starts timer
5. System enables real-time transcription
6. System enables blocker detection
7. Interface shows:
   - Transcript feed (live)
   - Detected blockers list
   - Speaking time tracker
   - Note-taking area
   - Participant list
8. Users can add manual notes
9. System auto-detects blockers from transcript

**Postconditions:**
- Meeting in progress
- Transcription active
- Blockers detected in real-time

**Alternative Flows:**
- **A1:** Transcription fails → Show error, allow manual notes
- **A2:** No microphone access → Disable transcription
- **A3:** Late start → Log actual start time

**API Endpoints:**
- `POST /api/v1/meetings/:meetingId/start`
- WebSocket: `/ws/meeting/:meetingId`

**Components:**
- `LiveMeeting.tsx`
- `TranscriptViewer.tsx` (live mode)
- `BlockersList.tsx` (live updates)
- `useMeetings` hook
- `useWebSocket` hook

---

## Use Case 3: View Meeting Transcript

**Actor:** Team Member

**Goal:** Read completed meeting transcript

**Preconditions:**
- Meeting completed
- Transcript processed

**Flow:**
1. User navigates to meetings list
2. User clicks on completed meeting
3. System loads meeting details
4. System displays transcript with:
   - Timestamp for each segment
   - Speaker identification
   - Highlighted blockers
   - Highlighted action items
5. User can search transcript
6. User can highlight/annotate text
7. User can export transcript

**Postconditions:**
- Transcript visible and searchable
- Blockers highlighted
- Export available

**Alternative Flows:**
- **A1:** Transcript processing → Show "Processing..." status
- **A2:** Processing failed → Show manual notes only

**API Endpoints:**
- `GET /api/v1/meetings/:meetingId`
- `GET /api/v1/meetings/:meetingId/transcript`

**Components:**
- `TranscriptViewer.tsx`
- `useMeetings` hook

---

## Use Case 4: Review Detected Blockers

**Actor:** Team Member

**Goal:** Review and manage blockers from meeting

**Preconditions:**
- Meeting completed
- Blockers detected

**Flow:**
1. User views meeting details
2. User opens "Blockers" tab
3. System shows blocker list with:
   - Description
   - Severity (low/medium/high)
   - Who mentioned it
   - Timestamp in transcript
   - Status (active/resolved)
4. User clicks blocker
5. System shows blocker details:
   - Full context from transcript
   - Related tasks (if any)
   - Suggested assignee
6. User can:
   - Assign to team member
   - Link to existing task
   - Create new task
   - Mark as resolved
   - Add resolution notes

**Postconditions:**
- Blockers reviewed
- Actions taken
- Tasks created/linked

**Alternative Flows:**
- **A1:** False positive → User dismisses blocker
- **A2:** Duplicate blocker → Merge with existing

**API Endpoints:**
- `GET /api/v1/meetings/:meetingId/blockers`
- `PATCH /api/v1/meetings/:meetingId/blockers/:blockerId`
- `POST /api/v1/tasks` (if creating task)

**Components:**
- `BlockersList.tsx`
- `BlockerDetail.tsx`
- `useMeetings` hook

---

## Use Case 5: Manage Action Items

**Actor:** Team Member

**Goal:** Track and complete action items from meetings

**Preconditions:**
- Meeting completed
- Action items detected or added

**Flow:**
1. User opens meeting action items
2. System shows action items with:
   - Description
   - Owner
   - Due date
   - Status (pending/in-progress/completed)
   - Created from (transcript reference)
3. User can:
   - Claim action item
   - Set due date
   - Add notes
   - Mark complete
   - Convert to task
4. System sends reminder notifications
5. Owner receives notification

**Postconditions:**
- Action items tracked
- Owners assigned
- Notifications sent

**Alternative Flows:**
- **A1:** Convert to task → Creates task, links to action item
- **A2:** Overdue item → Highlight with warning

**API Endpoints:**
- `GET /api/v1/meetings/:meetingId/action-items`
- `PATCH /api/v1/meetings/:meetingId/action-items/:itemId`
- `POST /api/v1/tasks` (if converting)

**Components:**
- `ActionItemsPanel.tsx`
- `ActionItemCard.tsx`
- `useMeetings` hook

---

## Use Case 6: View Meeting Summary

**Actor:** Team Member / Manager

**Goal:** Get quick overview of meeting

**Preconditions:**
- Meeting completed
- AI summary generated

**Flow:**
1. User opens meeting
2. System displays AI-generated summary with:
   - Key discussion points (bullet list)
   - Decisions made
   - Blocker count
   - Action item count
   - Sentiment score
   - Participant attendance
   - Duration (actual vs planned)
3. User can expand for full details
4. User can share summary

**Postconditions:**
- Quick meeting overview visible
- Shareable summary available

**Alternative Flows:**
- **A1:** Summary generation in progress → Show placeholder
- **A2:** No transcript → Manual summary only

**API Endpoints:**
- `GET /api/v1/meetings/:meetingId`
- `GET /api/v1/meetings/:meetingId/sentiment`

**Components:**
- `MeetingSummary.tsx`
- `useMeetings` hook

---

## Use Case 7: Search Meeting History

**Actor:** Team Member

**Goal:** Find specific information from past meetings

**Preconditions:**
- Meetings exist
- User has view permissions

**Flow:**
1. User navigates to meetings page
2. User enters search query
3. System searches:
   - Meeting titles
   - Transcript content
   - Action items
   - Blocker descriptions
4. System displays results with:
   - Meeting date/title
   - Matching excerpt (highlighted)
   - Relevance score
5. User clicks result
6. System jumps to relevant section

**Postconditions:**
- Search results displayed
- Quick navigation to content

**Alternative Flows:**
- **A1:** No results → Show "No meetings found"
- **A2:** Too many results → Paginate

**API Endpoints:**
- `GET /api/v1/meetings?search=<query>`

**Components:**
- `MeetingsList.tsx`
- `SearchBar.tsx`
- `useMeetings` hook

---

## Use Case 8: View Speaking Time Analytics

**Actor:** Scrum Master

**Goal:** Analyze meeting participation

**Preconditions:**
- Meeting completed with transcript
- Speaker identification successful

**Flow:**
1. User opens meeting analytics
2. System shows speaking time chart:
   - Pie chart of speaking distribution
   - Bar chart by participant
   - Comparison to previous meetings
3. System shows metrics:
   - Most active speaker
   - Balanced participation score
   - Silent participants
4. System provides insights:
   - "John dominated conversation (45%)"
   - "3 members spoke less than 1 minute"
   - "Good balance compared to last meeting"

**Postconditions:**
- Participation analytics visible
- Insights for improvement

**Alternative Flows:**
- **A1:** No speaker identification → Show count only

**API Endpoints:**
- `GET /api/v1/meetings/:meetingId`

**Components:**
- `MeetingAnalytics.tsx`
- `SpeakingTimeChart.tsx`
- `useMeetings` hook

---

## Use Case 9: Export Meeting Data

**Actor:** Team Member

**Goal:** Export meeting information

**Preconditions:**
- Meeting exists
- User has view permissions

**Flow:**
1. User opens meeting
2. User clicks "Export" dropdown
3. User selects format:
   - PDF (formatted report)
   - Markdown (for docs)
   - CSV (for data analysis)
4. User selects sections to include:
   - Transcript
   - Blockers
   - Action items
   - Summary
   - Analytics
5. User clicks "Export"
6. System generates file
7. System triggers download

**Postconditions:**
- Meeting data exported
- File downloaded

**Alternative Flows:**
- **A1:** Large transcript → Show progress indicator
- **A2:** Email option → Send to user's email

**API Endpoints:**
- `POST /api/v1/meetings/:meetingId/export`

**Components:**
- `MeetingExport.tsx`
- `useMeetings` hook

---

## Use Case 10: Configure Meeting Notifications

**Actor:** Team Member

**Goal:** Control meeting notifications

**Preconditions:**
- User is authenticated

**Flow:**
1. User opens notification settings
2. User sees meeting notification options:
   - Meeting reminders (15 min before)
   - Action item assignments
   - Blocker mentions
   - Meeting summaries
   - Transcript ready notifications
3. User toggles preferences
4. User sets notification channels:
   - In-app
   - Email
   - MS Teams
5. User saves preferences
6. System updates notification settings

**Postconditions:**
- Notification preferences saved
- Future notifications respect settings

**API Endpoints:**
- `GET /api/v1/users/:userId`
- `PUT /api/v1/users/:userId` (preferences)

**Components:**
- `NotificationSettings.tsx`
- `useAuth` hook

---

## AI-Powered Features

### Automatic Blocker Detection
- NLP analysis of transcript
- Keywords: "blocked", "issue", "problem", "can't", "stuck"
- Severity scoring based on context
- False positive filtering

### Action Item Extraction
- Detects commitment language: "I will", "Let's", "We should"
- Assigns to speaker
- Suggests due dates based on urgency
- Links to related tasks

### Sentiment Analysis
- Overall meeting sentiment score
- Individual participant sentiment
- Topic-based sentiment
- Trend over time

### Meeting Insights
- Participation balance
- Meeting efficiency score
- Topic coverage
- Follow-up recommendations

---

## Real-time Features

### WebSocket Events
- `transcript.update` → New transcript segment
- `blocker.detected` → New blocker found
- `action.created` → Action item added
- `participant.joined` → User joined meeting
- `meeting.ended` → Meeting completed

### Live Updates
- Transcript appears as spoken
- Blockers appear when detected
- Speaking time updates live
- Participant status real-time

---

## Related Documentation
- [API Routes: Meeting](../../../agile-mind-backend/API%20Docs/Meeting-API%20Routes.md)
- [Components: Meetings](../src/components/meetings/README.md)
- [AI Components](../src/components/ai/README.md)
