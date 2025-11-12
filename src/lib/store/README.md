# State Management

## Overview
Zustand stores for client-side state management.

## Stores

### Auth Store
```typescript
import { useAuthStore } from '@/lib/store/authStore'

const { 
  user, 
  token, 
  tenant,
  setUser, 
  setToken,
  setTenant,
  logout 
} = useAuthStore()

// Login
setUser(userData)
setToken(jwtToken)

// Logout
logout() // Clears all auth state
```

**State:**
```typescript
interface AuthState {
  user: User | null
  token: string | null
  tenant: Tenant | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  setToken: (token: string) => void
  setTenant: (tenant: Tenant) => void
  logout: () => void
}
```

### Sprint Store
```typescript
import { useSprintStore } from '@/lib/store/sprintStore'

const { 
  currentSprint,
  sprints,
  setCurrentSprint,
  addSprint,
  updateSprint 
} = useSprintStore()

// Set active sprint
setCurrentSprint(sprint)

// Add new sprint
addSprint(newSprint)
```

**State:**
```typescript
interface SprintState {
  currentSprint: Sprint | null
  sprints: Sprint[]
  setCurrentSprint: (sprint: Sprint) => void
  addSprint: (sprint: Sprint) => void
  updateSprint: (id: string, data: Partial<Sprint>) => void
  removeSprint: (id: string) => void
}
```

### Task Store
```typescript
import { useTaskStore } from '@/lib/store/taskStore'

const { 
  tasks,
  filters,
  addTask,
  updateTask,
  moveTask,
  setFilter 
} = useTaskStore()

// Move task between columns
moveTask(taskId, 'in-progress')

// Apply filters
setFilter({ assignee: userId, priority: 'high' })
```

**State:**
```typescript
interface TaskState {
  tasks: Task[]
  filters: TaskFilters
  addTask: (task: Task) => void
  updateTask: (id: string, data: Partial<Task>) => void
  moveTask: (id: string, status: TaskStatus) => void
  setFilter: (filters: Partial<TaskFilters>) => void
  clearFilters: () => void
}
```

### UI Store
```typescript
import { useUIStore } from '@/lib/store/uiStore'

const { 
  sidebarOpen,
  theme,
  toggleSidebar,
  setTheme 
} = useUIStore()

// Toggle sidebar
toggleSidebar()

// Change theme
setTheme('dark')
```

**State:**
```typescript
interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  modalOpen: string | null
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  openModal: (modalId: string) => void
  closeModal: () => void
}
```

### Notification Store
```typescript
import { useNotificationStore } from '@/lib/store/notificationStore'

const { 
  notifications,
  unreadCount,
  addNotification,
  markAsRead 
} = useNotificationStore()

// Add notification
addNotification({
  type: 'info',
  message: 'Sprint started',
  timestamp: new Date()
})

// Mark as read
markAsRead(notificationId)
```

## Persistence

```typescript
// Persist store to localStorage
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      // State and actions
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // Only persist specific fields
        token: state.token,
        user: state.user
      })
    }
  )
)
```

## DevTools Integration

```typescript
import { devtools } from 'zustand/middleware'

export const useSprintStore = create(
  devtools(
    (set) => ({
      // State and actions
    }),
    { name: 'SprintStore' }
  )
)
```

## Store Composition

```typescript
// Combine multiple stores
const useStore = () => ({
  auth: useAuthStore(),
  sprint: useSprintStore(),
  task: useTaskStore()
})
```

## Best Practices

1. **Keep stores small and focused** - One responsibility per store
2. **Use selectors** - Only subscribe to needed state
3. **Avoid derived state** - Compute on demand
4. **Async in components** - Not in store actions
5. **Persist wisely** - Only essential state

---

**Related:** [Hooks](../hooks/README.md), [Types](../types/README.md)
