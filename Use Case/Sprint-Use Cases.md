# Sprint Management Use Cases

## Overview
Sprint planning, execution, and tracking workflows.

---

## Use Case 1: Create New Sprint

**Actor:** Scrum Master / Project Manager

**Goal:** Create and plan a new sprint

**Preconditions:**
- User has sprint creation permissions
- Team is configured

**Flow:**
1. User navigates to sprints page
2. User clicks "Create Sprint" button
3. System displays sprint creation form
4. User enters sprint details:
   - Sprint name
   - Sprint goal
   - Start date
   - End date (default: 2 weeks)
   - Team selection
   - Capacity (story points)
5. User clicks "Create"
6. System validates input (dates, capacity)
7. System creates sprint with status "planned"
8. System redirects to sprint board
9. User sees empty sprint board

**Postconditions:**
- New sprint created with "planned" status
- Sprint visible in sprint list
- Ready for task assignment

**Alternative Flows:**
- **A1:** Date overlap with existing sprint → Show error "Sprint dates overlap"
- **A2:** Invalid capacity → Show error "Capacity must be positive"
- **A3:** Duplicate name → Show warning, allow anyway

**API Endpoints:**
- `POST /api/v1/sprints`
- `GET /api/v1/teams/:teamId`

**Components:**
- `SprintForm.tsx`
- `useSprints` hook
- `sprintsAPI.create()`

---

## Use Case 2: View Sprint Board

**Actor:** Team Member

**Goal:** View current sprint tasks organized by status

**Preconditions:**
- Sprint exists
- User has view permissions

**Flow:**
1. User navigates to sprint board
2. System loads sprint data
3. System loads tasks grouped by status
4. System displays Kanban board with columns:
   - To Do
   - In Progress
   - Review
   - Done
5. Each task displayed as card with:
   - Title
   - Assignee avatar
   - Story points
   - Priority badge
   - Tags
6. User sees sprint progress metrics at top
7. User sees capacity vs. committed points

**Postconditions:**
- Sprint board visible with all tasks
- Real-time updates enabled

**Alternative Flows:**
- **A1:** No active sprint → Show "No active sprint" message
- **A2:** Loading error → Show error state with retry

**API Endpoints:**
- `GET /api/v1/sprints/:sprintId`
- `GET /api/v1/tasks?sprintId=<id>`

**Components:**
- `SprintBoard.tsx`
- `TaskCard.tsx`
- `useSprints` hook
- `useTasks` hook

---

## Use Case 3: Drag and Drop Task

**Actor:** Team Member

**Goal:** Move task between status columns

**Preconditions:**
- Sprint is active
- User has edit permissions
- Task exists

**Flow:**
1. User drags task card
2. System highlights valid drop zones
3. User drops card in new column
4. System animates card movement
5. Client sends status update to server
6. Server validates permission
7. Server updates task status
8. Server broadcasts update via WebSocket
9. Other users see task move in real-time
10. System updates sprint metrics

**Postconditions:**
- Task status updated
- Change reflected for all users
- Sprint progress updated

**Alternative Flows:**
- **A1:** Network error → Revert drag, show error toast
- **A2:** Concurrent update → Show conflict, reload board
- **A3:** Invalid transition → Revert drag, show message

**API Endpoints:**
- `PATCH /api/v1/tasks/:taskId/move`
- WebSocket: `/ws/sprint/:sprintId`

**Components:**
- `SprintBoard.tsx` (drag-drop logic)
- `TaskCard.tsx` (draggable)
- `useTaskDragDrop` hook
- `useWebSocket` hook

---

## Use Case 4: Add Task to Sprint

**Actor:** Team Member

**Goal:** Create new task in sprint

**Preconditions:**
- Sprint exists
- User has task creation permissions

**Flow:**
1. User clicks "Add Task" button in column
2. System shows task creation form
3. User enters task details:
   - Title
   - Description
   - Story points
   - Priority
   - Type (feature/bug/technical)
   - Assignee
   - Tags
