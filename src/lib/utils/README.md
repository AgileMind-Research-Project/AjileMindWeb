# Utility Functions

## Overview
Helper functions and utilities used across the application.

## Date Utilities

### formatDate.ts
```typescript
import { formatDate, formatDateTime, formatRelative } from '@/lib/utils/date'

formatDate(new Date()) // "Jan 15, 2024"
formatDateTime(new Date()) // "Jan 15, 2024 at 2:30 PM"
formatRelative(pastDate) // "2 hours ago"

// Sprint dates
getSprintDuration(startDate, endDate) // "14 days"
isSprintActive(sprint) // true/false
getDaysRemaining(sprint) // 5
```

## Validation Utilities

### validation.ts
```typescript
import { 
  isValidEmail, 
  isStrongPassword,
  validateTask,
  validateSprint 
} from '@/lib/utils/validation'

// Email validation
if (!isValidEmail(email)) {
  setError("Invalid email format")
}

// Password strength
if (!isStrongPassword(password)) {
  setError("Password must be at least 8 characters")
}

// Task validation
const errors = validateTask(taskData)
if (errors.length > 0) {
  // Show errors
}
```

## String Utilities

### string.ts
```typescript
import { 
  truncate, 
  slugify, 
  capitalize,
  initials 
} from '@/lib/utils/string'

truncate("Long text here...", 20) // "Long text here..."
slugify("My Sprint Name") // "my-sprint-name"
capitalize("hello world") // "Hello world"
initials("John Doe") // "JD"
```

## Array Utilities

### array.ts
```typescript
import { 
  groupBy, 
  sortBy, 
  unique,
  chunk 
} from '@/lib/utils/array'

// Group tasks by status
const grouped = groupBy(tasks, 'status')
// { 'todo': [...], 'in-progress': [...] }

// Sort by priority
const sorted = sortBy(tasks, 'priority', 'desc')

// Get unique assignees
const assignees = unique(tasks.map(t => t.assignee))

// Paginate
const pages = chunk(items, 10) // [[1-10], [11-20], ...]
```

## Number Utilities

### number.ts
```typescript
import { 
  formatNumber, 
  formatCurrency,
  percentage,
  average 
} from '@/lib/utils/number'

formatNumber(1234567) // "1,234,567"
formatCurrency(1299.99) // "$1,299.99"
percentage(75, 100) // "75%"
average([10, 20, 30]) // 20
```

## Color Utilities

### colors.ts
```typescript
import { 
  getStatusColor, 
  getPriorityColor,
  getSentimentColor,
  hexToRgb 
} from '@/lib/utils/colors'

getStatusColor('in-progress') // "blue"
getPriorityColor('high') // "red"
getSentimentColor(0.8) // "green" (positive)
hexToRgb('#FF5733') // { r: 255, g: 87, b: 51 }
```

## Class Name Utilities

### cn.ts
```typescript
import { cn } from '@/lib/utils/cn'

// Combine class names with conditional logic
<div className={cn(
  "base-class",
  isActive && "active-class",
  isPending && "pending-class"
)} />
```

## Storage Utilities

### storage.ts
```typescript
import { 
  setItem, 
  getItem, 
  removeItem,
  clear 
} from '@/lib/utils/storage'

// Type-safe localStorage wrapper
setItem('user', userData)
const user = getItem<User>('user')
removeItem('user')
clear() // Clear all
```

## URL Utilities

### url.ts
```typescript
import { 
  buildURL, 
  getQueryParams,
  updateQueryParam 
} from '@/lib/utils/url'

// Build URL with params
const url = buildURL('/api/tasks', { 
  status: 'active', 
  page: 1 
})
// "/api/tasks?status=active&page=1"

// Parse query string
const params = getQueryParams(window.location.search)

// Update single param
const newURL = updateQueryParam(currentURL, 'page', 2)
```

## Export Utilities

### export.ts
```typescript
import { 
  exportToCSV, 
  exportToJSON,
  exportToPDF 
} from '@/lib/utils/export'

// Export tasks to CSV
exportToCSV(tasks, 'tasks.csv')

// Export to JSON
exportToJSON(data, 'backup.json')

// Generate PDF report
await exportToPDF(reportData, 'report.pdf')
```

## Error Utilities

### error.ts
```typescript
import { 
  getErrorMessage, 
  isAPIError,
  handleAPIError 
} from '@/lib/utils/error'

try {
  await api.call()
} catch (error) {
  const message = getErrorMessage(error)
  toast.error(message)
  
  if (isAPIError(error)) {
    handleAPIError(error)
  }
}
```

## Performance Utilities

### performance.ts
```typescript
import { debounce, throttle, memoize } from '@/lib/utils/performance'

// Debounce search
const debouncedSearch = debounce(searchFunction, 300)

// Throttle scroll handler
const throttledScroll = throttle(handleScroll, 100)

// Memoize expensive calculation
const expensiveCalc = memoize((data) => {
  // Heavy computation
})
```

---

**Related:** [Hooks](../hooks/README.md), [Types](../types/README.md)
