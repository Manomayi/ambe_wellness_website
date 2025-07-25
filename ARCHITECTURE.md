# Project Architecture

## Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication route group
│   │   ├── login/                # Login page
│   │   └── signup/               # Signup page
│   ├── (dashboard)/              # Dashboard route group (requires auth)
│   │   ├── doctor/               # Doctor portal
│   │   │   ├── consultations/    # Consultation management
│   │   │   │   ├── appointment/  # Individual appointment pages
│   │   │   │   ├── history/      # Consultation history
│   │   │   │   └── report/       # Consultation reports
│   │   │   ├── messages/         # Messaging with users
│   │   │   ├── schedule/         # Schedule management
│   │   │   ├── users/            # User management
│   │   │   ├── dashboard/        # Doctor dashboard
│   │   │   ├── home/             # Doctor home
│   │   │   └── menu/             # Doctor settings/profile
│   │   └── user/                 # User portal
│   │       ├── cart/             # Shopping cart
│   │       ├── checkout/         # Checkout flow
│   │       │   ├── payment/      # Stripe payment page
│   │       │   └── success/      # Payment success page
│   │       ├── consult/          # Consultation features
│   │       │   ├── appointment/  # Appointment video call
│   │       │   ├── history/      # Consultation history
│   │       │   ├── message_doctor/ # Messaging with doctor
│   │       │   ├── report/       # View consultation reports
│   │       │   └── schedule/     # Schedule consultations
│   │       ├── get-matched/      # Doctor matching flow
│   │       ├── home/             # User dashboard
│   │       ├── menu/             # User settings/profile
│   │       │   ├── questionnaire/ # Health questionnaire
│   │       │   └── purchase_history/ # Order history
│   │       ├── notifications/    # User notifications
│   │       ├── payment/          # Subscription payment
│   │       ├── referral/         # Referral program
│   │       └── store/            # Product store
│   ├── globals.css               # Global styles
│   ├── layout.js                 # Root layout
│   └── page.js                   # Landing page
│
├── components/                   # Reusable components
│   ├── common/                   # Generic UI components
│   │   ├── Button.jsx            # Styled button component
│   │   ├── TextField.jsx         # Styled input component
│   │   └── ProtectedRoute.jsx   # Auth protection wrapper
│   ├── navigation/               # Navigation components
│   │   ├── DoctorNav.jsx         # Doctor portal navigation
│   │   └── UserNav.jsx           # User portal navigation
│   ├── auth/                     # Authentication components
│   │   ├── ClientAuthProvider.jsx # Auth context provider
│   │   └── UserOnboarding.jsx    # New user onboarding flow
│   ├── chat/                     # Chat components
│   │   └── ChatWindow.jsx        # Real-time chat interface
│   ├── video/                    # Video call components
│   │   └── VideoCall.jsx         # Agora video call component
│   └── user/                     # User-specific components
│       └── GetMatched.jsx        # Doctor matching component
│
├── contexts/                     # React contexts
│   └── AuthContext.jsx           # Authentication context
│
├── lib/                          # Libraries and utilities
│   ├── firebase/                 # Firebase configuration
│   │   └── config.js             # Firebase initialization
│   └── utils/                    # Utility functions (future)
│
├── hooks/                        # Custom React hooks (future)
│
└── styles/                       # Additional styles (future)
```

## Route Groups

### (auth)
- **Purpose**: Contains authentication-related pages
- **Access**: Public (no authentication required)
- **Layout**: Minimal layout without navigation bars
- **Pages**: 
  - `/login` - User and doctor login
  - `/signup` - New user registration

### (dashboard)
- **Purpose**: Contains all authenticated user areas
- **Access**: Protected (requires authentication)
- **Layout**: Includes navigation components (DoctorNav or UserNav)
- **Structure**: Split between doctor and user portals

## Component Organization

### Common Components (`/components/common/`)
- Reusable UI components used throughout the app
- Examples: Button, TextField, ProtectedRoute
- No business logic, purely presentational

### Navigation Components (`/components/navigation/`)
- Portal-specific navigation bars
- DoctorNav: Used in doctor portal with specific menu items
- UserNav: Used in user portal with user-specific navigation

### Auth Components (`/components/auth/`)
- Authentication-related components
- ClientAuthProvider: Wraps the app with auth context
- UserOnboarding: New user questionnaire flow

### Feature Components
- Chat: Real-time messaging components
- Video: Video consultation components using Agora SDK
- User: User-specific components like doctor matching

## State Management

### Authentication Context
- Provides user authentication state throughout the app
- Manages user profile data
- Handles authentication flow

### Local State
- Component-level state for UI interactions
- Form management
- Loading states

## Data Flow

1. **Authentication**:
   - Firebase Auth handles user authentication
   - AuthContext provides user state to components
   - ProtectedRoute component enforces access control

2. **Real-time Data**:
   - Firestore listeners for real-time updates
   - Chat messages use onSnapshot for live updates
   - Appointment status updates in real-time

3. **Payments**:
   - Stripe integration for subscriptions and store purchases
   - Cloud functions handle payment processing
   - Client-side only handles payment UI

## Key Design Decisions

1. **Route Groups**: 
   - Separation of auth and dashboard layouts
   - Better code organization and layout management
   - Follows Next.js 13+ best practices

2. **Component Structure**:
   - Organized by function rather than feature
   - Promotes reusability
   - Clear separation of concerns

3. **Firebase Architecture**:
   - Centralized configuration in `/lib/firebase/config.js`
   - Direct Firestore access from components
   - Real-time listeners for live data

4. **Protected Routes**:
   - ProtectedRoute component wraps all authenticated pages
   - Handles redirect logic for unauthenticated users
   - Different protection for doctor vs user portals

5. **Terminology Consistency**:
   - "doctor" for healthcare providers
   - "user" for patients/clients
   - Consistent naming throughout codebase

## Security Considerations

1. **Authentication**:
   - Firebase Auth handles secure authentication
   - Protected routes prevent unauthorized access
   - Role-based access (doctor vs user)

2. **Data Access**:
   - Firestore security rules enforce data access
   - Users can only access their own data
   - Doctors can access assigned user data

3. **Payment Security**:
   - Stripe handles all payment processing
   - No credit card data stored in app
   - Cloud functions for secure payment intent creation

## Performance Optimizations

1. **Code Splitting**:
   - Next.js automatic code splitting
   - Route-based splitting with route groups
   - Dynamic imports where needed

2. **Real-time Updates**:
   - Firestore listeners only where needed
   - Proper cleanup of listeners
   - Optimistic UI updates

3. **Image Optimization**:
   - Next.js Image component for optimized images
   - Lazy loading of images
   - Proper image sizing

## Future Considerations

1. **Testing**:
   - Add testing framework (Jest, React Testing Library)
   - Component tests
   - Integration tests

2. **TypeScript**:
   - Consider migration to TypeScript
   - Better type safety
   - Improved developer experience

3. **State Management**:
   - Consider global state solution if needed
   - Redux or Zustand for complex state
   - Currently using Context API which is sufficient

4. **API Layer**:
   - Abstract Firestore calls to custom hooks
   - Better separation of data logic
   - Easier testing and maintenance