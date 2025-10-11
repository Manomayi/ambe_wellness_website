# Authentication and Authorization

**Last Updated**: October 2025

Complete documentation of the authentication and authorization system for the Ambé Wellness platform, including Firebase Authentication integration, user type detection, protected routes, and access control.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [AuthContext](#authcontext)
4. [User Types](#user-types)
5. [Sign Up Flow](#sign-up-flow)
6. [Login Flow](#login-flow)
7. [Protected Routes](#protected-routes)
8. [Password Reset](#password-reset)
9. [Session Management](#session-management)
10. [Role-Based Access Control](#role-based-access-control)
11. [Security Best Practices](#security-best-practices)
12. [Code Examples](#code-examples)

---

## Overview

The platform uses **Firebase Authentication** for user identity management combined with **Firestore** for profile data and role determination.

### Key Features

- Email/password authentication
- Automatic user type detection (user vs doctor)
- Real-time profile synchronization
- Protected route guards
- Session persistence
- Password reset functionality
- Role-based access control

### Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

User enters credentials
         │
         ▼
Firebase Authentication
         │
         ├──── Success ────┐
         │                 │
         └──── Error ──────┼──── Show Error Message
                           │
                           ▼
         Check Firestore: /doctors/{uid} exists?
                           │
                ┌──────────┴──────────┐
                │                     │
             YES (Doctor)          NO (User)
                │                     │
                ▼                     ▼
      Load /doctors/{uid}    Load /users/{uid}
                │                     │
                └──────────┬──────────┘
                           │
                           ▼
              Set up real-time listener
                           │
                           ▼
            Navigate to appropriate dashboard
         (/doctor/home or /user/home)
```

---

## Architecture

### Components

1. **Firebase Auth**: Handles user authentication
2. **AuthContext**: React context for auth state
3. **ProtectedRoute**: Route guard component
4. **Firestore**: Stores user profiles and roles

### File Structure

```
src/
├── contexts/
│   └── AuthContext.jsx           # Auth state management
├── components/
│   └── common/
│       └── ProtectedRoute.jsx    # Route protection
├── app/
│   ├── (auth)/
│   │   ├── login/page.jsx        # Login page
│   │   └── signup/page.jsx       # Signup page
│   └── (dashboard)/              # Protected routes
└── lib/
    └── firebase/
        └── config.js              # Firebase initialization
```

---

## AuthContext

### Location
`src/contexts/AuthContext.jsx:1`

### Purpose

Centralized authentication state management using React Context API. Provides auth state and methods to all components.

### Provider Implementation

```javascript
// src/contexts/AuthContext.jsx

"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe;

    // Listen to authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is doctor
        const doctorDoc = await getDoc(doc(db, 'doctors', user.uid));
        const isDoctor = doctorDoc.exists();

        setUser(user);
        setUserType(isDoctor ? 'doctor' : 'user');

        // Set up real-time profile listener
        profileUnsubscribe = onSnapshot(
          doc(db, isDoctor ? 'doctors' : 'users', user.uid),
          (doc) => {
            if (doc.exists()) {
              setProfile({ uid: doc.id, ...doc.data() });
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching profile:', error);
            setProfile(null);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setUserType(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Cleanup
    return () => {
      unsubscribeAuth();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  // Authentication methods
  const signIn = async (email, password) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    // Check user type
    const doctorDoc = await getDoc(doc(db, 'doctors', user.uid));
    const isDoctor = doctorDoc.exists();

    // Return user type for routing
    return isDoctor ? 'doctor' : 'user';
  };

  const signUp = async (email, password, userType) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    return user;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const isDoctor = userType === 'doctor';
  const isVerifiedDoctor = isDoctor && profile?.verification_status === 'Verified';

  return (
    <AuthContext.Provider value={{
      user,
      userType,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      isDoctor,
      isVerifiedDoctor,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| **user** | Object | Firebase Auth user object |
| **userType** | String | `"doctor"` or `"user"` |
| **profile** | Object | Firestore profile data (real-time) |
| **loading** | Boolean | True while checking auth state |
| **isDoctor** | Boolean | Convenience flag for doctor check |
| **isVerifiedDoctor** | Boolean | True if doctor is verified |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| **signIn** | email, password | Promise<string> | Returns user type ("doctor"/"user") |
| **signUp** | email, password, userType | Promise<User> | Creates new account |
| **signOut** | none | Promise<void> | Signs out current user |
| **resetPassword** | email | Promise<void> | Sends password reset email |

### Usage in Components

```javascript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, profile, userType, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {profile?.first_name}!</p>
      <p>User Type: {userType}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

---

## User Types

The platform supports two distinct user types:

### 1. Users (Patients/Clients)

**Identification**:
- Document exists in `/users/{uid}` collection
- Does NOT exist in `/doctors/{uid}` collection

**Access**:
- User portal routes (`/user/*`)
- Store and checkout
- Consultations as patient
- Messaging with assigned doctor

### 2. Doctors (Healthcare Providers)

**Identification**:
- Document exists in `/doctors/{uid}` collection
- Has `verification_status` field

**Access**:
- Doctor portal routes (`/doctor/*`)
- User management
- Consultation scheduling
- Report creation
- Messaging with assigned users

### User Type Detection Flow

```javascript
// In AuthContext.jsx:28-33

const doctorDoc = await getDoc(doc(db, 'doctors', user.uid));
const isDoctor = doctorDoc.exists();

setUser(user);
setUserType(isDoctor ? 'doctor' : 'user');
```

**Logic**:
1. When user authenticates, check if document exists in `doctors` collection
2. If exists → User is a **doctor**
3. If not exists → User is a **patient/user**

---

## Sign Up Flow

### Sign Up Page

**Location**: `src/app/(auth)/signup/page.jsx:1`

### Process

```
User fills form (email, password, user type)
         │
         ▼
Create Firebase Auth account
         │
         ▼
Cloud Function (or manual process) creates Firestore document
         │
         ├──── User Type: "user"
         │          │
         │          └──── Create /users/{uid} document
         │
         └──── User Type: "doctor"
                    │
                    └──── Create /doctors/{uid} document
                              └──── Set verification_status: "Pending"
```

### Implementation Example

```javascript
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('user'); // 'user' or 'doctor'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create Firebase Auth account
      await signUp(email, password, userType);

      // Profile creation handled by cloud function or separate logic
      // For now, redirect to onboarding
      router.push(userType === 'doctor' ? '/doctor/home' : '/user/get-matched');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup}>
      {/* Form fields */}
    </form>
  );
}
```

### Post-Signup Actions

**For Users:**
1. Create document in `/users/{uid}`
2. Initialize profile fields:
   - `is_free_questionnaire_completed: false`
   - `is_consultation_set: false`
   - `is_first_consultation_completed: false`
3. Redirect to questionnaire (`/user/menu/questionnaire`)

**For Doctors:**
1. Create document in `/doctors/{uid}`
2. Set `verification_status: "Pending"`
3. Redirect to verification page (`/doctor/menu/verification`)

---

## Login Flow

### Login Page

**Location**: `src/app/(auth)/login/page.jsx:1`

### Process

```
User enters email + password
         │
         ▼
Firebase Authentication
         │
         ├──── Success ────┐
         │                 │
         └──── Error ──────┼──── Display error message
                           │
                           ▼
         signIn() returns user type
                           │
                ┌──────────┴──────────┐
                │                     │
           "doctor"                "user"
                │                     │
                ▼                     ▼
       /doctor/home              /user/home
```

### Implementation

```javascript
// src/app/(auth)/login/page.jsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // signIn returns user type
      const userType = await signIn(email, password);

      // Navigate based on user type
      router.push(userType === 'doctor' ? '/doctor/home' : '/user/home');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Email input */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />

      {/* Password input */}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      {/* Error message */}
      {error && <p className="text-red-600">{error}</p>}

      {/* Submit button */}
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## Protected Routes

### ProtectedRoute Component

**Location**: `src/components/common/ProtectedRoute.jsx:1`

### Purpose

Wrapper component that ensures:
1. User is authenticated
2. User has correct role for the route
3. Redirects unauthenticated users to login
4. Redirects wrong role to their home

### Implementation

```javascript
// src/components/common/ProtectedRoute.jsx

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children, userType = null }) {
  const router = useRouter();
  const { user, loading, userType: authUserType } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Not authenticated → redirect to login
      if (!user) {
        router.push('/login');
      }
      // Wrong user type → redirect to their home
      else if (userType && authUserType !== userType) {
        router.push(authUserType === 'doctor' ? '/doctor/home' : '/user/home');
      }
    }
  }, [user, loading, userType, authUserType, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated or wrong role
  if (!user || (userType && authUserType !== userType)) {
    return null;
  }

  // Render protected content
  return children;
}
```

### Usage Examples

#### Protect Any User Route

```javascript
// src/app/(dashboard)/user/home/page.jsx

import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function UserHomePage() {
  return (
    <ProtectedRoute userType="user">
      <div>
        {/* User-only content */}
      </div>
    </ProtectedRoute>
  );
}
```

#### Protect Any Doctor Route

```javascript
// src/app/(dashboard)/doctor/dashboard/page.jsx

import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function DoctorDashboard() {
  return (
    <ProtectedRoute userType="doctor">
      <div>
        {/* Doctor-only content */}
      </div>
    </ProtectedRoute>
  );
}
```

#### Protect Without Role Check

```javascript
// Requires authentication but allows any user type
export default function SharedPage() {
  return (
    <ProtectedRoute>
      <div>
        {/* Content for any authenticated user */}
      </div>
    </ProtectedRoute>
  );
}
```

---

## Password Reset

### Process Flow

```
User clicks "Forgot Password"
         │
         ▼
Enters email address
         │
         ▼
Firebase sends password reset email
         │
         ▼
User clicks link in email
         │
         ▼
Firebase hosted reset page
         │
         ▼
User enters new password
         │
         ▼
Password updated → Can log in
```

### Implementation

```javascript
import { useAuth } from '@/contexts/AuthContext';

function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      console.error(err);
      setError('Failed to send reset email. Check your email address.');
    }
  };

  if (sent) {
    return (
      <div>
        <p>Password reset email sent! Check your inbox.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleReset}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      {error && <p className="text-red-600">{error}</p>}
      <button type="submit">Send Reset Email</button>
    </form>
  );
}
```

---

## Session Management

### Session Persistence

Firebase Auth automatically persists sessions using:
- **localStorage** (default): Session persists across tabs and browser restarts
- **sessionStorage**: Session only for current tab
- **memory**: Session lost on page refresh

### Current Configuration

```javascript
// Default: localStorage persistence (automatic)
// Sessions persist indefinitely until user logs out
```

### Session Lifecycle

```
User logs in
     ↓
Auth token stored in localStorage
     ↓
Token refreshed automatically by Firebase
     ↓
User navigates app (token valid)
     ↓
User logs out OR token expires
     ↓
Session cleared
```

### Token Expiration

- Firebase Auth tokens expire after **1 hour**
- Firebase SDK automatically refreshes tokens
- No manual token management required

### Logout

```javascript
import { useAuth } from '@/contexts/AuthContext';

function LogoutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return <button onClick={handleLogout}>Log Out</button>;
}
```

---

## Role-Based Access Control

### Access Control Matrix

| Route Pattern | User | Doctor | Public |
|---------------|------|--------|--------|
| `/` | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ |
| `/signup` | ✅ | ✅ | ✅ |
| `/user/*` | ✅ | ❌ | ❌ |
| `/doctor/*` | ❌ | ✅ | ❌ |
| `/user/store` | ✅ | ❌ | ❌ |
| `/user/cart` | ✅ | ❌ | ❌ |
| `/doctor/dashboard` | ❌ | ✅ | ❌ |
| `/doctor/users` | ❌ | ✅ | ❌ |

### Route Group Structure

```
app/
├── (public)/              # No authentication required
│   ├── page.js
│   ├── membership/
│   └── enterprise/
│
├── (auth)/                # Authentication pages
│   ├── login/
│   └── signup/
│
└── (dashboard)/           # Protected routes
    ├── user/              # User-only routes
    └── doctor/            # Doctor-only routes
```

### Conditional Rendering Based on Role

```javascript
import { useAuth } from '@/contexts/AuthContext';

function ConditionalContent() {
  const { userType, isVerifiedDoctor } = useAuth();

  if (userType === 'doctor') {
    return (
      <div>
        <h1>Doctor Dashboard</h1>
        {isVerifiedDoctor ? (
          <p>You are verified and can see users</p>
        ) : (
          <p>Your verification is pending</p>
        )}
      </div>
    );
  }

  if (userType === 'user') {
    return (
      <div>
        <h1>User Dashboard</h1>
        <p>Browse products and book consultations</p>
      </div>
    );
  }

  return null;
}
```

---

## Security Best Practices

### 1. Never Store Sensitive Data Client-Side

```javascript
// ❌ BAD: Storing tokens manually
localStorage.setItem('authToken', token);

// ✅ GOOD: Let Firebase handle tokens
// Firebase automatically manages tokens securely
```

### 2. Always Use HTTPS in Production

```javascript
// Configured in hosting platform (Vercel, etc.)
// Firebase Auth requires HTTPS in production
```

### 3. Validate on Backend

```javascript
// Client-side checks are for UX only
// Always validate permissions on backend (Firestore rules)
```

### 4. Implement Proper Firestore Rules

```javascript
// See DATABASE_STRUCTURE.md for complete rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

### 5. Rate Limiting

Firebase Auth has built-in rate limiting:
- **100 requests per second** per IP
- **6 login attempts per IP per hour** (with exponential backoff)

### 6. Email Verification (Optional Enhancement)

```javascript
import { sendEmailVerification } from 'firebase/auth';

// After signup
await sendEmailVerification(user);

// Check verification status
if (user.emailVerified) {
  // Allow full access
} else {
  // Show verification required message
}
```

---

## Code Examples

### Complete Login Component

```javascript
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userType = await signIn(email, password);
      router.push(userType === 'doctor' ? '/doctor/home' : '/user/home');
    } catch (err) {
      console.error(err);

      // User-friendly error messages
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-green-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### Using Auth State in Dashboard

```javascript
"use client";

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function UserDashboard() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute userType="user">
      <div>
        <h1>Welcome, {profile?.first_name}!</h1>
        <p>Email: {user.email}</p>
        <p>Member since: {new Date(user.metadata.creationTime).toLocaleDateString()}</p>

        {profile?.subscription?.active && (
          <div className="bg-green-100 p-4 rounded">
            <p>✅ Active Subscription</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
```

---

## Troubleshooting

### Issue: User redirected to login after refresh

**Cause**: Loading state not handled properly

**Solution**:
```javascript
const { user, loading } = useAuth();

if (loading) {
  return <LoadingSpinner />;
}

if (!user) {
  return <Navigate to="/login" />;
}
```

### Issue: Profile data not available

**Cause**: Profile not synced from Firestore

**Solution**:
```javascript
const { user, profile } = useAuth();

// Always check both user AND profile
if (user && profile) {
  // Profile is loaded
} else if (user && !profile) {
  // Profile document might not exist
  console.error('User has no profile document');
}
```

### Issue: Wrong redirect after login

**Cause**: User type not correctly detected

**Solution**:
```javascript
// Ensure doctor document exists before treating as doctor
const doctorDoc = await getDoc(doc(db, 'doctors', user.uid));
const isDoctor = doctorDoc.exists() && doctorDoc.data();
```

---

## Related Documentation

- [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) - Firestore collections and security rules
- [USER_PORTAL.md](./USER_PORTAL.md) - User features and flows
- [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md) - Doctor features and flows
- [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md) - Firebase configuration

---

**Authentication documentation complete!** For implementation details of specific features, refer to the related documentation.
