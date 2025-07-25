# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture Overview

This is a wellness consultation platform built with Next.js 15 App Router. The application has two main user types: **doctors** (healthcare providers) and **users** (patients).

### Tech Stack
- **Frontend**: Next.js 15.2.4 with React 19.0.0 (JavaScript/JSX, no TypeScript)
- **Styling**: Tailwind CSS v4
- **Authentication & Database**: Firebase (Auth + Firestore)
- **Payments**: Stripe
- **Video Consultations**: Agora RTC SDK
- **Animations**: Framer Motion
- **Timezone Handling**: moment-timezone

### Key Directories
- `/src/app/doctor/` - Doctor portal with consultations, user management, and messaging
- `/src/app/user/` - User portal with consultation booking, payment, and store
- `/src/components/` - Shared UI components (Button, TextField, navigation components)
- `/src/lib/firebase.js` - Firebase configuration and initialization

### Environment Variables Required
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_API_ENDPOINT
```

### Important Patterns
1. **Path Aliases**: Use `@/` for imports from src directory (configured in jsconfig.json)
2. **Navigation**: Separate navigation components for doctors (DoctorNav) and users (UserNav)
3. **Authentication**: Firebase Auth is used throughout - check authentication state before accessing protected routes
4. **Real-time Features**: Agora SDK is used for video consultations between doctors and users
5. **Timezone Support**: All scheduling uses moment-timezone to handle doctor/user timezone differences

### Terminology
- **doctor** - Healthcare providers (previously called "expert")
- **user** - Patients/clients (previously called "member" or "patient")
- All database collections and code now use consistent doctor/user terminology

### User Flow
1. **User Onboarding**: 
   - Sign up → Complete health questionnaire → Get matched with doctor
   - Subscription required for consultations
2. **Consultations**: 
   - Schedule based on doctor's availability (with timezone conversion)
   - Video calls via Agora SDK
   - Post-consultation reports
3. **Messaging**: 
   - Users can message their assigned doctor
   - Only available after first consultation is completed
4. **Store**: 
   - Browse and purchase wellness products
   - Cart and checkout with Stripe integration

### Doctor Features
- Schedule management with timezone support
- User management and consultation history
- Video consultations with screen sharing
- Messaging system with assigned users
- Profile verification system

### User Features
- Health questionnaire and doctor matching
- Consultation scheduling with timezone display
- Video consultations
- Messaging with assigned doctor (post-first consultation)
- Store with personalized product recommendations
- Subscription management
- "Things to do" dashboard with dynamic task management

### Health Field Mapping
```javascript
const HEALTH_FIELD_LABELS = {
  general_health: "General Health",
  womens_health: "Women's Health",
  mens_health: "Men's Health",
  muscular_skeletal: "Muscular Skeletal",
  heart_health: "Heart Health",
  skin_hair_health: "Skin & Hair Health",
  mental_emotional_health: "Mental Emotional Health",
  digestive_metabolic: "Digestive & Metabolic",
  oncology: "Oncology",
  disabilities: "Disabilities",
  behavorial: "Behavorial",
  unknown: "General Health"
};
```

### Recent Major Updates
1. **Terminology Refactoring**: All instances of "expert" changed to "doctor" and "member/patient" changed to "user"
2. **Timezone Support**: Added moment-timezone for proper handling of doctor/user timezone differences in scheduling
3. **Home Page Redesign**: Implemented "Things to do" and "What's new" sections with dynamic task management
4. **Health Field Mapping**: Proper translation of health field enums from database to human-readable labels
5. **Directory Structure**: Renamed all directories and routes to use doctor/user terminology

### Current Limitations
- No testing framework configured
- No TypeScript - pure JavaScript/JSX
- Standard Next.js ESLint configuration only

### Pending Features
- Referral system (user and doctor referrals)
- Subscription management system enhancements