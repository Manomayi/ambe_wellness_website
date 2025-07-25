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

This is a wellness consultation platform built with Next.js 15 App Router. The application has two main user types: **doctors** (healthcare providers) and **users** (patients seeking consultations).

### Tech Stack
- **Frontend**: Next.js 15.2.4 with React 19.0.0 (JavaScript/JSX, no TypeScript)
- **Styling**: Tailwind CSS v4
- **Authentication & Database**: Firebase (Auth + Firestore)
- **Payments**: Stripe
- **Video Consultations**: Agora RTC SDK
- **Animations**: Framer Motion
- **Timezone Handling**: moment-timezone

### Project Structure
```
src/
├── app/
│   ├── (auth)/                # Authentication route group
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/           # Protected routes
│   │   ├── doctor/
│   │   └── user/
│   └── globals.css
├── components/
│   ├── common/               # Shared UI components
│   ├── navigation/           # Nav components
│   ├── auth/                 # Auth components
│   ├── chat/                 # Chat components
│   └── video/                # Video components
├── contexts/                 # React contexts
├── lib/
│   └── firebase/
│       └── config.js        # Firebase configuration
└── styles/
```

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
2. **Route Groups**: Using Next.js 13+ route groups for layout separation
3. **Navigation**: Separate navigation components for doctors (DoctorNav) and users (UserNav)
4. **Authentication**: Firebase Auth is used throughout - check authentication state before accessing protected routes
5. **Real-time Features**: Agora SDK is used for video consultations between doctors and users
6. **Timezone Support**: All scheduling uses moment-timezone to handle doctor/user timezone differences

### Terminology
- **doctor** - Healthcare providers offering consultations
- **user** - Patients/clients seeking wellness consultations
- All database collections, components, and routes use consistent doctor/user terminology

### User Flow
1. **User Onboarding**: 
   - Sign up → Complete health questionnaire → Get matched with doctor
   - Subscription required for consultations ($50/month)
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
   - Subscription discounts ($50 off) and referral discounts (25%)
5. **Referral Program**:
   - Users get unique referral codes
   - Both referrer and referee get 25% off next order
   - Track referral stats and available credits

### Doctor Features
- Dashboard with consultation overview
- Schedule management with timezone support
- User management and consultation history
- Video consultations with screen sharing
- Messaging system with assigned users
- Profile verification system
- Feedback and ratings from users

### User Features
- Health questionnaire and doctor matching
- Consultation scheduling with timezone display
- Video consultations
- Messaging with assigned doctor (post-first consultation)
- Store with personalized product recommendations
- Subscription management ($50/month)
- Cart and checkout with discounts
- Referral program with tracking
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
1. **Project Restructuring**: 
   - Implemented route groups for auth and dashboard
   - Reorganized components by function
   - Updated all import paths
2. **Terminology Consistency**: 
   - All "expert" references changed to "doctor"
   - All "member/patient" references changed to "user"
   - Updated all function names, variables, and comments
3. **Enhanced Features**:
   - Added referral system with credit tracking
   - Improved cart with subscription and referral discounts
   - Better checkout flow with address management
   - Colorful UI updates on home and store pages
4. **UI Improvements**:
   - Darker text throughout for better readability
   - Prominent cart button in store
   - Reorganized menu structure with new sections

### Current Limitations
- No testing framework configured
- No TypeScript - pure JavaScript/JSX
- Standard Next.js ESLint configuration only

### Pending Features
- Doctor referral system
- Course section (coming soon)
- Enhanced subscription management
- User activity tracking