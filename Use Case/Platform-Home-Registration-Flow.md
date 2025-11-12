# Platform Home & AgileMind Registration Flow - Use Case Scenario

## Overview
This document describes the complete registration and authentication flow for the multi-tenant AgileMind SaaS platform, including the separation between Platform Home (landing/registration site) and AgileMind Platform (tenant application).

---

## System Architecture

### Two Separate Applications

1. **Platform Home** (Port 3000)
   - Public landing page
   - Tenant registration
   - Marketing content
   - Get Started flow

2. **AgileMind Platform** (Port 3001)
   - Multi-tenant application
   - Requires authentication
   - Tenant-specific dashboard
   - All features (Sprints, Meetings, Retrospectives, etc.)

---

## Use Case 1: Tenant Registration from Platform Home

### Actors
- **Prospective Customer** - Company representative wanting to register

### Preconditions
- User visits Platform Home (http://localhost:3000)
- User is NOT logged in

### Flow

#### Step 1: Visit Platform Home
```
URL: http://localhost:3000
Page: Landing page with "Get Started" button
```

#### Step 2: Click "Get Started" / "Create Account"
```
Action: User clicks "Get Started" button
Redirect: /register or /get-started page
```

#### Step 3: Tenant Registration Form
```
Form Fields:
┌─────────────────────────────────────────┐
│  Create Your AgileMind Account          │
├─────────────────────────────────────────┤
│  Company Name: [________________]       │
│  Business Email: [________________]     │
│  Password: [________________]           │
│  Confirm Password: [________________]   │
│                                         │
│  [ ] I agree to Terms & Conditions      │
│                                         │
│  [Create Account]                       │
└─────────────────────────────────────────┘
```

**Validation Rules:**
- Company Name: Required, 3-100 characters
- Email: Valid business email format
- Password: Must meet password policy
  - Minimum 8 characters
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 number (0-9)
  - At least 1 symbol (!@#$%^&*)
- Confirm Password: Must match password
- Terms acceptance: Required

#### Step 4: Backend Processing
```
POST /api/v1/platform/register-tenant

Request Body:
{
  "company_name": "Acme Corporation",
  "email": "admin@acme.com",
  "password": "SecurePass123!",
  "password_confirmation": "SecurePass123!"
}

Backend Processing:
1. Validate input data
2. Check if email already exists
3. Validate password policy
4. Generate unique tenant_id (UUID)
5. Hash password (bcrypt)
6. Create tenant record
7. Create super admin user record with role "SUPER_ADMIN"
8. Generate JWT access token (24h) and refresh token (30d)
9. Send welcome email
10. Return response with tokens and tenant info

Response (201 Created):
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "tenant_id": "tn-abc123-xyz789",
    "company_name": "Acme Corporation",
    "user": {
      "user_id": "usr-123456",
      "email": "admin@acme.com",
      "first_name": null,
      "last_name": null,
      "role": "SUPER_ADMIN"
    },
    "tokens": {
      "access_token": "eyJhbGc...",
      "refresh_token": "eyJhbGc...",
      "token_type": "Bearer"
    }
  }
}
```

#### Step 5: Welcome Email Sent
```
To: admin@acme.com
Subject: Welcome to AgileMind - Your Tenant Account is Ready
From: AgileMind Platform <noreply@agilemind.com>

Body:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Welcome to AgileMind Platform!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi Admin,

Your AgileMind tenant account has been successfully created!

Company: Acme Corporation
Tenant ID: tn-abc123-xyz789
Your Role: Super Administrator

Login Details:
--------------
Email: admin@acme.com
Platform URL: http://localhost:3001/login

As a Super Administrator, you can:
✓ Create and manage user roles
✓ Invite team members
✓ Configure tenant settings
✓ Access all platform features

Get Started:
1. Log in to your account
2. Update your profile
3. Create user roles
4. Invite your team members

Need Help?
Visit our Help Center: http://help.agilemind.com
Contact Support: support@agilemind.com

Best regards,
The AgileMind Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Step 6: Automatic Redirect to AgileMind Platform
```
Action: Platform Home redirects user
From: http://localhost:3000/register
To: http://localhost:3001/dashboard

Headers:
- Authorization: Bearer eyJhbGc...
- X-Tenant-ID: tn-abc123-xyz789

Local Storage:
- access_token: eyJhbGc...
- refresh_token: eyJhbGc...
- tenant_id: tn-abc123-xyz789
- user_role: SUPER_ADMIN
```

#### Step 7: Super Admin Dashboard Display
```
Page: Super Admin Dashboard
URL: http://localhost:3001/dashboard

Dashboard Sections:
┌─────────────────────────────────────────┐
│  Welcome, Admin! 👋                      │
│  Acme Corporation                       │
├─────────────────────────────────────────┤
│  Quick Actions:                         │
│  ├─ [Create Roles]                      │
│  ├─ [Invite Users]                      │
│  ├─ [Configure Settings]                │
│  └─ [Start First Sprint]                │
├─────────────────────────────────────────┤
│  Getting Started Checklist:             │
│  [ ] Complete your profile              │
│  [ ] Create user roles                  │
│  [ ] Invite team members                │
│  [ ] Create your first project          │
│  [ ] Set up integrations                │
└─────────────────────────────────────────┘
```

### Postconditions
- Tenant record created in database
- Super admin user created with role "SUPER_ADMIN"
- Welcome email sent
- User logged in to AgileMind Platform
- JWT tokens stored in browser

---

## Use Case 2: Super Admin Creates Roles

### Actors
- **Super Admin** - Tenant administrator

### Preconditions
- User is logged in as Super Admin
- User is on dashboard

### Flow

#### Step 1: Navigate to Roles Management
```
Action: Click "Create Roles" or navigate to /settings/roles
URL: http://localhost:3001/settings/roles
```

#### Step 2: View Default Roles
```
Default System Roles (Pre-created):
┌──────────────────────────────────────────────────────┐
│  Role Name       │ Permissions                       │
├──────────────────────────────────────────────────────┤
│  SUPER_ADMIN     │ Full system access                │
│  PROJECT_MANAGER │ Manage sprints, tasks, team       │
│  SCRUM_MASTER    │ Facilitate meetings, ceremonies   │
│  DEVELOPER       │ Manage tasks, participate         │
│  VIEWER          │ Read-only access                  │
└──────────────────────────────────────────────────────┘
```

#### Step 3: Create Custom Role (Optional)
```
Form:
┌─────────────────────────────────────────┐
│  Create Custom Role                     │
├─────────────────────────────────────────┤
│  Role Name: [________________]          │
│  Description: [________________]        │
│                                         │
│  Permissions:                           │
│  [x] View Sprints                       │
│  [x] Create/Edit Sprints                │
│  [ ] Delete Sprints                     │
│  [x] View Tasks                         │
│  [x] Create/Edit Tasks                  │
│  [x] View Meetings                      │
│  [ ] Manage Users                       │
│  [ ] Manage Roles                       │
│                                         │
│  [Create Role]                          │
└─────────────────────────────────────────┘
```

---

## Use Case 3: Super Admin Invites Users

### Actors
- **Super Admin** - Inviting users
- **New User** - Receiving invitation

### Preconditions
- Super Admin is logged in
- At least one role exists

### Flow

#### Step 1: Navigate to User Management
```
Action: Click "Invite Users" or navigate to /settings/users
URL: http://localhost:3001/settings/users
```

#### Step 2: User Invitation Form
```
Form:
┌─────────────────────────────────────────┐
│  Invite New User                        │
├─────────────────────────────────────────┤
│  First Name: [________________]         │
│  Last Name: [________________]          │
│  Email: [________________]              │
│  Role: [▼ Select Role]                  │
│        - Project Manager                │
│        - Scrum Master                   │
│        - Developer                      │
│        - Viewer                         │
│                                         │
│  [Send Invitation]                      │
└─────────────────────────────────────────┘

Example Input:
- First Name: John
- Last Name: Doe
- Email: john.doe@acme.com
- Role: Developer
```

#### Step 3: Backend Processing
```
POST /api/v1/users/invite

Request Body:
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@acme.com",
  "role": "DEVELOPER"
}

Backend Processing:
1. Validate input
2. Check if user email already exists in tenant
3. Generate temporary password:
   Format: {firstname}{email}@123
   Example: Johnjohn.doe@123
   
   Password Generation Logic:
   - Take first name (capitalize first letter)
   - Take email local part before @
   - Add suffix "@123"
   - Validate against password policy
   - If doesn't meet policy, add symbols: {Firstname}{email}@123!

4. Hash password
5. Create user record with status "PENDING_ACTIVATION"
6. Generate email verification token
7. Send welcome email with credentials
8. Return success response

Response (201 Created):
{
  "success": true,
  "message": "User invited successfully",
  "data": {
    "user_id": "usr-789012",
    "email": "john.doe@acme.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "DEVELOPER",
    "status": "PENDING_ACTIVATION",
    "temporary_password_sent": true
  }
}
```

#### Step 4: Welcome Email to New User
```
To: john.doe@acme.com
Subject: Welcome to AgileMind - Your Login Details
From: AgileMind Platform <noreply@agilemind.com>

Body:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Welcome to AgileMind!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi John Doe,

You've been invited to join Acme Corporation on AgileMind Platform!

Your Login Credentials:
-----------------------
Email: john.doe@acme.com
Temporary Password: Johnjohn.doe@123
Platform URL: http://localhost:3001/login

Your Role: Developer

IMPORTANT - First Login:
------------------------
1. Log in using the credentials above
2. You will be prompted to change your password
3. Create a strong password that meets our security requirements:
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number
   - At least 1 symbol (!@#$%^&*)

Get Started:
1. Log in to your account
2. Complete your profile
3. Explore your dashboard
4. Start collaborating with your team

Need Help?
Visit our Help Center: http://help.agilemind.com
Contact Support: support@agilemind.com

Best regards,
The AgileMind Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Postconditions
- User record created in database
- Temporary password generated and hashed
- Welcome email sent with credentials
- User can log in and must change password

---

## Use Case 4: New User First Login

### Actors
- **New User** - Logging in for the first time

### Preconditions
- User received welcome email
- User has temporary credentials

### Flow

#### Step 1: Navigate to Login Page
```
URL: http://localhost:3001/login

Login Form:
┌─────────────────────────────────────────┐
│  AgileMind Platform                     │
│  Sign In to Your Account                │
├─────────────────────────────────────────┤
│  Email: [________________]              │
│  Password: [________________]           │
│                                         │
│  [ ] Remember me                        │
│  Forgot password?                       │
│                                         │
│  [Sign In]                              │
└─────────────────────────────────────────┘
```

#### Step 2: Enter Credentials
```
Email: john.doe@acme.com
Password: Johnjohn.doe@123
```

#### Step 3: Backend Authentication
```
POST /api/v1/auth/login

Request Body:
{
  "email": "john.doe@acme.com",
  "password": "Johnjohn.doe@123"
}

Backend Processing:
1. Validate email format
2. Find user by email and tenant
3. Check if account is active
4. Verify password hash
5. Check if password is temporary (status = PENDING_ACTIVATION)
6. Generate JWT tokens
7. Log authentication event
8. Return response with password_change_required flag

Response (200 OK):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": "usr-789012",
      "email": "john.doe@acme.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "DEVELOPER",
      "tenant_id": "tn-abc123-xyz789"
    },
    "tokens": {
      "access_token": "eyJhbGc...",
      "refresh_token": "eyJhbGc...",
      "token_type": "Bearer"
    },
    "password_change_required": true
  }
}
```

#### Step 4: Force Password Change
```
Action: System detects password_change_required = true
Redirect: /auth/change-password (before dashboard)

Change Password Form:
┌─────────────────────────────────────────┐
│  Change Your Password                   │
│  For security, please create a new      │
│  password                               │
├─────────────────────────────────────────┤
│  Current Password: [________________]   │
│  New Password: [________________]       │
│  Confirm New Password: [____________]   │
│                                         │
│  Password Requirements:                 │
│  [✓] Minimum 8 characters               │
│  [✓] At least 1 uppercase letter        │
│  [✓] At least 1 lowercase letter        │
│  [✓] At least 1 number                  │
│  [✓] At least 1 symbol                  │
│                                         │
│  [Change Password]                      │
└─────────────────────────────────────────┘
```

#### Step 5: Submit New Password
```
POST /api/v1/auth/change-password

Request Body:
{
  "current_password": "Johnjohn.doe@123",
  "new_password": "MyNewPass123!",
  "new_password_confirmation": "MyNewPass123!"
}

Backend Processing:
1. Verify current password
2. Validate new password against policy
3. Check new password != current password
4. Hash new password
5. Update user password
6. Set status = ACTIVE
7. Clear password_change_required flag
8. Log password change event
9. Send confirmation email

Response (200 OK):
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "password_updated": true,
    "account_activated": true
  }
}
```

#### Step 6: Redirect to Dashboard
```
Action: Automatic redirect after password change
URL: http://localhost:3001/dashboard

User Dashboard:
┌─────────────────────────────────────────┐
│  Welcome, John! 👋                      │
│  Developer at Acme Corporation          │
├─────────────────────────────────────────┤
│  My Tasks (5)                           │
│  Active Sprints (2)                     │
│  Upcoming Meetings (1)                  │
│  Recent Activity                        │
└─────────────────────────────────────────┘
```

### Postconditions
- User password changed from temporary to permanent
- Account status changed to ACTIVE
- User can access dashboard
- Confirmation email sent

---

## Use Case 5: User Changes Password (Settings)

### Actors
- **Authenticated User** - Any logged-in user

### Preconditions
- User is logged in
- User is on settings page

### Flow

#### Step 1: Navigate to Security Settings
```
URL: http://localhost:3001/settings/security

Security Settings Page:
┌─────────────────────────────────────────┐
│  Security Settings                      │
├─────────────────────────────────────────┤
│  Change Password                        │
│  Update your password regularly to      │
│  keep your account secure               │
│                                         │
│  [Change Password]                      │
├─────────────────────────────────────────┤
│  Two-Factor Authentication              │
│  [Enable 2FA]                           │
├─────────────────────────────────────────┤
│  Active Sessions                        │
│  Manage your active sessions            │
└─────────────────────────────────────────┘
```

#### Step 2: Click Change Password
```
Modal/Page:
┌─────────────────────────────────────────┐
│  Change Password                        │
├─────────────────────────────────────────┤
│  Current Password: [________________]   │
│  New Password: [________________]       │
│  Confirm New Password: [____________]   │
│                                         │
│  [Cancel]  [Change Password]            │
└─────────────────────────────────────────┘
```

#### Step 3: Submit and Process
Same as Use Case 4, Step 5

---

## Use Case 6: Forgot Password Flow

### Actors
- **User** - User who forgot password

### Preconditions
- User has registered account
- User cannot log in

### Flow

#### Step 1: Click "Forgot Password" on Login Page
```
URL: http://localhost:3001/login
Action: Click "Forgot password?" link
Redirect: /auth/forgot-password
```

#### Step 2: Enter Email
```
Forgot Password Form:
┌─────────────────────────────────────────┐
│  Forgot Your Password?                  │
│  Enter your email and we'll send you    │
│  a link to reset your password          │
├─────────────────────────────────────────┤
│  Email: [________________]              │
│                                         │
│  [Send Reset Link]                      │
│                                         │
│  Back to login                          │
└─────────────────────────────────────────┘
```

#### Step 3: Backend Processing
```
POST /api/v1/auth/forgot-password

Request Body:
{
  "email": "john.doe@acme.com"
}

Backend Processing:
1. Validate email format
2. Find user by email (don't reveal if exists)
3. If user exists:
   - Generate password reset token (UUID)
   - Set token expiry (1 hour)
   - Save token to database
   - Send reset email
4. Always return success (security best practice)

Response (200 OK):
{
  "success": true,
  "message": "If an account exists, a password reset link has been sent"
}
```

#### Step 4: Password Reset Email
```
To: john.doe@acme.com
Subject: AgileMind - Password Reset Request
From: AgileMind Platform <noreply@agilemind.com>

Body:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Password Reset Request
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi John,

We received a request to reset your password for your AgileMind account.

Click the link below to reset your password:

http://localhost:3001/auth/reset-password?token=abc123xyz789

This link will expire in 1 hour.

If you didn't request this, please ignore this email.
Your password will remain unchanged.

Best regards,
The AgileMind Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Step 5: Click Reset Link
```
URL: http://localhost:3001/auth/reset-password?token=abc123xyz789

Reset Password Form:
┌─────────────────────────────────────────┐
│  Reset Your Password                    │
├─────────────────────────────────────────┤
│  New Password: [________________]       │
│  Confirm New Password: [____________]   │
│                                         │
│  Password Requirements:                 │
│  [✓] Minimum 8 characters               │
│  [ ] At least 1 uppercase letter        │
│  [ ] At least 1 lowercase letter        │
│  [ ] At least 1 number                  │
│  [ ] At least 1 symbol                  │
│                                         │
│  [Reset Password]                       │
└─────────────────────────────────────────┘
```

#### Step 6: Submit New Password
```
POST /api/v1/auth/reset-password

Request Body:
{
  "token": "abc123xyz789",
  "new_password": "NewSecurePass123!",
  "new_password_confirmation": "NewSecurePass123!"
}

Backend Processing:
1. Validate token exists and not expired
2. Validate new password against policy
3. Find user by token
4. Hash new password
5. Update user password
6. Invalidate reset token
7. Log password reset event
8. Send confirmation email

Response (200 OK):
{
  "success": true,
  "message": "Password reset successful. You can now log in."
}
```

#### Step 7: Redirect to Login
```
Action: Show success message and redirect
URL: http://localhost:3001/login
Message: "Password reset successful. Please log in with your new password."
```

### Postconditions
- Password reset token invalidated
- User password updated
- User can log in with new password
- Confirmation email sent

---

## Database Schema

### Tables Required

#### 1. tenants
```sql
CREATE TABLE tenants (
    tenant_id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    status ENUM('ACTIVE', 'SUSPENDED', 'TRIAL') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
);
```

#### 2. users
```sql
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    status ENUM('PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED') DEFAULT 'PENDING_ACTIVATION',
    password_change_required BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    UNIQUE KEY unique_email_per_tenant (tenant_id, email),
    INDEX idx_email (email),
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status)
);
```

#### 3. password_reset_tokens
```sql
CREATE TABLE password_reset_tokens (
    token_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);
