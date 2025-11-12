# Custom Hooks

## Overview
Reusable React hooks for common functionality.

## Authentication Hooks

### useAuth
```typescript
import { useAuth } from '@/lib/hooks/useAuth'

const { user, login, logout, isAuthenticated } = useAuth()

// Login
await login({ email, password })

// Logout
await logout()

// Check authentication
if (isAuthenticated) {
  // User is logged in
}
```

### usePermissions
```typescript
import { usePermissions } from '@/lib/hooks/usePermissions'

const { hasPermission, canEdit, canDelete } = usePermissions()

if (hasPermission('sprints.create')) {
  // Show create button
}

if (canEdit('task', taskId)) {
  // Allow editing
}
```

## Data Hooks

### useSprints
```typescript
import { useSprints } from '@/lib/hooks/useSprints'

const { sprints, loading, createSprint, updateSprint } = useSprints()

// Create new sprint
await createSprint({
  name: "Sprint 5",
  startDate: new Date(),
  endDate: addWeeks(new Date(), 2)
})
```

### useTasks
```typescript
import { useTasks } from '@/lib/hooks/useTasks'

const { tasks, addTask, updateTask, deleteTask } = useTasks(sprintId)

// Update task status
await updateTask(taskId, { status: 'in-progress' })
```

### useMeetings
```typescript
import { useMeetings } from '@/lib/hooks/useMeetings'

const { meetings, scheduleMeeting, startMeeting } = useMeetings()

// Schedule meeting
await scheduleMeeting({
  title: "Daily Standup",
  date: tomorrow,
  participants: teamMembers
})
```

## UI Hooks

### useModal
```typescript
import { useModal } from '@/lib/hooks/useModal'

const { isOpen, open, close } = useModal()

<Button onClick={open}>Open Modal</Button>
<Modal isOpen={isOpen} onClose={close}>
  {/* Modal content */}
</Modal>
```

### useToast
```typescript
import { useToast } from '@/lib/hooks/useToast'

const { toast } = useToast()

toast.success("Task created successfully")
toast.error("Failed to update sprint")
toast.info("Meeting starts in 5 minutes")
```

### useDebounce
```typescript
import { useDebounce } from '@/lib/hooks/useDebounce'

const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useDebounce(searchTerm, 500)

useEffect(() => {
  // This only runs 500ms after user stops typing
  searchAPI(debouncedSearch)
}, [debouncedSearch])
```

## Real-time Hooks

### useWebSocket
```typescript
import { useWebSocket } from '@/lib/hooks/useWebSocket'

const { connected, send, on } = useWebSocket(`/ws/sprint/${sprintId}`)

// Listen for updates
on('task.updated', (task) => {
  updateLocalTask(task)
})

// Send message
send('task.move', { taskId, newStatus })
```

### useRealtime
```typescript
import { useRealtime } from '@/lib/hooks/useRealtime'

useRealtime('sprint', sprintId, (data) => {
  // Automatically refetch when sprint updates
  revalidate()
})
```

## Form Hooks

### useForm
```typescript
import { useForm } from '@/lib/hooks/useForm'

const { values, errors, handleChange, handleSubmit } = useForm({
  initialValues: { title: '', description: '' },
  validate: (values) => {
    const errors = {}
    if (!values.title) errors.title = 'Required'
    return errors
  },
  onSubmit: async (values) => {
    await createTask(values)
  }
})
```

## Utility Hooks

### useLocalStorage
```typescript
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'

const [theme, setTheme] = useLocalStorage('theme', 'light')

// Persists to localStorage automatically
setTheme('dark')
```

### useMediaQuery
```typescript
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

const isMobile = useMediaQuery('(max-width: 768px)')

if (isMobile) {
  return <MobileView />
}
```

### usePagination
```typescript
import { usePagination } from '@/lib/hooks/usePagination'

const { 
  currentPage, 
  pageSize, 
  totalPages,
  nextPage,
  prevPage,
  goToPage 
} = usePagination(totalItems, 20)
```

---

**Related:** [API Client](../api/README.md), [Store](../store/README.md)