4. User clicks "Create"
5. System validates input
6. System creates task with "todo" status
7. System adds task to sprint
8. Task card appears in board
9. Sprint capacity updates

**Postconditions:**
- New task created and visible
- Sprint task count updated
- Assignee notified (if assigned)

**Alternative Flows:**
- **A1:** Sprint at capacity → Show warning, allow anyway
- **A2:** Required fields missing → Show validation errors
- **A3:** AI suggestion available → Offer to generate sub-tasks

**API Endpoints:**
- `POST /api/v1/tasks`

**Components:**
- `TaskForm.tsx`
- `TaskCard.tsx`
- `useTasks` hook
- `tasksAPI.create()`

---

## Use Case 5: View Sprint Burndown Chart

**Actor:** Team Member / Scrum Master

**Goal:** Track sprint progress via burndown chart

**Preconditions:**
- Sprint is active or completed
- Tasks have story points

**Flow:**
1. User navigates to sprint details
2. User clicks "Burndown" tab
3. System loads burndown data
4. System displays chart with:
   - X-axis: Sprint days
   - Y-axis: Story points remaining
   - Ideal line (projected)
   - Actual line (completed)
   - Today marker
5. User hovers over points for details
6. Chart shows if sprint on track

**Postconditions:**
- Burndown chart visible
- Progress trends clear

**Alternative Flows:**
- **A1:** Insufficient data → Show "Not enough data yet"
- **A2:** Sprint not started → Show planned capacity only

**API Endpoints:**
- `GET /api/v1/sprints/:sprintId/burndown`

**Components:**
- `BurndownChart.tsx` (Recharts)
- `useSprints` hook

---

## Use Case 6: View Capacity Planner

**Actor:** Scrum Master

**Goal:** Plan and allocate team capacity

**Preconditions:**
- Sprint exists
- Team members configured

**Flow:**
1. User opens capacity planner
2. System shows team members with:
   - Name
   - Available hours/points
   - Assigned points
   - Remaining capacity
   - Historical velocity
3. System shows sprint totals:
   - Total capacity
   - Committed points
   - Available capacity
4. User sees visual indicators:
   - Green: Under capacity
   - Yellow: Near capacity
   - Red: Over capacity
5. AI suggests optimal allocation

**Postconditions:**
- Capacity visible for planning
- Allocation recommendations available

**Alternative Flows:**
- **A1:** Team member on PTO → Show reduced capacity
- **A2:** Over capacity → Show warning

**API Endpoints:**
- `GET /api/v1/sprints/:sprintId`
- `POST /api/v1/ai/capacity/analyze`

**Components:**
- `CapacityPlanner.tsx`
- `useSprints` hook
- `aiAPI.analyzeCapacity()`

---

## Use Case 7: Start Sprint

**Actor:** Scrum Master

**Goal:** Begin a planned sprint

**Preconditions:**
- Sprint exists with "planned" status
- Sprint has tasks assigned
- Sprint dates are valid

**Flow:**
1. User opens planned sprint
2. User clicks "Start Sprint" button
3. System shows confirmation dialog with:
   - Sprint details
   - Task count
   - Team capacity
   - Duration
4. User confirms
5. System validates no other active sprint
6. System updates status to "active"
7. System starts burndown tracking
8. System sends notifications to team
9. System updates sprint board

**Postconditions:**
- Sprint status "active"
- Burndown tracking active
- Team notified
- Board accessible

**Alternative Flows:**
- **A1:** Another sprint active → Show error "Complete current sprint first"
- **A2:** No tasks → Show warning "Sprint has no tasks"
- **A3:** Past start date → Adjust to today

**API Endpoints:**
- `POST /api/v1/sprints/:sprintId/start`

**Components:**
- `SprintActions.tsx`
- `useSprints` hook

---

## Use Case 8: Complete Sprint

