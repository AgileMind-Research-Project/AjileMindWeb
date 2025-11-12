# Shared Components

## Overview
Reusable utility components used throughout the application.

## Components

### LoadingSpinner.tsx
```tsx
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

<LoadingSpinner size="lg" text="Loading..." />
```

### EmptyState.tsx
```tsx
import { EmptyState } from '@/components/shared/EmptyState'

<EmptyState 
  icon={InboxIcon}
  title="No tasks yet"
  description="Create your first task to get started"
  action={<Button>Create Task</Button>}
/>
```

### ErrorBoundary.tsx
```tsx
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

<ErrorBoundary fallback={<ErrorPage />}>
  <MyComponent />
</ErrorBoundary>
```

### SearchBar.tsx
```tsx
import { SearchBar } from '@/components/shared/SearchBar'

<SearchBar 
  onSearch={(query) => filterResults(query)}
  placeholder="Search tasks..."
/>
```

### FilterPanel.tsx
```tsx
import { FilterPanel } from '@/components/shared/FilterPanel'

<FilterPanel 
  filters={availableFilters}
  onApply={(filters) => applyFilters(filters)}
/>
```

### Pagination.tsx
```tsx
import { Pagination } from '@/components/shared/Pagination'

<Pagination 
  currentPage={page}
  totalPages={totalPages}
  onPageChange={(newPage) => setPage(newPage)}
/>
```

---

**Used By:** All component modules
