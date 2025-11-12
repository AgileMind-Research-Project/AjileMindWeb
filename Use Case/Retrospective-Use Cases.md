# Retrospective Use Cases

## Overview
Sprint retrospective facilitation, feedback collection, sentiment analysis, and action planning.

---

## Use Case 1: Create Retrospective

**Actor:** Scrum Master

**Goal:** Create retrospective for completed sprint

**Preconditions:**
- Sprint is completed
- User has retrospective creation permissions

**Flow:**
1. System auto-suggests retrospective after sprint completion
2. User clicks "Create Retrospective"
3. System shows retrospective creation form:
   - Sprint selection (auto-filled)
   - Date/time
   - Type (standard/custom)
   - Anonymous feedback option
4. User confirms details
5. System creates retrospective with "draft" status
6. System sends invitations to team
7. User redirected to retrospective board

**Postconditions:**
- Retrospective created
- Team invited
- Board ready for feedback

**Alternative Flows:**
- **A1:** Retrospective already exists → Open existing
- **A2:** Sprint not completed → Show warning, allow anyway

**API Endpoints:**
- `POST /api/v1/retrospectives`
- `GET /api/v1/sprints/:sprintId`

**Components:**
- `RetroCreation.tsx`
- `useRetrospectives` hook
- `retrospectivesAPI.create()`

---

## Use Case 2: Add Feedback to Board

**Actor:** Team Member

**Goal:** Contribute feedback to retrospective

**Preconditions:**
- Retrospective exists and is open
- User is team member

**Flow:**
1. User opens retrospective board
2. User sees three columns:
   - What Went Well (Green)
   - What Needs Improvement (Yellow)
   - Action Items (Blue)
3. User clicks "+" in desired column
4. User enters feedback text
5. User chooses: Anonymous or Named
6. User clicks "Add"
7. System creates feedback card
8. Card appears in column
9. Other users see card in real-time

**Postconditions:**
- Feedback added to board
- Visible to all participants
- Real-time sync active

**Alternative Flows:**
- **A1:** Anonymous mode → Author name hidden
- **A2:** Duplicate feedback → Show similar items
- **A3:** Network error → Queue locally, sync later

**API Endpoints:**
- `POST /api/v1/retrospectives/:retroId/feedback`
- WebSocket: `/ws/retrospective/:retroId`

**Components:**
- `RetroBoard.tsx`
- `FeedbackCard.tsx`
- `AddFeedbackForm.tsx`
- `useRetrospectives` hook

---

## Use Case 3: Vote on Feedback

**Actor:** Team Member

**Goal:** Vote on important feedback items

**Preconditions:**
- Retrospective board has feedback
- Voting phase active

**Flow:**
1. User reviews feedback cards
2. User clicks vote button (👍) on card
3. System increments vote count
4. User's vote highlighted
5. System updates card position (sort by votes)
6. User can change/remove vote
7. System shows user's remaining votes
8. Most voted items rise to top

**Postconditions:**
- Vote recorded
- Card ranking updated
- User votes tracked

**Alternative Flows:**
- **A1:** Vote limit reached → Show "No votes remaining"
- **A2:** Remove vote → Decrement count
- **A3:** Already voted → Toggle vote off

**API Endpoints:**
- `POST /api/v1/retrospectives/:retroId/feedback/:feedbackId/vote`

**Components:**
- `FeedbackCard.tsx`
- `VoteButton.tsx`
- `useRetrospectives` hook

---

## Use Case 4: Group Similar Feedback

**Actor:** Scrum Master / Facilitator

**Goal:** Organize similar feedback items

**Preconditions:**
- Multiple feedback items exist
- User has facilitator permissions

**Flow:**
1. User selects multiple feedback cards (Ctrl+Click)
2. User clicks "Group Selected"
3. System shows grouping dialog
4. User enters group title
5. System analyzes similarity using AI
6. System creates group container
7. Selected cards move into group
8. Group shows combined vote count
9. User can expand/collapse group

**Postconditions:**
- Related feedback grouped
- Board more organized
- Combined metrics visible

**Alternative Flows:**
- **A1:** AI suggests groupings → Show suggestions
- **A2:** Ungroup → Cards return to column

**API Endpoints:**
- `POST /api/v1/retrospectives/:retroId/feedback/group`