```

#### 4. audit_logs
```sql
CREATE TABLE audit_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50),
    event_type VARCHAR(100) NOT NULL,
    event_data JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_tenant (tenant_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);
```

---

## Password Policy Implementation

### Configuration (.env)
```
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=true
DEFAULT_PASSWORD_SUFFIX=@123
```

### Auto-Generated Password Format
```
Format: {FirstName}{EmailLocalPart}@123

Examples:
- John Doe (john.doe@acme.com) → Johnjohn.doe@123
- Sarah Smith (sarah@acme.com) → Sarahsarah@123
- Mike Johnson (mike.j@acme.com) → Mikemike.j@123

If doesn't meet policy, add symbol:
→ Johnjohn.doe@123!
```

### Validation Function (Python)
```python
import re

def validate_password(password: str) -> tuple[bool, list[str]]:
    """
    Validate password against policy.
    Returns (is_valid, errors)
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters")
    
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r"\d", password):
        errors.append("Password must contain at least one number")
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        errors.append("Password must contain at least one symbol")
    
    return (len(errors) == 0, errors)
```

---

## Email Templates Location

Create these files:
```
agile-mind-backend/
└── app/
    └── templates/
        └── emails/
            ├── tenant_welcome.html
            ├── user_welcome.html
            ├── password_reset.html
            └── password_changed.html
```

---

## Security Considerations

1. **Password Hashing**: Use bcrypt with cost factor 12
2. **JWT Tokens**: Short-lived access (24h), long refresh (30d)
3. **Rate Limiting**: 5 login attempts per 15 minutes
4. **Password Reset**: Tokens expire in 1 hour
5. **HTTPS Only**: All cookies marked secure in production
6. **CSRF Protection**: Implement CSRF tokens for state-changing operations
7. **SQL Injection**: Use parameterized queries
8. **XSS Protection**: Sanitize all user inputs

---

## Next Steps

1. ✅ Environment files created
2. ⏭️ Create email templates
3. ⏭️ Implement authentication API endpoints
4. ⏭️ Create Platform Home frontend (Port 3000)
5. ⏭️ Create AgileMind Platform frontend (Port 3001)
6. ⏭️ Implement user management APIs
7. ⏭️ Set up SMTP email service
8. ⏭️ Create database migration scripts

---

**This use case scenario is ready for implementation!** 🚀
