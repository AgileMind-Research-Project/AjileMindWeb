# Authentication Components

## Overview
Components for user authentication, registration, and access control.

## Components

### LoginForm.tsx
User login component with email/password validation.

```tsx
import { LoginForm } from '@/components/auth/LoginForm'

<LoginForm 
  onSuccess={() => router.push('/dashboard')}
  onError={(error) => toast.error(error.message)}
/>
```

**Features:**
- Email/password input
- Form validation
- Remember me checkbox
- Forgot password link
- Loading states
- Error handling

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
  redirectTo?: string
}
```

### RegisterForm.tsx
User registration component with validation.

```tsx
import { RegisterForm } from '@/components/auth/RegisterForm'

<RegisterForm 
  tenantSubdomain="company"
  onSuccess={() => router.push('/onboarding')}
/>
```

**Features:**
- Multi-step registration
- Email verification
- Password strength indicator
- Terms acceptance
- Tenant subdomain validation

**Props:**
```typescript
interface RegisterFormProps {
  tenantSubdomain?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}
```

### ProtectedRoute.tsx
HOC for protecting routes that require authentication.

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="developer">
      <Dashboard />
    </ProtectedRoute>
  )
}
```

**Features:**
- Authentication check
- Role-based access control
- Automatic redirect to login
- Loading state
- Permission verification

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager' | 'developer' | 'viewer'
  requiredPermissions?: string[]
  fallback?: React.ReactNode
}
```

### TenantSelector.tsx
Component for switching between tenants (for users with multi-tenant access).

```tsx
import { TenantSelector } from '@/components/auth/TenantSelector'

<TenantSelector 
  onTenantChange={(tenant) => switchTenant(tenant)}
/>
```

**Features:**
- Dropdown tenant list
- Search tenants
- Current tenant indicator
- Switch confirmation
- Recently accessed tenants

### ForgotPassword.tsx
Password reset request component.

```tsx
import { ForgotPassword } from '@/components/auth/ForgotPassword'

<ForgotPassword onSuccess={() => toast.success('Check your email')} />
```

### ResetPassword.tsx
Password reset form with token validation.

```tsx
import { ResetPassword } from '@/components/auth/ResetPassword'

<ResetPassword token={resetToken} />
```

## Hooks

### useAuth
Custom hook for authentication operations.

```tsx
import { useAuth } from '@/lib/hooks/useAuth'

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth()
  
  const handleLogin = async () => {
    await login({ email, password })
  }
  
  return <div>Welcome, {user?.name}</div>
}
```

**Return Values:**
- `user` - Current user object
- `isAuthenticated` - Boolean auth status
- `isLoading` - Loading state
- `login()` - Login function
- `logout()` - Logout function
- `register()` - Registration function
- `refreshToken()` - Token refresh

### usePermissions
Hook for checking user permissions.

```tsx
import { usePermissions } from '@/lib/hooks/usePermissions'

function MyComponent() {
  const { hasPermission, hasRole } = usePermissions()
  
  return (
    <>
      {hasPermission('sprint.write') && (
        <Button>Create Sprint</Button>
      )}
      {hasRole('admin') && (
        <AdminPanel />
      )}
    </>
  )
}
```

## State Management

### Auth Store (Zustand)

```typescript
// lib/store/authStore.ts
interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
}
```

## API Integration

```typescript
// lib/api/auth.ts
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  refresh: (token) => api.post('/auth/refresh', { token }),
  logout: () => api.post('/auth/logout'),
}
```

## Security Features

1. **JWT Token Management**
   - Secure token storage
   - Automatic refresh
   - Token expiration handling

2. **Password Security**
   - Password strength validation
   - Secure transmission (HTTPS only)
   - bcrypt hashing (backend)

3. **Session Management**
   - Automatic logout on expiry
   - Remember me functionality
   - Multi-device support

4. **CSRF Protection**
   - Token validation
   - Same-origin policy

## Styling

All auth components use Tailwind CSS and shadcn/ui:
- Consistent form styling
- Responsive design
- Dark mode support
- Loading skeletons
- Error states

## Testing

```typescript
// __tests__/components/auth/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginForm } from '@/components/auth/LoginForm'

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })
  
  it('should validate email', async () => {
    render(<LoginForm />)
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'invalid' } })
    // Assert validation error
  })
})
```

## Best Practices

1. **Never store passwords in state**
2. **Use secure token storage** (httpOnly cookies preferred)
3. **Validate on both client and server**
4. **Implement rate limiting** for login attempts
5. **Use HTTPS only** in production
6. **Clear sensitive data on logout**
7. **Implement 2FA** for admin accounts

---

**Related Components:**
- [Layout Components](../layout/README.md)
- [Shared Components](../shared/README.md)

**Related Hooks:**
- [useAuth](../../lib/hooks/README.md#useAuth)
- [useTenant](../../lib/hooks/README.md#useTenant)
