# Layout Components

## Overview
Core layout components for application structure.

## Components

### DashboardLayout.tsx
Main layout wrapper for dashboard pages.

```tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <YourContent />
    </DashboardLayout>
  )
}
```

**Features:**
- Sidebar navigation
- Header with user menu
- Breadcrumbs
- Mobile responsive
- Theme switcher

### Header.tsx
Top navigation header.

```tsx
import { Header } from '@/components/layout/Header'

<Header 
  user={currentUser}
  tenant={currentTenant}
  onMenuClick={() => toggleSidebar()}
/>
```

**Features:**
- Logo
- Search
- Notifications
- User menu
- Tenant switcher
- Mobile menu trigger

### Sidebar.tsx
Sidebar navigation menu.

```tsx
import { Sidebar } from '@/components/layout/Sidebar'

<Sidebar 
  isOpen={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
/>
```

**Features:**
- Navigation links
- Active route highlighting
- Collapsible sections
- Icon support
- Badge notifications
- Responsive behavior

### Footer.tsx
Page footer component.

```tsx
import { Footer } from '@/components/layout/Footer'

<Footer />
```

**Features:**
- Copyright
- Links
- Version info
- Status indicator

### Navbar.tsx
Marketing/public pages navigation.

```tsx
import { Navbar } from '@/components/layout/Navbar'

<Navbar />
```

**Features:**
- Logo
- Menu items
- CTA buttons
- Mobile menu
- Sticky header

---

**Used By:** All application pages