**Actor:** Scrum Master

**Goal:** End active sprint

**Preconditions:**
- Sprint is active
- Sprint end date reached (or manual completion)

**Flow:**
1. User clicks "Complete Sprint"
2. System shows completion summary:
   - Completed tasks: 21/23
   - Story points: 38/42
   - Velocity: 38
   - Incomplete tasks: 2
3. User reviews incomplete tasks
4. User chooses action for incomplete tasks:
   - Move to next sprint
   - Move to backlog
   - Mark as done (if applicable)
5. User adds completion notes
6. User confirms completion
7. System updates sprint status to "completed"
8. System moves incomplete tasks
9. System triggers retrospective creation
10. System updates velocity metrics

**Postconditions:**
- Sprint marked complete
- Incomplete tasks moved
- Retrospective created
- Metrics updated

**Alternative Flows:**
- **A1:** All tasks complete → Auto-move to next step
- **A2:** Sprint not at end date → Show warning, allow anyway

**API Endpoints:**
- `POST /api/v1/sprints/:sprintId/complete`
- `POST /api/v1/retrospectives`

**Components:**
- `SprintCompletion.tsx`
- `useSprints` hook

---

## Use Case 9: View Sprint Timeline

**Actor:** Team Member

**Goal:** See sprint timeline and milestones

**Preconditions:**
- Sprint exists

**Flow:**
1. User opens sprint timeline view
2. System displays timeline with:
   - Sprint start/end dates
   - Current day marker
   - Milestone markers
   - Task completion events
   - Meeting indicators
3. User sees days remaining
4. User sees key events:
   - Daily standups
   - Sprint planning
   - Sprint review
   - Retrospective

**Postconditions:**
- Timeline visible
- Sprint progress clear

**API Endpoints:**
- `GET /api/v1/sprints/:sprintId`
- `GET /api/v1/meetings?sprintId=<id>`

**Components:**
- `SprintTimeline.tsx`
- `useSprints` hook

---

## Use Case 10: Filter Sprint Tasks

**Actor:** Team Member

**Goal:** Filter tasks by various criteria

**Preconditions:**
- Sprint board visible

**Flow:**
1. User clicks filter button
2. System shows filter panel with options:
   - Assignee
   - Priority
   - Type
   - Tags
   - Story points range
3. User selects filters
4. System applies filters instantly
5. Board shows only matching tasks
6. Filter badge shows active filter count
7. User can clear filters anytime

**Postconditions:**
- Filtered view displayed
- Filter state persisted in URL

**Alternative Flows:**
- **A1:** No tasks match → Show "No tasks match filters"
- **A2:** Save filter preset → Store for reuse

**API Endpoints:**
- None (client-side filtering)
- Or: `GET /api/v1/tasks?sprintId=<id>&filters=...`

**Components:**
- `FilterPanel.tsx`
- `SprintBoard.tsx`
- `useTaskStore` (filters)

---

## Real-time Features

### WebSocket Events
- `task.created` → Add new task to board
- `task.updated` → Update task card
- `task.moved` → Move task between columns
- `task.deleted` → Remove task from board
- `sprint.updated` → Refresh sprint data

### Optimistic Updates
- Drag-drop moves show immediately
- Task edits reflect instantly
- Reverted on server error

---

## Performance Optimization

1. **Virtual Scrolling:** Large task lists virtualized
2. **Lazy Loading:** Tasks loaded on demand
3. **Debounced Search:** Search input debounced 300ms
4. **Memoization:** Task cards memoized with React.memo
5. **Pagination:** Tasks paginated if > 100

---

## Related Documentation
- [API Routes: Sprint](../../../agile-mind-backend/API%20Docs/Sprint-API%20Routes.md)
- [API Routes: Task](../../../agile-mind-backend/API%20Docs/Task-API%20Routes.md)
- [Components: Sprints](../src/components/sprints/README.md)
