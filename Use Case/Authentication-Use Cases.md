# Authentication Use Cases

## Overview
User authentication, registration, and account management workflows.

---

## Use Case 1: User Registration

**Actor:** New User

**Goal:** Create a new account in the system

**Preconditions:**
- User has valid email address
- Tenant exists or will be created

**Flow:**
1. User navigates to registration page
2. User enters email, password, first name, last name
3. User selects or creates tenant
4. System validates input (email format, password strength)
5. System creates user account
6. System sends verification email
7. User receives welcome message
8. User redirected to email verification page

**Postconditions:**
- User account created with status "unverified"
- Verification email sent
- User can login after email verification

**Alternative Flows:**
- **A1:** Email already exists → Show error "Email already registered"
- **A2:** Weak password → Show password requirements
- **A3:** Email service unavailable → Account created, verification email queued

**API Endpoints:**
- `POST /api/v1/auth/register`

**Components:**
- `RegisterForm.tsx`
- `useAuth` hook
- `authAPI.register()`

---

## Use Case 2: User Login

**Actor:** Registered User

**Goal:** Access the system with credentials

**Preconditions:**
- User has registered account
- Email is verified

**Flow:**
1. User navigates to login page
2. User enters email and password
3. System validates credentials
4. System checks email verification status
5. System generates JWT token
6. System generates refresh token
7. System returns tokens and user data
8. Client stores tokens securely
9. User redirected to dashboard

**Postconditions:**
- User authenticated with valid JWT
- Refresh token stored for token renewal
- User session active

**Alternative Flows:**
- **A1:** Invalid credentials → Show "Invalid email or password"
- **A2:** Email not verified → Show "Please verify your email" with resend option
- **A3:** Account suspended → Show "Account suspended. Contact admin"
- **A4:** Too many failed attempts → Account locked for 15 minutes

**API Endpoints:**
- `POST /api/v1/auth/login`

**Components:**
- `LoginForm.tsx`
- `useAuth` hook
- `authAPI.login()`
- `authStore` (Zustand)

---

## Use Case 3: Forgot Password

**Actor:** Registered User

**Goal:** Reset forgotten password

**Preconditions:**
- User has registered account
- User has access to registered email

**Flow:**
1. User clicks "Forgot Password" on login page
2. User enters email address
3. System validates email exists
4. System generates password reset token
5. System sends reset email with token link
6. User clicks link in email
7. User redirected to reset password page
8. User enters new password
9. System validates password strength
10. System updates password
11. System invalidates old tokens
12. User redirected to login page

**Postconditions:**
- Password updated successfully
- Old tokens invalidated
- User can login with new password

**Alternative Flows:**
- **A1:** Email not found → Show "If email exists, reset link sent" (security)
- **A2:** Token expired → Show "Link expired. Request new reset"
- **A3:** Weak password → Show password requirements

**API Endpoints:**
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

**Components:**
- `ForgotPassword.tsx`
- `ResetPassword.tsx`
- `authAPI.forgotPassword()`
- `authAPI.resetPassword()`

---

## Use Case 4: Refresh Token

**Actor:** Authenticated User

**Goal:** Maintain active session without re-login

**Preconditions:**
- User has valid refresh token
- Session not expired

**Flow:**
1. Client detects JWT expiring soon (or expired)
2. Client sends refresh token to server
3. System validates refresh token
4. System checks token not revoked
5. System generates new JWT
6. System optionally rotates refresh token
7. System returns new tokens
8. Client stores new tokens
9. Client retries original request with new JWT

**Postconditions:**
- New JWT token active
- Session continues seamlessly
- Optional: Old refresh token invalidated

**Alternative Flows:**
- **A1:** Refresh token expired → Redirect to login
- **A2:** Refresh token revoked → Redirect to login
- **A3:** Network error → Queue and retry

**API Endpoints:**
- `POST /api/v1/auth/refresh`

**Components:**
- `apiClient.ts` (interceptor)
- `authAPI.refreshToken()`
- `authStore.setToken()`

---

## Use Case 5: Logout

**Actor:** Authenticated User

**Goal:** End current session

**Preconditions:**
- User is authenticated

**Flow:**
1. User clicks logout button
2. System confirms logout action
3. Client sends logout request to server
4. System invalidates refresh token
5. Client clears JWT from storage
6. Client clears user data from store
7. User redirected to login page

**Postconditions:**
- Tokens invalidated
- User data cleared from client
- Session ended

**Alternative Flows:**
- **A1:** Network error during logout → Clear client data anyway
- **A2:** User closes tab → Automatic logout after timeout

**API Endpoints:**
- `POST /api/v1/auth/logout`

**Components:**
- `Header.tsx` (logout button)
- `useAuth` hook
- `authAPI.logout()`
- `authStore.logout()`

---

## Use Case 6: Email Verification

**Actor:** Newly Registered User

**Goal:** Verify email address to activate account

**Preconditions:**
- User registered successfully
- Verification email sent

