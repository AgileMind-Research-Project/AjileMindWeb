# API Client

## Overview
Centralized API client for backend communication using Axios and React Query.

## Client Configuration

### apiClient.ts
```typescript
import { apiClient } from '@/lib/api/apiClient'

// Automatic JWT token handling
// Automatic tenant_id injection
// Request/response interceptors
// Error handling
```

## API Modules

### Authentication API
```typescript
import { authAPI } from '@/lib/api/auth'

// Login
const { token, user } = await authAPI.login({
  email: 'user@example.com',
  password: 'password'
})

// Register
await authAPI.register({
  email: 'new@example.com',
  password: 'password',
  tenantId: 'tenant-123'
})

// Refresh token
const { token } = await authAPI.refreshToken()
```

### Sprints API
```typescript
import { sprintsAPI } from '@/lib/api/sprints'

// Get all sprints
const sprints = await sprintsAPI.getAll()

// Create sprint
const sprint = await sprintsAPI.create({
  name: "Sprint 5",
  startDate: "2024-01-15",
  endDate: "2024-01-29"
})

// Update sprint
await sprintsAPI.update(sprintId, { status: 'active' })

// Delete sprint
await sprintsAPI.delete(sprintId)
```

### Tasks API
```typescript
import { tasksAPI } from '@/lib/api/tasks'

// Get tasks by sprint
const tasks = await tasksAPI.getBySprint(sprintId)

// Create task
const task = await tasksAPI.create({
  title: "Implement login",
  sprintId: sprintId,
  storyPoints: 5
})

// Move task
await tasksAPI.move(taskId, { status: 'in-progress' })
```

### Meetings API
```typescript
import { meetingsAPI } from '@/lib/api/meetings'

// Schedule meeting
const meeting = await meetingsAPI.schedule({
  title: "Daily Standup",
  date: "2024-01-15T09:00:00Z",
  participants: [userId1, userId2]
})

// Get transcript
const transcript = await meetingsAPI.getTranscript(meetingId)

// Get blockers
const blockers = await meetingsAPI.getBlockers(meetingId)
```

### Retrospectives API
```typescript
import { retrospectivesAPI } from '@/lib/api/retrospectives'

// Create retrospective
const retro = await retrospectivesAPI.create({
  sprintId: sprintId,
  type: 'standard'
})

// Add feedback
await retrospectivesAPI.addFeedback(retroId, {
  type: 'went-well',
  content: "Great collaboration",
  anonymous: false
})

// Get sentiment
const sentiment = await retrospectivesAPI.getSentiment(retroId)
```

### AI API
```typescript
import { aiAPI } from '@/lib/api/ai'

// Generate tasks
const suggestions = await aiAPI.generateTasks({
  context: "User authentication feature",
  storyPoints: 13
})

// Chat with assistant
const response = await aiAPI.chat({
  query: "Show all blockers from last sprint",
  context: 'sprint-123'
})

// Predict risks
const risks = await aiAPI.predictRisks(projectId)
```

## React Query Integration

### Query Hooks
```typescript
import { useQuery } from '@tanstack/react-query'
import { sprintsAPI } from '@/lib/api/sprints'

// Automatic caching, refetching, and error handling
const { data: sprints, isLoading, error } = useQuery({
  queryKey: ['sprints'],
  queryFn: sprintsAPI.getAll
})
```

### Mutation Hooks
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksAPI } from '@/lib/api/tasks'

const queryClient = useQueryClient()

const createTaskMutation = useMutation({
  mutationFn: tasksAPI.create,
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})

// Usage
await createTaskMutation.mutateAsync(taskData)
```

## Error Handling

```typescript
// Automatic error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
    }
    
    if (error.response?.status === 403) {
      // Show permission error
    }
    
    return Promise.reject(error)
  }
)
```

## Request Interceptors

```typescript
// Automatic token injection
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Add tenant ID
  const tenantId = getTenantId()
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId
  }
  
  return config
})
```

## Types

```typescript
// All API responses are typed
interface APIResponse<T> {
  data: T
  message: string
  success: boolean
}

interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'planned' | 'active' | 'completed'
}
```

---

**Related:** [Hooks](../hooks/README.md), [Types](../types/README.md)
