# AgileMind Frontend - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd agile-mind-frontend
npm install
```

This will install:
- Next.js 14
- React 18
- Axios (HTTP client)
- Zustand (state management)
- Lucide React (icons)
- Sonner (toast notifications)
- Tailwind CSS (styling)
- TypeScript

### Step 2: Environment Setup

The `.env.local` file is already configured with default values:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_PLATFORM_HOME_URL=http://localhost:3000
NEXT_PUBLIC_AGILEMIND_PLATFORM_URL=http://localhost:3001
```

No changes needed unless you're using different ports!

### Step 3: Start the Applications

Open **two terminal windows**:

**Terminal 1 - Platform Home (Port 3000)**
```bash
npm run dev:home
```

**Terminal 2 - AgileMind Platform (Port 3001)**
```bash
npm run dev
```

### Step 4: Open in Browser

- **Platform Home**: http://localhost:3000
- **AgileMind Platform**: http://localhost:3001

---

## 📱 Test the Complete Flow

### 1. Create Company Account (Tenant Registration)

1. Go to **Platform Home**: http://localhost:3000
2. Click **"Get Started"** button
3. Fill the registration form:
   - **Company Name**: `Test Company`
   - **Email**: `admin@test.com`
   - **Password**: `Test123!@#`
   - **Confirm Password**: `Test123!@#`
4. Click **"Create Account"**
5. ✅ You'll be redirected to the dashboard as Super Admin

### 2. Invite a New User

1. From the dashboard, click **"Invite User"** card
2. Fill the form:
   - **First Name**: `John`
   - **Last Name**: `Doe`
   - **Email**: `john.doe@test.com`
   - **Role**: Select `DEVELOPER`
3. Click **"Send Invitation"**
4. ✅ User created with password: `Johnjohn.doe@123`
5. ✅ Welcome email sent (if SMTP configured in backend)

### 3. New User Login (First Time)

1. Go to **Login**: http://localhost:3001/login
2. Enter credentials:
   - **Email**: `john.doe@test.com`
   - **Password**: `Johnjohn.doe@123`
3. Click **"Sign In"**
4. ✅ Auto-redirected to **Change Password** page
5. Enter:
   - **Current Password**: `Johnjohn.doe@123`
   - **New Password**: `NewPass123!`
   - **Confirm**: `NewPass123!`
6. Click **"Change Password"**
7. ✅ Redirected to dashboard

### 4. View Users

1. Click **"Users"** card on dashboard
2. ✅ See list of all users with roles and status
3. Click **Edit** icon to edit user (placeholder)
4. Click **Delete** icon to delete user (with confirmation)

### 5. Test Forgot Password

1. Go to **Login** page
2. Click **"Forgot password?"**
3. Enter email: `john.doe@test.com`
4. Click **"Send Reset Link"**
5. ✅ See success message: "Check your email"
6. (With SMTP configured, you'll receive reset email)

### 6. Logout

1. Click **"Logout"** button in top right
2. ✅ Redirected to login page
3. ✅ All auth data cleared

---

## 🎯 What Each Port Does

### Port 3000 - Platform Home
- **Purpose**: Public marketing site + tenant registration
- **Pages**:
  - `/` - Landing page with features
  - `/register` - Company registration
  - `/login` - Redirects to port 3001
- **Who uses it**: New companies signing up
- **No authentication required**

### Port 3001 - AgileMind Platform
- **Purpose**: Main application for authenticated users
- **Pages**:
  - `/login` - User login
  - `/dashboard` - Main dashboard
  - `/users` - User management
  - `/users/invite` - Invite users
  - `/auth/change-password` - Change password
  - `/auth/forgot-password` - Request reset
  - `/auth/reset-password` - Reset with token
- **Who uses it**: All users after registration/login
- **Authentication required** (except login, forgot password, reset password)

---

## 🔑 Test Credentials

After registration, you can use these to test:

**Super Admin** (created during registration)
- Email: `admin@test.com`
- Password: `Test123!@#` (or whatever you set)

**Regular User** (after invitation)
- Email: `john.doe@test.com`
- Initial Password: `Johnjohn.doe@123` (auto-generated)
- Must change on first login

---

## ⚠️ Important Notes

### Backend Required

The frontend needs the backend API running on **http://localhost:8000**

If backend is not running, you'll see errors like:
- "Network Error"
- "Failed to fetch"
- "Registration failed"

**Solution**: Start the backend FastAPI server first:
```bash
cd agile-mind-backend
uvicorn app.main:app --reload --port 8000
```

(Note: Backend routes need to be created first!)

### Email Functionality

Welcome emails and password reset emails require:
1. Backend SMTP configuration
2. Gmail App Password set in backend `.env`

Without SMTP:
- User invitation still works
- Passwords still auto-generated
- Emails just won't be sent
- Users can still login with auto-generated passwords

### Password Auto-Generation Format

When you invite a user with:
- First Name: `John`
- Last Name: `Doe`
- Email: `john.doe@company.com`

Password becomes: `Johnjohn.doe@123`

Formula: `{FirstName}{EmailLocalPart}@123`

---

## 🐛 Troubleshooting

### "Cannot connect to API"
- ✅ Check backend is running on port 8000
- ✅ Check `.env.local` has correct API URL
- ✅ Check browser console for exact error

### "lucide-react not found" error
```bash
npm install lucide-react sonner
```

### "Page not found"
- ✅ Make sure you're on the correct port
- ✅ Port 3000 for registration
- ✅ Port 3001 for login and dashboard

### Build errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

### CORS errors
- ✅ Backend must allow `http://localhost:3000` and `http://localhost:3001`
- ✅ Check backend CORS configuration

---

## 📦 NPM Scripts Reference

```bash
# Development
npm run dev          # AgileMind Platform (port 3001)
npm run dev:home     # Platform Home (port 3000)

# Production
npm run build        # Build for production
npm run start        # Run AgileMind Platform (port 3001)
npm run start:home   # Run Platform Home (port 3000)

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

---

## ✅ Features Checklist

After starting both servers, verify these work:

### Platform Home (3000)
- [ ] Landing page loads
- [ ] "Get Started" navigates to registration
- [ ] Registration form validates password in real-time
- [ ] Form shows checkmarks for password requirements
- [ ] Registration creates account and redirects to 3001

### AgileMind Platform (3001)
- [ ] Login page loads
- [ ] Login with valid credentials works
- [ ] Dashboard shows user name and company
- [ ] Super Admin sees all management cards
- [ ] Invite user form works
- [ ] Users list displays all users
- [ ] Change password enforces policy
- [ ] Forgot password sends email (if SMTP configured)
- [ ] Logout clears session

---

## 🎓 Next Steps

1. **Start Backend**: Create FastAPI routes (if not done)
2. **Test Registration**: Create your first company
3. **Invite Users**: Test the auto-password generation
4. **Configure SMTP**: To receive actual emails
5. **Explore Features**: Try all authentication flows

---

## 📞 Need Help?

Check these files for more info:
- `README.md` - Full documentation
- `FRONTEND_IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `package.json` - All available scripts
- `.env.example` - All configuration options

---

**That's it! You're ready to go! 🚀**

Start both servers and open http://localhost:3000 to begin!