**Flow:**
1. User opens verification email
2. User clicks verification link
3. User redirected to verification page
4. Client extracts token from URL
5. Client sends token to server
6. System validates token
7. System marks email as verified
8. System updates user status to "active"
9. User sees success message
10. User redirected to login or dashboard

**Postconditions:**
- Email verified
- User account active
- User can fully access system

**Alternative Flows:**
- **A1:** Token expired → Show "Link expired" with resend option
- **A2:** Token invalid → Show error
- **A3:** Already verified → Redirect to login

**API Endpoints:**
- `GET /api/v1/auth/verify-email?token=<token>`
- `POST /api/v1/auth/resend-verification`

**Components:**
- `EmailVerification.tsx`
- `authAPI.verifyEmail()`

---

## Use Case 7: Protected Route Access

**Actor:** User (Authenticated or Not)

**Goal:** Access protected application routes

**Preconditions:**
- User navigates to protected route

**Flow:**
1. User accesses protected route
2. ProtectedRoute component checks authentication
3. Component verifies JWT token exists
4. Component checks token expiration
5. If valid: Render protected component
6. If invalid: Redirect to login with return URL

**Postconditions:**
- Authenticated users access content
- Unauthenticated users redirected to login

**Alternative Flows:**
- **A1:** Token expired → Attempt refresh → If success, continue; If fail, redirect
- **A2:** Insufficient permissions → Redirect to 403 page
- **A3:** After login → Redirect to original requested URL

**API Endpoints:**
- None (client-side check)
- Optionally: `GET /api/v1/auth/me` to verify session

**Components:**
- `ProtectedRoute.tsx`
- `useAuth` hook
- `authStore.isAuthenticated`

---

## Use Case 8: Tenant Selection

**Actor:** User with Multiple Tenant Access

**Goal:** Switch between multiple tenants

**Preconditions:**
- User has access to multiple tenants
- User is authenticated

**Flow:**
1. User clicks tenant selector in header
2. System shows list of accessible tenants
3. User selects different tenant
4. System validates access
5. System generates new JWT with new tenant_id
6. Client updates tenant in store
7. Client refreshes current view with new tenant data
8. UI updates to show selected tenant name

**Postconditions:**
- User context switched to new tenant
- All API calls use new tenant_id
- Data filtered for selected tenant

**Alternative Flows:**
- **A1:** User has only one tenant → Tenant selector hidden
- **A2:** Network error → Keep current tenant, show error

**API Endpoints:**
- `POST /api/v1/auth/switch-tenant`
- `GET /api/v1/tenants/:tenantId`

**Components:**
- `TenantSelector.tsx`
- `useAuth` hook
- `authStore.setTenant()`

---

## Use Case 9: Update User Profile

**Actor:** Authenticated User

**Goal:** Update personal information

**Preconditions:**
- User is authenticated

**Flow:**
1. User navigates to profile page
2. System loads current user data
3. User modifies fields (name, bio, timezone, avatar)
4. User clicks save
5. System validates input
6. System updates user profile
7. System returns updated user data
8. Client updates auth store
9. User sees success message

**Postconditions:**
- User profile updated
- Changes visible immediately

**Alternative Flows:**
- **A1:** Validation error → Show field errors
- **A2:** Avatar upload → Upload to storage first, then update URL

**API Endpoints:**
- `GET /api/v1/auth/me`
- `PUT /api/v1/users/:userId`
- `POST /api/v1/users/:userId/avatar`

**Components:**
- `ProfileSettings.tsx`
- `useAuth` hook
- `usersAPI.update()`

---

## Use Case 10: Change Password

**Actor:** Authenticated User

**Goal:** Update account password

**Preconditions:**
- User is authenticated

**Flow:**
1. User navigates to security settings
2. User clicks "Change Password"
3. User enters current password
4. User enters new password (twice)
5. System validates current password
6. System validates new password strength
7. System validates passwords match
8. System updates password
9. System invalidates all refresh tokens
10. User sees success message
11. User remains logged in with new JWT

**Postconditions:**
- Password updated
- Old sessions invalidated
- Current session remains active

**Alternative Flows:**
- **A1:** Current password wrong → Show error
- **A2:** New password weak → Show requirements
- **A3:** Passwords don't match → Show error

**API Endpoints:**
- `POST /api/v1/auth/change-password`

**Components:**
- `ChangePassword.tsx`
- `authAPI.changePassword()`

---

## Security Considerations

1. **Token Storage:** JWT in httpOnly cookies or secure localStorage
2. **CSRF Protection:** CSRF tokens for state-changing operations
3. **Rate Limiting:** Login attempts limited to 5 per 15 minutes
4. **Password Policy:** Minimum 8 characters, mixed case, numbers, symbols
5. **Session Timeout:** JWT expires in 24 hours, refresh in 30 days
6. **Secure Communication:** All auth requests over HTTPS
7. **Token Rotation:** Refresh tokens rotated on each use

---

## Related Documentation
- [API Routes: Authentication](../../../agile-mind-backend/API%20Docs/Authentication-API%20Routes.md)
- [Components: Auth](../src/components/auth/README.md)
- [Hooks: useAuth](../src/lib/hooks/README.md)
