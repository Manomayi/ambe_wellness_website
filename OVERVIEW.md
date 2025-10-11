# Ambé Wellness Website - Complete Documentation

**Version**: 1.0
**Last Updated**: October 2025
**Platform**: Next.js 15.2.4 with React 19

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Quick Start](#quick-start)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Documentation Index](#documentation-index)
6. [Key Concepts](#key-concepts)
7. [Project Structure](#project-structure)

---

## Executive Summary

Ambé Wellness is a comprehensive telemedicine and wellness consultation platform that connects patients (users) with healthcare providers (doctors) through an integrated digital experience. The platform facilitates:

- **Virtual Healthcare Consultations** via video calls
- **Health Assessment** through comprehensive questionnaires
- **Doctor-Patient Matching** based on health needs
- **Real-time Messaging** between doctors and patients
- **E-commerce Store** for wellness products with subscription benefits
- **Referral Program** with rewards and discounts
- **Subscription Management** for ongoing care access

### Platform Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AMBÉ WELLNESS PLATFORM                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐              ┌──────────────────┐   │
│  │   USER PORTAL    │◄────────────►│  DOCTOR PORTAL   │   │
│  │                  │   Real-time   │                  │   │
│  │ • Questionnaire  │  Consultations│ • Dashboard      │   │
│  │ • Scheduling     │   & Messages  │ • Schedule Mgmt  │   │
│  │ • Video Calls    │              │ • User Mgmt      │   │
│  │ • Store/Cart     │              │ • Video Calls    │   │
│  │ • Subscriptions  │              │ • Reports        │   │
│  │ • Referrals      │              │ • Messages       │   │
│  └──────────────────┘              └──────────────────┘   │
│           │                                  │              │
│           └──────────────┬──────────────────┘              │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              FIREBASE BACKEND                        │  │
│  │  • Authentication  • Firestore DB  • Storage        │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│           ┌──────────────┼──────────────┐                  │
│           ▼              ▼               ▼                  │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐          │
│  │    STRIPE    │ │  AGORA   │ │   STORAGE    │          │
│  │   Payments   │ │  Video   │ │    Media     │          │
│  └──────────────┘ └──────────┘ └──────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase account
- Stripe account
- Agora account (for video)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ambe_wellness_website

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

For detailed setup instructions, see [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md)

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.2.4 | React framework with App Router |
| **React** | 19.0.0 | UI library |
| **Tailwind CSS** | 4.0 | Styling framework |
| **Framer Motion** | 12.10.0 | Animations |
| **Heroicons** | 2.2.0 | Icon library |

### Backend & Services
| Service | Purpose |
|---------|---------|
| **Firebase Auth** | User authentication |
| **Firestore** | NoSQL database |
| **Firebase Storage** | File storage |
| **Stripe** | Payment processing |
| **Agora RTC SDK** | Video consultations |

### Utilities
| Library | Purpose |
|---------|---------|
| **moment-timezone** | Timezone handling for scheduling |
| **date-fns** | Date formatting and manipulation |

### Language
- **JavaScript/JSX** (No TypeScript)

---

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                           │
│  Next.js 15 App Router (React 19)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Public     │  │ Auth Routes  │  │  Dashboard   │      │
│  │   Routes     │  │  /login      │  │   /doctor    │      │
│  │   /          │  │  /signup     │  │   /user      │      │
│  │   /about     │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    CONTEXT PROVIDERS                          │
│  • AuthContext (user state, authentication)                  │
│  • Protected Routes (role-based access control)              │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    SERVICES LAYER                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Firebase  │  │   Stripe   │  │   Agora    │            │
│  │  Services  │  │  Payments  │  │   Video    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                 │
│  Firestore Collections:                                       │
│  • users/                                                     │
│  • doctors/                                                   │
│  • products/                                                  │
│  • [subcollections: cart, appointments, messages]            │
└──────────────────────────────────────────────────────────────┘
```

### Route Structure

```
app/
├── (public)
│   ├── page.js              # Homepage
│   ├── membership/page.js   # Membership info
│   ├── enterprise/page.js   # Enterprise solutions
│   └── resources/page.js    # Resources
│
├── (auth)
│   ├── login/page.jsx       # Login page
│   └── signup/page.jsx      # Registration page
│
└── (dashboard)
    ├── doctor/
    │   ├── dashboard/       # Doctor dashboard
    │   ├── consultations/   # Manage consultations
    │   ├── schedule/        # Set availability
    │   ├── users/           # View assigned users
    │   ├── messages/        # Chat with users
    │   └── menu/            # Settings & profile
    │
    └── user/
        ├── home/            # User dashboard
        ├── consult/         # Consultations & scheduling
        ├── store/           # Product catalog
        ├── cart/            # Shopping cart
        ├── checkout/        # Purchase flow
        ├── referral/        # Referral program
        └── menu/            # Settings & profile
```

---

## Documentation Index

### Essential Documentation (Start Here)

1. **[SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md)**
   Complete setup guide including environment variables, Firebase configuration, and deployment

2. **[ARCHITECTURE.md](./ARCHITECTURE.md)**
   Deep dive into system architecture, design patterns, and code organization

3. **[DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md)**
   Firestore schema, collections, relationships, and data models

4. **[AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md)**
   Authentication flows, protected routes, and access control

### Portal Documentation

5. **[USER_PORTAL.md](./USER_PORTAL.md)**
   Complete user features: questionnaires, consultations, store, subscriptions, referrals

6. **[DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md)**
   Doctor features: dashboard, user management, consultations, reports, scheduling

### Feature Documentation

7. **[FEATURES_AND_WORKFLOWS.md](./FEATURES_AND_WORKFLOWS.md)**
   Detailed workflows: questionnaires, scheduling, messaging, referrals

8. **[INTEGRATIONS.md](./INTEGRATIONS.md)**
   Third-party integrations: Stripe, Agora, Firebase services

9. **[UI_UX_DESIGN_SYSTEM.md](./UI_UX_DESIGN_SYSTEM.md)**
   Design tokens, components, styling guidelines, brand identity

### Operations & Maintenance

10. **[DEPLOYMENT.md](./DEPLOYMENT.md)**
    Build process, environment setup, production deployment

11. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**
    Common issues, debugging tips, error resolution

12. **[MAINTENANCE_AND_UPDATES.md](./MAINTENANCE_AND_UPDATES.md)**
    Ongoing maintenance, updates, backup strategies

### Reference Documentation

13. **[GLOSSARY.md](./GLOSSARY.md)**
    Terms and definitions

14. **[FAQ.md](./FAQ.md)**
    Frequently asked questions

---

## Key Concepts

### User Types

The platform has two distinct user types:

#### 1. **Users** (Patients/Clients)
- Seek wellness consultations
- Complete health questionnaires
- Book and attend video consultations
- Purchase wellness products
- Manage subscriptions ($50/month)
- Earn referral credits

#### 2. **Doctors** (Healthcare Providers)
- Provide consultations
- Review health questionnaires
- Set weekly availability
- Conduct video consultations
- Create post-consultation reports
- Message assigned users

### Core Features

#### Health Questionnaire System
- Multi-section health assessment
- **Health field mapping** to categorize concerns:
  - General Health
  - Women's Health / Men's Health
  - Muscular Skeletal
  - Heart Health
  - Skin & Hair Health
  - Mental Emotional Health
  - Digestive & Metabolic
  - Oncology
  - Disabilities
  - Behavioral
- Doctor matching based on responses

#### Consultation Workflow
```
User Signs Up → Completes Questionnaire → Gets Matched with Doctor
     ↓
Subscribes ($50/month) → Schedules Consultation → Video Call
     ↓
Doctor Creates Report → User Views Results → Can Message Doctor
     ↓
Repeats for ongoing care
```

#### E-commerce Flow
```
Browse Store → Add to Cart (with variants) → Apply Discounts
     ↓
Checkout with Stripe → Order Confirmation → Purchase History
     ↓
Subscription Discount: $50 off
Referral Discount: 25% off
```

#### Referral System
- Each user gets unique referral code
- **Referrer** gets 25% off next order
- **Referee** gets 25% off first order
- Credits tracked in user profile

### Timezone Handling

All scheduling uses **moment-timezone** to handle:
- Doctor availability in their timezone
- User booking in their timezone
- Proper conversion and display
- Appointment notifications

### Subscription Model

**Monthly Subscription: $50**
- Unlimited text messaging with doctor
- Video consultation access
- $50 discount on store products
- Priority scheduling

---

## Project Structure

```
ambe_wellness_website/
├── public/
│   ├── images/          # Static images
│   │   ├── icons/       # UI icons
│   │   ├── doctors/     # Doctor profile images
│   │   ├── home/        # Homepage assets
│   │   └── logos/       # Brand logos
│   └── fonts/           # Custom fonts (Richmond)
│
├── src/
│   ├── app/
│   │   ├── (auth)/      # Authentication routes
│   │   ├── (dashboard)/ # Protected routes
│   │   │   ├── doctor/  # Doctor portal
│   │   │   └── user/    # User portal
│   │   ├── layout.js    # Root layout
│   │   ├── page.js      # Homepage
│   │   └── globals.css  # Global styles
│   │
│   ├── components/
│   │   ├── auth/        # Auth components
│   │   ├── chat/        # Chat components
│   │   ├── common/      # Shared components
│   │   ├── navigation/  # Nav components
│   │   ├── user/        # User-specific components
│   │   └── video/       # Video call components
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx  # Auth state management
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   └── config.js    # Firebase initialization
│   │   ├── design-tokens.js  # Design system constants
│   │   └── styles/
│   │       └── constants.js  # Style constants
│   │
│   └── styles/          # Additional styles
│
├── docs/                # This documentation
├── CLAUDE.md            # Project instructions for AI
├── package.json         # Dependencies
├── jsconfig.json        # Path aliases
├── tailwind.config.js   # Tailwind configuration
└── .env.local           # Environment variables (not in git)
```

---

## Key File Locations

### Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| Firebase Config | Firebase initialization | `src/lib/firebase/config.js` |
| Auth Context | Authentication state | `src/contexts/AuthContext.jsx` |
| Design Tokens | Color palette & typography | `src/lib/design-tokens.js` |
| Tailwind Config | Styling configuration | `tailwind.config.js` |
| Path Aliases | Import shortcuts | `jsconfig.json` |

### Important Components

| Component | Purpose | Location |
|-----------|---------|----------|
| ProtectedRoute | Route authorization | `src/components/common/ProtectedRoute.jsx` |
| DoctorNav | Doctor navigation | `src/components/navigation/DoctorNav.jsx` |
| UserNav | User navigation | `src/components/navigation/UserNav.jsx` |
| VideoCall | Video consultation | `src/components/video/VideoCall.jsx` |
| ChatWindow | Messaging | `src/components/chat/ChatWindow.jsx` |
| Button | Reusable button | `src/components/common/Button.jsx` |

---

## Development Workflow

### Local Development

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Test production build locally
npm run start
```

### Important Commands

```bash
# Install new dependency
npm install <package-name>

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

---

## Environment Variables

Required environment variables (see [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md) for details):

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# API (if applicable)
NEXT_PUBLIC_API_ENDPOINT=
```

---

## Code Conventions

### Import Aliases

Use `@/` prefix for imports from the `src/` directory:

```javascript
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
```

### HTML/Styling Rules

**IMPORTANT**: Never use HTML heading tags (`h1`, `h2`, `h3`, etc.)

❌ **WRONG:**
```jsx
<h1>Welcome</h1>
<h2>Subtitle</h2>
```

✅ **CORRECT:**
```jsx
<div className="text-4xl font-bold">Welcome</div>
<div className="text-2xl font-semibold">Subtitle</div>
```

### Component Structure

```javascript
"use client"; // For client components

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ComponentName() {
  // State
  const [state, setState] = useState(null);

  // Hooks
  const router = useRouter();
  const { user, profile } = useAuth();

  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // Handlers
  const handleAction = () => {
    // Handler logic
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

---

## Design System Quick Reference

### Colors

```javascript
Primary Peach:    #FFD3AC
Dark Charcoal:    #353535
Background:       #E5E5E5
Body Text:        #535353
Grid Box:         #F4F4F4
White:            #FFFFFF
```

### Typography

```javascript
Heading Font: Richmond Text (with Playfair Display fallback)
Body Font:    System fonts (Basis Grotesque Arabic Pro fallback)

Font Sizes:
- H1: 35px (text-4xl)
- H2: 19px (text-xl)
- Body: 16px (text-base)
```

### Spacing

```javascript
Container: max-w-7xl (1280px)
Padding: px-8 mobile, lg:px-16 desktop
Section Padding: py-20
```

---

## Next Steps

1. **Set up your development environment**
   → Go to [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md)

2. **Understand the authentication system**
   → Go to [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md)

3. **Learn the database structure**
   → Go to [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md)

4. **Explore user features**
   → Go to [USER_PORTAL.md](./USER_PORTAL.md)

5. **Explore doctor features**
   → Go to [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md)

---

## Getting Help

- **Troubleshooting**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **FAQs**: See [FAQ.md](./FAQ.md)
- **Glossary**: See [GLOSSARY.md](./GLOSSARY.md)

---

## Contributing

This documentation is maintained alongside the codebase. When making changes:

1. Update relevant documentation files
2. Keep code examples current
3. Update the CHANGELOG.md
4. Maintain cross-references between docs

---

**Happy Coding!** 🎉

For questions or issues, refer to the specific documentation sections linked above.
