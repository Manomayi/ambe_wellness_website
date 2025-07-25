# Next.js Migration Guide - Panacea Wellness Platform

This guide documents all features and logic from the Flutter app for migration to Next.js, excluding the notification system.

## 1. Authentication & User Management

### User Types
- **Users (Patients)**: Regular users seeking wellness consultations
- **Doctors**: Healthcare providers offering consultations

### Authentication Flow
```typescript
// User/Doctor detection logic
const getUserType = async (uid: string): Promise<'user' | 'doctor'> => {
  const doctorDoc = await getDoc(doc(db, 'doctors', uid));
  return doctorDoc.exists() ? 'doctor' : 'user';
};

// Auth context should track:
interface AuthContextType {
  user: User | null;
  userType: 'user' | 'doctor' | null;
  userProfile: UserProfile | DoctorProfile | null;
}
```

### Sign-up Flow
1. **Multi-step registration**:
   - Basic info (name, email, password)
   - Phone number with country code (using react-phone-number-input)
   - Role selection (user/doctor)
   - Doctor-specific: specialization selection with custom option
   - Doctor-specific: document upload for verification

### Key Fields for Users:
```typescript
interface UserProfile {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  age?: number;
  location?: string;
  health_tags?: string[];
  subscription: {
    active: boolean;
    plan?: string;
    expires_at?: Timestamp;
  };
  has_made_purchase: boolean;
  is_consultation_set: boolean;
  is_first_consultation_completed: boolean;
  fcm_token?: string; // Skip this for web
  referral_code?: string;
  referred_by?: string;
  referral_credits?: number;
  matched_via_referral?: boolean;
  doctor?: {
    uid: string;
    first_name: string;
    last_name: string;
  };
}
```

### Key Fields for Doctors:
```typescript
interface DoctorProfile {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  specialization: string;
  customSpecialization?: string; // For 'general_health' type
  verification_status: 'Pending' | 'Verified' | 'Rejected';
  is_schedule_set: boolean;
  schedule?: DoctorSchedule;
  timezone: string;
  about?: string;
  pending: {
    user_profiles: number;
    finish_report: number;
  };
}
```

## 2. Doctor-User Matching System

### Match with Doctor Function
Cloud function: `matchWithDoctor`
- Matches users with doctors based on health field preferences
- Creates entries in doctor's subcollections:
  - `doctors/{doctorId}/users/{userId}` - User profile copy
  - `doctors/{doctorId}/chats/{chatId}` - Chat initialization

### Match by Specialty (Referrals)
Cloud function: `matchWithDoctorBySpecialty`
- Used for doctor-to-doctor referrals
- Matches based on specific specialization
- Sets `matched_via_referral` flag

## 3. Consultation Scheduling

### Doctor Schedule Management
```typescript
interface DoctorSchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

interface DaySchedule {
  isAvailable: boolean;
  startTime?: string; // "09:00"
  endTime?: string;   // "17:00"
}
```

### Timezone Handling
- Use `moment-timezone` or `date-fns-tz` for timezone conversions
- Store all appointments in UTC
- Display in user's local timezone
- Show doctor's timezone when different from user's

### Appointment Booking Flow
1. User must be matched with a doctor first
2. Load doctor's schedule and timezone
3. Generate available time slots (30-minute intervals)
4. Check for existing appointments to avoid conflicts
5. Call `scheduleAppointment` cloud function
6. Create appointment in both subcollections:
   - `doctors/{doctorId}/appointments_upcoming`
   - `users/{userId}/appointments_upcoming`

### Appointment Data Structure:
```typescript
interface Appointment {
  appointment_id: string;
  user_id: string;
  user_name: string;
  doctor_id: string;
  doctor_name: string;
  time: Timestamp; // UTC
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: Timestamp;
  user_timezone_offset: string;
}
```

## 4. Video Consultations

### Agora Integration
```typescript
// Environment variables needed
NEXT_PUBLIC_AGORA_APP_ID=your-agora-app-id

// Video call setup
interface VideoCallConfig {
  channel: string; // appointment_id
  token: string;   // Generated server-side
  uid: number;     // User's unique ID for the call
}
```

### Video Call Flow:
1. Both parties join using appointment_id as channel
2. Doctor can admit user to call
3. Post-call: Doctor fills consultation report
4. Post-call: User provides feedback

## 5. Chat/Messaging System

### Chat Structure
- Chat ID format: `{userId}_{doctorId}`
- Messages stored in: `chats/{chatId}/messages`
- Metadata stored in: `doctors/{doctorId}/chats/{chatId}`

### Message Restrictions:
- Users cannot message doctors before first consultation
- Check `has_consultation` flag in chat metadata
- Doctors can always initiate messages

