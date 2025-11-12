# TypeScript Types

## Overview
Centralized TypeScript type definitions for the application.

## Core Types

### User Types
```typescript
// types/user.ts
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: UserRole
  tenantId: string
  createdAt: string
  updatedAt: string
}

export type UserRole = 'admin' | 'manager' | 'developer' | 'viewer'

export interface UserProfile extends User {
  bio?: string
  timezone: string
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark'
  notifications: boolean
  emailDigest: boolean
}
```

### Tenant Types
```typescript
// types/tenant.ts
export interface Tenant {
  id: string
  name: string
  subdomain: string
  plan: TenantPlan
  settings: TenantSettings
  createdAt: string
}

export type TenantPlan = 'free' | 'starter' | 'professional' | 'enterprise'

export interface TenantSettings {
  allowSignups: boolean
  requireApproval: boolean
  maxUsers: number
  features: string[]
}
```

### Sprint Types
```typescript
// types/sprint.ts
export interface Sprint {
  id: string
  name: string
  goal: string
  startDate: string
  endDate: string
  status: SprintStatus
  tenantId: string
  teamId: string
  velocity?: number
  capacity?: number
  createdAt: string
  updatedAt: string
}

export type SprintStatus = 'planned' | 'active' | 'completed' | 'cancelled'

export interface SprintMetrics {
  totalTasks: number
  completedTasks: number
  totalStoryPoints: number
  completedStoryPoints: number
  velocity: number
  burndownData: BurndownPoint[]
}

export interface BurndownPoint {
  date: string
  remaining: number
  ideal: number
}
```

### Task Types
```typescript
// types/task.ts
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  type: TaskType
  storyPoints?: number
  assigneeId?: string
  sprintId: string
  tags: string[]
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskType = 'feature' | 'bug' | 'technical' | 'documentation'

export interface TaskComment {
  id: string
  taskId: string
  userId: string
  content: string
  createdAt: string
}
```

### Meeting Types
```typescript
// types/meeting.ts
export interface Meeting {
  id: string
  title: string
  type: MeetingType
  date: string
  duration: number
  participants: string[]
  status: MeetingStatus
  transcript?: string
  blockers: Blocker[]
  actionItems: ActionItem[]
  sentiment?: number
  createdAt: string
}

export type MeetingType = 'standup' | 'planning' | 'retrospective' | 'review'
export type MeetingStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled'

export interface Blocker {
  id: string
  description: string
  severity: 'low' | 'medium' | 'high'
  detectedAt: string
  resolvedAt?: string
  assigneeId?: string
}

export interface ActionItem {
  id: string
  description: string
  ownerId: string
  dueDate?: string
  completed: boolean
}
```

### Retrospective Types
```typescript
// types/retrospective.ts
export interface Retrospective {
  id: string
  sprintId: string
  date: string
  feedback: FeedbackItem[]
  sentiment: SentimentAnalysis
  actionPlan: ActionPlan
  status: 'draft' | 'published'
  createdAt: string
}

export interface FeedbackItem {
  id: string
  type: 'went-well' | 'needs-improvement' | 'action'
  content: string
  votes: number
  authorId?: string
  anonymous: boolean
  createdAt: string
}

export interface SentimentAnalysis {
  overall: number
  positive: number
  negative: number
  neutral: number
  keywords: string[]
}

export interface ActionPlan {
  items: ActionPlanItem[]
  createdAt: string
}

export interface ActionPlanItem {
  id: string
  description: string
  priority: number
  ownerId: string
  dueDate: string
  status: 'pending' | 'in-progress' | 'completed'
}
```

## API Types

### Response Types
```typescript
// types/api.ts
export interface APIResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface APIError {
  message: string
  code: string
  details?: Record<string, string[]>
}
```

### Request Types
```typescript
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  tenantId: string
}

export interface CreateSprintRequest {
  name: string
  goal: string
  startDate: string
  endDate: string
  teamId: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  sprintId: string
  priority: TaskPriority
  type: TaskType
  storyPoints?: number
  assigneeId?: string
}
```

## Component Props Types

```typescript
// types/components.ts
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface TaskCardProps extends BaseComponentProps {
  task: Task
  onUpdate: (task: Partial<Task>) => void
  onDelete: () => void
  draggable?: boolean
}

export interface SprintBoardProps extends BaseComponentProps {
  sprintId: string
  onTaskMove: (taskId: string, status: TaskStatus) => void
}

export interface ChartProps extends BaseComponentProps {
  data: any[]
  width?: number
  height?: number
  showLegend?: boolean
}
```

## Utility Types

```typescript
// types/utils.ts
export type ID = string

export type DateString = string

export type Optional<T> = T | undefined

export type Nullable<T> = T | null

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type PickRequired<T, K extends keyof T> = T & Required<Pick<T, K>>
```

---

**Related:** [API Client](../api/README.md), [Store](../store/README.md)