**Components:**
- `RetroBoard.tsx`
- `FeedbackGroup.tsx`
- `useRetrospectives` hook

---

## Use Case 5: View Sentiment Analysis

**Actor:** Scrum Master / Team Member

**Goal:** Understand team sentiment from feedback

**Preconditions:**
- Retrospective has feedback
- Sentiment analysis complete

**Flow:**
1. User clicks "Sentiment Analysis" tab
2. System displays sentiment dashboard:
   - Overall sentiment score (0-1)
   - Positive/Neutral/Negative distribution (pie chart)
   - Sentiment by category (bar chart)
   - Emotion breakdown (joy, concern, frustration, etc.)
   - Word cloud of key terms
   - Trend comparison with previous sprints
3. User can drill down by category
4. User sees highlighted concerns
5. System provides interpretation

**Postconditions:**
- Team sentiment visible
- Key concerns identified
- Trends compared

**Alternative Flows:**
- **A1:** Insufficient feedback → Show "Need more feedback for analysis"
- **A2:** Mixed sentiment → Highlight conflicting feedback

**API Endpoints:**
- `GET /api/v1/retrospectives/:retroId/sentiment`

**Components:**
- `SentimentAnalysis.tsx`
- `SentimentChart.tsx`
- `WordCloud.tsx`
- `useRetrospectives` hook

---

## Use Case 6: Generate Action Plan

**Actor:** Scrum Master

**Goal:** Create actionable items from feedback

**Preconditions:**
- Retrospective has feedback
- Feedback reviewed and voted

**Flow:**
1. User clicks "Generate Action Plan"
2. System uses AI to analyze feedback
3. System generates action items based on:
   - Highest voted feedback
   - "Needs Improvement" items
   - Explicit action suggestions
4. System shows proposed action plan:
   - Priority ranked items
   - Suggested owners (based on context)
   - Estimated due dates
   - Related feedback items
5. User reviews each action
6. User can:
   - Edit description
   - Assign owner
   - Set due date
   - Adjust priority
   - Remove irrelevant items
   - Add new items
7. User clicks "Save Action Plan"
8. System creates action items
9. Owners notified

**Postconditions:**
- Action plan created
- Owners assigned
- Due dates set
- Tracking enabled

**Alternative Flows:**
- **A1:** No clear actions → Show "Add actions manually"
- **A2:** AI confidence low → Flag for review

**API Endpoints:**
- `POST /api/v1/retrospectives/:retroId/action-plan/generate`
- `PUT /api/v1/retrospectives/:retroId/action-plan/:actionId`

**Components:**
- `ActionPlanGenerator.tsx`
- `ActionPlanItem.tsx`
- `useRetrospectives` hook
- `aiAPI.generateActionPlan()`

---

## Use Case 7: Track Action Plan Progress

**Actor:** Team Member

**Goal:** Monitor action item completion

**Preconditions:**
- Action plan exists
- User has view permissions

**Flow:**
1. User opens retrospective action plan
2. System shows action items with:
   - Description
   - Owner
   - Due date
   - Status (pending/in-progress/completed)
   - Progress percentage
3. User clicks action item for details
4. System shows:
   - Full description
   - Comments/updates
   - Linked feedback
   - Activity timeline
5. Owner can update status
6. Owner can add progress notes
7. System sends updates to team

**Postconditions:**
- Progress visible
- Status updated
- Team informed

**Alternative Flows:**
- **A1:** Overdue item → Highlight with warning
- **A2:** Blocked action → Allow marking as blocked
- **A3:** Convert to task → Create sprint task

**API Endpoints:**
- `GET /api/v1/retrospectives/:retroId/action-plan`
- `PATCH /api/v1/retrospectives/:retroId/action-plan/:actionId/complete`

**Components:**
- `ActionPlanTracker.tsx`
- `ActionPlanItem.tsx`
- `useRetrospectives` hook

---

## Use Case 8: View Retrospective Timeline

**Actor:** Scrum Master / Manager

**Goal:** See historical retrospectives and trends

**Preconditions:**
- Multiple retrospectives exist

**Flow:**
1. User navigates to retrospective timeline
2. System displays chronological list:
   - Sprint name
   - Date
   - Sentiment score
   - Feedback count
   - Action completion rate