### Message Structure:
```typescript
interface Message {
  text: string;
  sender_uid: string;
  timestamp: Timestamp;
  read: boolean;
}

interface ChatMetadata {
  user_id: string;
  user_name: string;
  last_message: string;
  last_message_time: Timestamp;
  unread_count: number;
  has_consultation: boolean;
}
```

## 6. E-commerce Features

### Product Catalog
Collection: `products`
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp?: number;
  discount_percentage?: number;
  category: string;
  sub_category?: string;
  image_url: string;
  in_stock: boolean;
}
```

### Shopping Cart
Subcollection: `users/{userId}/cart`
```typescript
interface CartItem {
  product_id: string;
  product_name: string;
  price: number;
  mrp?: number;
  quantity: number;
  image_url: string;
  added_at: Timestamp;
}
```

### Checkout Features:
- Apply membership discounts (if subscription active)
- Apply referral discounts (25% for referred users)
- Calculate subtotal with discounts
- Stripe payment integration

## 7. Referral System

### Two Types of Referrals:

1. **User Referrals** (Marketing):
   - Generate unique referral codes
   - 25% discount for referred users
   - Track with `referred_by` field
   - Referral credits system

2. **Doctor Referrals** (Medical):
   - Post-consultation doctor recommendations
   - Uses `matchWithDoctorBySpecialty`
   - Tracked with `matched_via_referral`

## 8. Subscription System

### Subscription Management:
```typescript
interface Subscription {
  active: boolean;
  plan: 'monthly' | 'yearly';
  started_at: Timestamp;
  expires_at: Timestamp;
  stripe_subscription_id: string;
}
```

### Benefits:
- Discounts on store purchases
- Access to wellness packs
- Priority consultation booking

## 9. Doctor Verification

### Verification Flow:
1. Doctor uploads required documents during signup
2. Documents stored in Cloud Storage: `doctor_documents/{doctorId}/`
3. Verification status tracked in `verification` collection
4. Three states: Pending, Verified, Rejected

### Required Documents:
- Medical license
- Government ID
- Certifications
- Proof of practice

## 10. Cloud Functions Summary

Essential functions to implement (already JavaScript!):
- `createUser` - User/doctor registration
- `matchWithDoctor` - User-doctor matching
- `matchWithDoctorBySpecialty` - Specialty-based matching
- `scheduleAppointment` - Appointment booking
- `createPaymentIntent` - Stripe payments
- `validateReferralCode` - Referral validation
- `processStripeWebhook` - Payment webhooks

## 11. Key UI/UX Patterns

### Navigation Structure:
**User Navigation:**
- Home (upcoming consultations, matched doctor)
- Consult (book appointments, consultation history)
- Store (products, cart, checkout)
- Profile (settings, referrals, subscriptions)

**Doctor Navigation:**
- Home (stats, upcoming consultations)
- Consultations (upcoming, history, reports to finish)
- Messages (patient chats)
- Patients (matched users list)
- Profile (schedule, verification, settings)

### Empty States:
- Show relevant messages when no data
- Action buttons to guide users
- Consistent design across pages

### Loading States:
- Skeleton loaders for better UX
- Pull-to-refresh on list pages
- Loading indicators during actions

## 12. Environment Variables for Next.js

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Agora
NEXT_PUBLIC_AGORA_APP_ID=

# Google Places (for address search)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=
```

## 13. State Management Recommendations

For Next.js, consider:
- **Zustand** or **Redux Toolkit** for global state
- **React Query** or **SWR** for server state
- **Context API** for auth state

## 14. Key Libraries to Install

```json
{
  "dependencies": {
    "firebase": "^10.x",
    "stripe": "^13.x",
    "@stripe/stripe-js": "^2.x",
    "agora-rtc-sdk-ng": "^4.x",
    "react-phone-number-input": "^3.x",
    "date-fns": "^2.x",
    "date-fns-tz": "^2.x",
    "react-hot-toast": "^2.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x"
  }
}
```

## 15. Migration Checklist

- [ ] Set up Firebase project and authentication
- [ ] Implement user/doctor registration flows
- [ ] Create doctor-user matching system
- [ ] Build consultation scheduling with timezone support
- [ ] Integrate Agora video calling
- [ ] Implement chat messaging with restrictions
- [ ] Build e-commerce features (store, cart, checkout)
- [ ] Set up Stripe payment processing
- [ ] Implement referral systems (both types)
- [ ] Create subscription management
- [ ] Build doctor verification flow
- [ ] Set up all Cloud Functions
- [ ] Implement proper routing and navigation
- [ ] Add loading and empty states
- [ ] Test all user flows end-to-end