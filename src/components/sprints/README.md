# Sprint Components

## Overview
Components for sprint planning, task management, and capacity planning.

## Components

### SprintBoard.tsx
Kanban-style sprint board with drag-and-drop functionality.

```tsx
import { SprintBoard } from '@/components/sprints/SprintBoard'

<SprintBoard 
  sprintId="sprint-123"
  onTaskMove={(task, newStatus) => updateTask(task, newStatus)}
/>
```

**Features:**
- Drag-and-drop task cards
- Column-based layout (To Do, In Progress, Review, Done)
- Real-time updates
- Filter and search
- Bulk operations
- WIP limits

**Props:**
```typescript
interface SprintBoardProps {
  sprintId: string
  readonly?: boolean
  onTaskMove?: (task: Task, newStatus: TaskStatus) => void
  onTaskClick?: (task: Task) => void
}
```

### SprintCard.tsx
Sprint summary card component.

```tsx
import { SprintCard } from '@/components/sprints/SprintCard'

<SprintCard 
  sprint={sprint}
  onClick={() => navigate(`/sprints/${sprint.id}`)}
/>
```

**Features:**
- Sprint details summary
- Progress indicator
- Key metrics
- Status badge
- Quick actions

### TaskCard.tsx
Individual task card for sprint board.

```tsx
import { TaskCard } from '@/components/sprints/TaskCard'

<TaskCard 
  task={task}
  draggable={true}
  onEdit={() => openTaskModal(task)}
/>
```

**Features:**
- Task title and description
- Story points
- Assignee avatar
- Priority indicator
- Blocker alert
- AI-generated badge

**Props:**
```typescript
interface TaskCardProps {
  task: Task
  draggable?: boolean
  isDragging?: boolean
  onEdit?: () => void
  onDelete?: () => void
}
```

### CapacityPlanner.tsx
Team capacity planning and visualization.

```tsx
import { CapacityPlanner } from '@/components/sprints/CapacityPlanner'

<CapacityPlanner 
  sprintId="sprint-123"
  capacity={capacityData}
/>
```

**Features:**
- Team member capacity
- Allocation visualization
- Overallocation warnings
- AI recommendations
- Historical velocity
- Capacity forecasting

**Props:**
```typescript
interface CapacityPlannerProps {
  sprintId: string
  capacity: TeamCapacity
  onUpdate?: (capacity: TeamCapacity) => void
}
```

### BurndownChart.tsx
Sprint burndown chart visualization.

```tsx
import { BurndownChart } from '@/components/sprints/BurndownChart'

<BurndownChart 
  sprintId="sprint-123"
  data={burndownData}
/>
```

**Features:**
- Ideal vs actual burndown
- Story points tracking
- Trend analysis
- Completion forecast
- Interactive tooltip

### SprintTimeline.tsx
Timeline view of sprint activities.

```tsx
import { SprintTimeline } from '@/components/sprints/SprintTimeline'

<SprintTimeline sprint={sprint} events={events} />
```

**Features:**
- Chronological event display
- Milestone markers
- Activity filtering
- Date range selection

### TaskForm.tsx
Form for creating/editing tasks.

```tsx
import { TaskForm } from '@/components/sprints/TaskForm'

<TaskForm 
  task={existingTask}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

**Features:**
- Rich text description
- Story point estimation
- Assignee selection
- Priority selection
- Sprint selection
- Tag management
- AI suggestions

### SprintSettings.tsx
Sprint configuration component.

```tsx
import { SprintSettings } from '@/components/sprints/SprintSettings'

<SprintSettings 
  sprint={sprint}
  onUpdate={handleUpdate}
/>
```

**Features:**
- Sprint dates
- Capacity settings
- Team selection
- Goals definition
- Integration settings

## Hooks

### useSprints
Hook for sprint operations.

```tsx
import { useSprints } from '@/lib/hooks/useSprints'

function MyComponent() {
  const { sprints, createSprint, updateSprint, isLoading } = useSprints()
  
  const handleCreate = async () => {
    await createSprint(sprintData)
  }
  
  return <SprintList sprints={sprints} />
}
```

### useTaskDragDrop
Hook for drag-and-drop functionality.

```tsx
import { useTaskDragDrop } from '@/lib/hooks/useTaskDragDrop'

function SprintBoard() {
  const { handleDragStart, handleDragEnd } = useTaskDragDrop({
    onTaskMove: (task, newStatus) => updateTask(task.id, newStatus)
  })
  
  return <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    {/* Board content */}
  </DndContext>
}
```

## State Management

### Sprint Store

```typescript
interface SprintState {
  sprints: Sprint[]
  currentSprint: Sprint | null
  tasks: Task[]
  filters: TaskFilters
  setSprints: (sprints: Sprint[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  setFilters: (filters: TaskFilters) => void
}
```

## AI Features

### AI Task Generation
```tsx
<Button onClick={() => generateAITasks(sprint.id)}>
  Generate AI Tasks
</Button>
```

### AI Capacity Suggestions
```tsx
<CapacityPlanner 
  showAIRecommendations={true}
  onApplyRecommendation={(rec) => applyCapacityRecommendation(rec)}
/>
```

## Real-time Updates

Sprint board supports real-time updates via WebSocket:

```typescript
// Automatic updates when team members make changes
useEffect(() => {
  const ws = connectWebSocket(`/ws/sprints/${sprintId}`)
  
  ws.on('task_updated', (task) => {
    updateTaskInState(task)
  })
  
  return () => ws.disconnect()
}, [sprintId])
```

## Data Flow

```
User Action → Component → Hook → API → Backend → Database
                ↓
            State Update
                ↓
         UI Re-render
```

## Performance Optimization

1. **Virtualization** - Large task lists use react-window
2. **Memoization** - useMemo for expensive calculations
3. **Debouncing** - Search and filter inputs
4. **Lazy Loading** - Load tasks on demand
5. **Optimistic Updates** - Immediate UI feedback

## Responsive Design

All sprint components are fully responsive:
- **Mobile:** Single column layout, bottom sheets
- **Tablet:** Two column layout, side panels
- **Desktop:** Full kanban board, multiple columns

## Testing

```typescript
// __tests__/components/sprints/SprintBoard.test.tsx
import { render, screen } from '@testing-library/react'
import { SprintBoard } from '@/components/sprints/SprintBoard'

describe('SprintBoard', () => {
  it('should render task columns', () => {
    render(<SprintBoard sprintId="123" />)
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })
})
```

---

**Related Components:**
- [Charts](../charts/README.md)
- [AI Components](../ai/README.md)
- [Shared Components](../shared/README.md)