3. User sees trend line of sentiment
4. User sees recurring themes highlighted
5. User clicks retrospective to open
6. User can filter by date range
7. User can compare two retrospectives

**Postconditions:**
- Historical view visible
- Trends identified
- Comparisons available

**Alternative Flows:**
- **A1:** Few retrospectives → Show message "Need more data for trends"

**API Endpoints:**
- `GET /api/v1/retrospectives`
- `GET /api/v1/retrospectives/trends`

**Components:**
- `RetroTimeline.tsx`
- `RetroTrendChart.tsx`
- `useRetrospectives` hook

---

## Use Case 9: Publish Retrospective

**Actor:** Scrum Master

**Goal:** Finalize and share retrospective

**Preconditions:**
- Retrospective in draft status
- Feedback collection complete
- Action plan created

**Flow:**
1. User reviews retrospective completeness
2. User clicks "Publish"
3. System validates:
   - Has feedback items
   - Has action plan
   - All actions assigned
4. System shows publish confirmation:
   - Summary stats
   - Share options (team/organization/public)
5. User confirms
6. System updates status to "published"
7. System makes retrospective read-only
8. System sends summary to team
9. System updates sprint completion

**Postconditions:**
- Retrospective published
- Board locked (read-only)
- Team notified
- Summary shared

**Alternative Flows:**
- **A1:** Incomplete action plan → Show warning, allow publish
- **A2:** No feedback → Prevent publish, show error

**API Endpoints:**
- `POST /api/v1/retrospectives/:retroId/publish`

**Components:**
- `RetroActions.tsx`
- `PublishDialog.tsx`
- `useRetrospectives` hook

---

## Use Case 10: Export Retrospective Report

**Actor:** Scrum Master / Manager

**Goal:** Create shareable retrospective report

**Preconditions:**
- Retrospective published
- User has export permissions

**Flow:**
1. User clicks "Export Report"
2. System shows export options:
   - Format (PDF/Markdown/PowerPoint)
   - Sections to include:
     - Summary
     - Feedback (all/top voted)
     - Sentiment analysis
     - Action plan
     - Comparison with previous sprint
3. User selects options
4. User clicks "Generate"
5. System creates formatted report:
   - Cover page with sprint info
   - Sentiment charts
   - Feedback organized by category
   - Action plan table
   - Trend graphs
6. System generates download link
7. User downloads report

**Postconditions:**
- Report generated
- Shareable document created
- Available for download

**Alternative Flows:**
- **A1:** Email report → Send to recipients
- **A2:** Add to documentation → Link to docs platform

**API Endpoints:**
- `POST /api/v1/retrospectives/:retroId/export`

**Components:**
- `RetroExport.tsx`
- `useRetrospectives` hook

---

## Collaboration Features

### Real-time Collaboration
- Multiple users add feedback simultaneously
- Live vote updates
- Presence indicators (who's viewing)
- Cursor tracking for facilitator

### Facilitation Tools
- Timer for time-boxing phases
- Phase transitions (collect → vote → discuss → plan)
- Icebreaker activities
- Anonymous mode toggle

---

## AI-Powered Features

### Sentiment Analysis
- NLP analysis of feedback text
- Emotion detection (joy, concern, frustration, optimism)
- Keyword extraction
- Topic clustering
- Trend detection vs previous sprints

### Action Plan Generation
- Analyzes high-voted items
- Identifies actionable vs informational feedback
- Suggests owners based on context
- Estimates urgency/priority
- Links related feedback

### Insights
- "Team morale improved 15% from last sprint"
- "Testing quality" mentioned 5 times - recurring issue
- "Collaboration" sentiment: 0.85 (very positive)
- Suggest focus areas for next sprint

---

## Performance Optimization

1. **Lazy Loading:** Load feedback on demand
2. **Real-time Sync:** WebSocket for live updates
3. **Optimistic Updates:** Show changes immediately
4. **Debounced Votes:** Batch vote updates
5. **Virtual Scrolling:** For large feedback lists

---

## Related Documentation
- [API Routes: Retrospective](../../../agile-mind-backend/API%20Docs/Retrospective-API%20Routes.md)
- [Components: Retrospectives](../src/components/retrospectives/README.md)
- [AI Components](../src/components/ai/README.md)
