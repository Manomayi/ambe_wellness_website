# Architecture Documentation

**Last Updated**: October 2025

Technical architecture and design patterns for the Ambé Wellness platform.

---

## System Architecture

### High-Level Overview

```
┌────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                   Next.js 15 App Router                     │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐      │
│  │   Public    │  │  Auth Routes │  │  Dashboard  │      │
│  │   Routes    │  │              │  │   Routes    │      │
│  └─────────────┘  └──────────────┘  └─────────────┘      │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│                   CONTEXT PROVIDERS                         │
│  • AuthContext (authentication & user state)               │
│  • Real-time listeners (Firestore)                         │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│                    SERVICES LAYER                           │
│  ┌──────────┐  ┌─────────┐  ┌──────────┐                 │
│  │ Firebase │  │ Stripe  │  │  Agora   │                 │
│  └──────────┘  └─────────┘  └──────────┘                 │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│  • Firestore (NoSQL database)                              │
│  • Firebase Storage (files/images)                         │
│  • Real-time synchronization                               │
└────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
ambe_wellness_website/
├── public/
│   ├── images/              # Static images
│   ├── fonts/               # Custom fonts
│   └── videos/              # Video files
│
├── src/
│   ├── app/
│   │   ├── (auth)/          # Auth route group
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/     # Protected route group
│   │   │   ├── doctor/      # Doctor portal
│   │   │   └── user/        # User portal
│   │   ├── layout.js        # Root layout
│   │   ├── page.js          # Homepage
│   │   └── globals.css      # Global styles
│   │
│   ├── components/
│   │   ├── auth/            # Auth components
│   │   ├── chat/            # Messaging components
│   │   ├── common/          # Shared components
│   │   ├── navigation/      # Navigation bars
│   │   ├── user/            # User-specific components
│   │   └── video/           # Video call components
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx  # Global auth state
│   │
│   └── lib/
│       ├── firebase/
│       │   └── config.js    # Firebase initialization
│       └── design-tokens.js # Design system
│
├── docs/                    # This documentation
├── CLAUDE.md               # Project instructions
└── package.json            # Dependencies
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.2.4 | React framework |
| React | 19.0.0 | UI library |
| Tailwind CSS | 4.0 | Styling |
| Framer Motion | 12.10.0 | Animations |
| Heroicons | 2.2.0 | Icons |

### Backend & Services

| Service | Purpose |
|---------|---------|
| Firebase Auth | Authentication |
| Firestore | Database |
| Firebase Storage | File storage |
| Stripe | Payments |
| Agora RTC SDK | Video calls |

---

## Design Patterns

### 1. Route Groups

Next.js 13+ route groups for layout organization:

```
app/
├── (auth)/        # Auth layout
├── (dashboard)/   # Dashboard layout
└── (public)/      # Public layout (implicit)
```

### 2. Protected Routes

HOC pattern for route protection:

```javascript
<ProtectedRoute userType="user">
  {children}
</ProtectedRoute>
```

### 3. Real-time Data

Firestore snapshots for live updates:

```javascript
onSnapshot(docRef, (snapshot) => {
  setData(snapshot.data());
});
```

### 4. Dual Storage

Appointments and messages stored in both user and doctor collections for efficient queries.

---

## Data Flow

### User Login Flow

```
User enters credentials
  ↓
Firebase Authentication
  ↓
Check Firestore for doctor document
  ↓
Set userType ("doctor" or "user")
  ↓
Real-time profile listener
  ↓
Navigate to appropriate dashboard
```

### Appointment Creation Flow

```
User selects time slot
  ↓
Create in /users/{uid}/appointments_upcoming
  ↓
Mirror in /doctors/{uid}/appointments_upcoming
  ↓
Send notifications
  ↓
Real-time updates on both sides
```

---

## State Management

### AuthContext

Global authentication state using React Context API.

**State**:
- `user`: Firebase Auth user
- `userType`: "doctor" | "user"
- `profile`: Firestore profile data
- `loading`: Boolean

**Methods**:
- `signIn(email, password)`
- `signUp(email, password, userType)`
- `signOut()`
- `resetPassword(email)`

---

## Performance Optimizations

1. **Server Components**: Use Next.js server components where possible
2. **Image Optimization**: Next.js Image component
3. **Code Splitting**: Automatic with Next.js App Router
4. **Real-time Queries**: Limit listeners, unsubscribe on unmount
5. **Caching**: Firestore persistence enabled

---

## Security

1. **Firebase Auth**: Secure authentication
2. **Firestore Rules**: Role-based access control
3. **Environment Variables**: Secrets in `.env.local`
4. **HTTPS**: Required in production
5. **Input Validation**: Client and server-side

---

## Deployment

### Recommended: Vercel

1. Connect Git repository
2. Configure environment variables
3. Auto-deploy on push

### Build Process

```bash
npm run build  # Creates optimized production build
```

---

## Related Documentation

- [OVERVIEW.md](./OVERVIEW.md) - Project overview
- [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md) - Setup guide
- [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) - Data architecture

---

**Architecture documentation complete!**
