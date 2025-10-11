# Database Structure Documentation

**Last Updated**: October 2025
**Database**: Firebase Firestore (NoSQL)

Complete documentation of the Firestore database schema, collections, relationships, and data models for the Ambé Wellness platform.

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Collection Structure](#collection-structure)
3. [Users Collection](#users-collection)
4. [Doctors Collection](#doctors-collection)
5. [Products Collection](#products-collection)
6. [Store Collection](#store-collection)
7. [Data Relationships](#data-relationships)
8. [Query Patterns](#query-patterns)
9. [Security Rules](#security-rules)
10. [Indexes](#indexes)
11. [Best Practices](#best-practices)

---

## Database Overview

### Database Type
- **Firebase Firestore**: NoSQL document database
- **Real-time**: Supports real-time listeners for live data updates
- **Scalable**: Automatically scales with usage
- **Hierarchical**: Supports collections and subcollections

### Database Structure Pattern

```
Firestore Root
├── users/                    (Top-level collection)
│   ├── {userId}/            (Document)
│   │   ├── cart/            (Subcollection)
│   │   ├── appointments_upcoming/
│   │   ├── appointments_completed/
│   │   ├── messages/
│   │   └── profile/
│   │
├── doctors/                  (Top-level collection)
│   ├── {doctorId}/          (Document)
│   │   ├── users/           (Subcollection)
│   │   ├── appointments_upcoming/
│   │   ├── appointments_completed/
│   │   └── messages/
│   │
├── products/                 (Top-level collection)
│   └── {productId}/         (Document)
│
└── store/                    (Top-level collection)
    └── {storeId}/           (Document)
```

---

## Collection Structure

### Top-Level Collections

| Collection | Purpose | Document ID Format |
|------------|---------|-------------------|
| **users** | Patient/user data | Firebase Auth UID |
| **doctors** | Healthcare provider data | Firebase Auth UID |
| **products** | Store products | Auto-generated or custom |
| **store** | Alternative product structure | Auto-generated or custom |

---

## Users Collection

### Path
```
/users/{userId}
```

### Document Structure

```javascript
{
  // Personal Information
  uid: string,                          // Firebase Auth UID
  email: string,                        // User email
  first_name: string,                   // User's first name
  last_name: string,                    // User's last name
  phone: string,                        // Phone number (optional)

  // Profile Status
  is_free_questionnaire_completed: boolean,  // Health questionnaire completed
  is_consultation_set: boolean,              // Has scheduled consultation
  is_first_consultation_completed: boolean,  // Completed first consultation

  // Doctor Assignment
  doctor: string,                       // Assigned doctor UID
  doctor_name: string,                  // Doctor's full name

  // Subscription Information
  subscription: {
    active: boolean,                    // Subscription status
    status: string,                     // "active" | "canceled" | "past_due"
    plan_id: string,                    // Stripe price ID
    current_period_start: Timestamp,    // Subscription start
    current_period_end: Timestamp,      // Subscription end
    cancel_at_period_end: boolean,      // Cancellation scheduled
    stripe_customer_id: string,         // Stripe customer ID
    stripe_subscription_id: string      // Stripe subscription ID
  },

  // Referral System
  referral_code: string,                // User's unique referral code (8 chars)
  referral_count: number,               // Number of successful referrals
  referral_credits: number,             // Available referral discounts
  referred_by: string,                  // UID of referrer (if applicable)
  has_made_purchase: boolean,           // First purchase completed

  // Health Information
  health_concerns: string[],            // Array of health concern IDs
  primary_health_field: string,         // Primary health category

  // Preferences
  timezone: string,                     // User timezone (e.g., "America/New_York")
  preferred_language: string,           // Language preference

  // Notifications
  notification_preferences: {
    email: boolean,
    sms: boolean,
    push: boolean
  },

  // Timestamps
  created_at: Timestamp,                // Account creation
  updated_at: Timestamp,                // Last update
  last_login: Timestamp                 // Last login time
}
```

### Health Field Constants

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

---

### Users Subcollections

#### 1. Cart Subcollection

**Path**: `/users/{userId}/cart/{cartItemId}`

```javascript
{
  productId: string,                    // Product identifier
  productName: string,                  // Product display name
  variantId: string,                    // Variant identifier (or "default")
  variantName: string,                  // Variant display name (e.g., "60 capsules")
  size: string,                         // Size/variant description
  price: number,                        // Current price
  mrp: number,                          // Maximum retail price
  originalPrice: number,                // Original price (before discounts)
  quantity: number,                     // Quantity in cart
  imageUrl: string,                     // Product image URL
  doctor_recommended: boolean,          // Recommended by doctor
  addedAt: Timestamp,                   // When added to cart
  updatedAt: Timestamp                  // Last update
}
```

#### 2. Appointments Upcoming Subcollection

**Path**: `/users/{userId}/appointments_upcoming/{appointmentId}`

```javascript
{
  appointment_id: string,               // Unique appointment ID
  doctor_uid: string,                   // Doctor UID
  doctor_name: string,                  // Doctor's full name
  user_uid: string,                     // User UID
  user_name: string,                    // User's full name
  time: Timestamp,                      // Scheduled time (UTC)
  user_timezone: string,                // User's timezone
  doctor_timezone: string,              // Doctor's timezone
  duration: number,                     // Duration in minutes (default: 30)
  status: string,                       // "scheduled" | "in_progress" | "completed"
  channel_name: string,                 // Agora channel name for video
  agora_token: string,                  // Agora access token (if applicable)
  created_at: Timestamp,                // When scheduled
  notes: string                         // Optional appointment notes
}
```

#### 3. Appointments Completed Subcollection

**Path**: `/users/{userId}/appointments_completed/{appointmentId}`

```javascript
{
  appointment_id: string,               // Unique appointment ID
  doctor_uid: string,                   // Doctor UID
  doctor_name: string,                  // Doctor's full name
  user_uid: string,                     // User UID
  user_name: string,                    // User's full name
  time: Timestamp,                      // Consultation time (UTC)
  duration: number,                     // Actual duration in minutes
  completed_at: Timestamp,              // When completed

  // Consultation Report
  report: {
    summary: string,                    // Consultation summary
    recommendations: string[],          // Doctor's recommendations
    prescribed_products: string[],      // Recommended products
    follow_up_needed: boolean,          // Needs follow-up
    follow_up_date: Timestamp,          // Suggested follow-up date
    notes: string                       // Additional notes
  },

  // Feedback
  user_rating: number,                  // Rating (1-5)
  user_feedback: string,                // User's feedback
  feedback_submitted_at: Timestamp      // When feedback submitted
}
```

#### 4. Messages Subcollection

**Path**: `/users/{userId}/messages/{messageId}`

```javascript
{
  message_id: string,                   // Unique message ID
  sender_uid: string,                   // Sender UID (user or doctor)
  sender_name: string,                  // Sender's name
  sender_type: string,                  // "user" | "doctor"
  receiver_uid: string,                 // Receiver UID
  receiver_name: string,                // Receiver's name
  message: string,                      // Message text
  timestamp: Timestamp,                 // When sent
  read: boolean,                        // Read status
  read_at: Timestamp,                   // When read

  // Optional fields
  image_url: string,                    // Attached image
  file_url: string,                     // Attached file
  file_name: string,                    // File name

  // Threading
  reply_to: string,                     // Message ID being replied to
  thread_id: string                     // Conversation thread
}
```

#### 5. Profile Subcollection

**Path**: `/users/{userId}/profile/{profileId}`

```javascript
{
  time: Timestamp,                      // When profile created/updated

  // Questionnaire Results
  questionnaire_responses: {
    section1: object,                   // Health history
    section2: object,                   // Current symptoms
    section3: object,                   // Lifestyle
    section4: object,                   // Dietary habits
    section5: object                    // Mental health
  },

  // Doctor Analysis
  doctor_notes: string,                 // Doctor's analysis
  health_score: number,                 // Overall health score (0-100)
  primary_concerns: string[],           // Main health concerns

  // Recommendations
  store_recommendations: [              // Product recommendations
    {
      product_name: string,
      size: string,
      quantity: number,
      reason: string                    // Why recommended
    }
  ],

  // Matching
  matched_doctor: string,               // Matched doctor UID
  match_reason: string                  // Why matched with this doctor
}
```

---

## Doctors Collection

### Path
```
/doctors/{doctorId}
```

### Document Structure

```javascript
{
  // Personal Information
  uid: string,                          // Firebase Auth UID
  email: string,                        // Doctor email
  first_name: string,                   // First name
  last_name: string,                    // Last name
  phone: string,                        // Phone number

  // Professional Information
  title: string,                        // "Dr." | "MD" | "DO" | etc.
  specialization: string[],             // Array of specializations
  license_number: string,               // Medical license number
  years_of_experience: number,          // Years practicing

  // Verification
  verification_status: string,          // "Pending" | "Verified" | "Rejected"
  verified_at: Timestamp,               // When verified
  verification_documents: string[],     // URLs to verification docs

  // Schedule
  is_schedule_set: boolean,             // Has set availability
  timezone: string,                     // Doctor's timezone
  availability: {
    monday: [
      { start: string, end: string }    // e.g., { start: "09:00", end: "12:00" }
    ],
    tuesday: [...],
    wednesday: [...],
    thursday: [...],
    friday: [...],
    saturday: [...],
    sunday: [...]
  },

  // Statistics
  total_consultations: number,          // Total consultations completed
  average_rating: number,               // Average user rating (0-5)
  total_ratings: number,                // Number of ratings received

  // Pending Actions
  pending: {
    finish_report: number,              // Number of pending reports
    upcoming_consultations: number      // Number of upcoming consultations
  },

  // Profile
  bio: string,                          // Professional bio
  profile_image_url: string,            // Profile picture URL
  languages: string[],                  // Languages spoken

  // Preferences
  max_daily_consultations: number,      // Maximum per day
  consultation_duration: number,        // Default duration (minutes)
  accepting_new_patients: boolean,      // Currently accepting new patients

  // Timestamps
  created_at: Timestamp,
  updated_at: Timestamp,
  last_active: Timestamp
}
```

---

### Doctors Subcollections

#### 1. Users Subcollection

**Path**: `/doctors/{doctorId}/users/{userId}`

```javascript
{
  user_uid: string,                     // User UID
  user_name: string,                    // User's full name
  user_email: string,                   // User's email
  assigned_at: Timestamp,               // When assigned to doctor

  // User Status
  first_consultation_completed: boolean,
  last_consultation: Timestamp,         // Last consultation date
  total_consultations: number,          // Number of consultations

  // Health Summary
  primary_health_concerns: string[],
  health_field: string,

  // Quick Access
  next_appointment: Timestamp,          // Next scheduled appointment
  has_pending_messages: boolean,        // Unread messages from user

  // Notes
  doctor_notes: string,                 // Private doctor notes
  flags: string[]                       // Important flags/alerts
}
```

#### 2. Appointments Upcoming Subcollection

**Path**: `/doctors/{doctorId}/appointments_upcoming/{appointmentId}`

Structure identical to user's appointments_upcoming subcollection.

#### 3. Appointments Completed Subcollection

**Path**: `/doctors/{doctorId}/appointments_completed/{appointmentId}`

Structure identical to user's appointments_completed subcollection.

#### 4. Messages Subcollection

**Path**: `/doctors/{doctorId}/messages/{messageId}`

Structure identical to user's messages subcollection.

---

## Products Collection

### Path
```
/products/{productId}
```

### Document Structure

```javascript
{
  // Product Information
  id: string,                           // Product ID
  name: string,                         // Product name
  product_name: string,                 // Alternative name field
  description: string,                  // Product description
  category: string,                     // Category (e.g., "supplements", "skincare")

  // Pricing
  price: number,                        // Base price
  original_price: number,               // Original price (for discounts)

  // Variants
  variants: [
    {
      id: string,                       // Variant ID
      name: string,                     // Variant name (e.g., "60 capsules")
      price: number,                    // Variant price
      original_price: number,           // Variant original price
      stock: number,                    // Available stock
      sku: string                       // Stock keeping unit
    }
  ],

  // Media
  imageUrl: string,                     // Primary image URL
  image_url: string,                    // Alternative image field
  images: string[],                     // Additional images

  // Details
  ingredients: string[],                // List of ingredients
  directions: string,                   // Usage directions
  warnings: string,                     // Warnings/precautions

  // Inventory
  in_stock: boolean,                    // Stock status
  stock_quantity: number,               // Total stock
  low_stock_threshold: number,          // Alert threshold

  // SEO & Metadata
  tags: string[],                       // Searchable tags
  search_keywords: string[],            // Search optimization
  featured: boolean,                    // Featured product
  new_arrival: boolean,                 // New product flag

  // Timestamps
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

## Store Collection

### Path
```
/store/{storeId}
```

Alternative product structure used in some parts of the application.

### Document Structure

```javascript
{
  category: string,                     // Product category
  products: [                           // Array of products
    {
      product_name: string,
      image_url: string,
      description: string,
      packs: [                          // Product variants/packs
        {
          size: string,                 // Size (e.g., "60 capsules")
          mrp: number,                  // Price
          stock: number                 // Stock quantity
        }
      ]
    }
  ],
  updated_at: Timestamp
}
```

---

## Data Relationships

### Visual Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        RELATIONSHIPS                         │
└─────────────────────────────────────────────────────────────┘

USER {uid}
  │
  ├─── ASSIGNED TO ───► DOCTOR {uid}
  │                         │
  │                         └─── HAS SUBCOLLECTION: users/{uid}
  │
  ├─── HAS SUBCOLLECTION: cart/{itemId}
  │         │
  │         └─── REFERENCES ───► PRODUCT {productId}
  │
  ├─── HAS SUBCOLLECTION: appointments_upcoming/{appointmentId}
  │         │
  │         └─── SYNCHRONIZED WITH ───► DOCTOR/appointments_upcoming
  │
  ├─── HAS SUBCOLLECTION: appointments_completed/{appointmentId}
  │         │
  │         └─── SYNCHRONIZED WITH ───► DOCTOR/appointments_completed
  │
  └─── HAS SUBCOLLECTION: messages/{messageId}
            │
            └─── SYNCHRONIZED WITH ───► DOCTOR/messages
```

### Relationship Rules

1. **User ↔ Doctor Assignment**
   - One user can be assigned to ONE doctor at a time
   - One doctor can have MANY users
   - Field: `users.doctor = doctors.uid`

2. **Appointments (Dual Storage)**
   - Appointments stored in BOTH user and doctor collections
   - Must be synchronized on create/update/delete
   - User path: `/users/{userId}/appointments_*/`
   - Doctor path: `/doctors/{doctorId}/appointments_*/`

3. **Messages (Dual Storage)**
   - Messages stored in BOTH sender and receiver collections
   - Real-time synchronization required
   - Each message has mirror copy

4. **Products ↔ Cart**
   - Cart items reference product IDs
   - Product details cached in cart for performance
   - Must update cart if product price changes

5. **Referral System**
   - User A refers User B
   - `userB.referred_by = userA.uid`
   - `userA.referral_count += 1` when User B completes action

---

## Query Patterns

### Common Queries

#### 1. Get User Profile
```javascript
const userDoc = await getDoc(doc(db, 'users', userId));
const userData = userDoc.data();
```

#### 2. Get User's Doctor
```javascript
const userDoc = await getDoc(doc(db, 'users', userId));
const doctorUid = userDoc.data().doctor;
const doctorDoc = await getDoc(doc(db, 'doctors', doctorUid));
```

#### 3. Get Upcoming Appointments for User
```javascript
const q = query(
  collection(db, 'users', userId, 'appointments_upcoming'),
  where('time', '>=', Timestamp.now()),
  orderBy('time', 'asc')
);
const snapshot = await getDocs(q);
```

#### 4. Get Doctor's Assigned Users
```javascript
const q = query(
  collection(db, 'doctors', doctorId, 'users'),
  orderBy('assigned_at', 'desc')
);
const snapshot = await getDocs(q);
```

#### 5. Get Cart Items with Total
```javascript
const cartQuery = collection(db, 'users', userId, 'cart');
const cartSnapshot = await getDocs(cartQuery);
const items = cartSnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
const total = items.reduce((sum, item) =>
  sum + (item.price * item.quantity), 0
);
```

#### 6. Get Messages Between User and Doctor (Real-time)
```javascript
const messagesRef = collection(db, 'users', userId, 'messages');
const q = query(messagesRef, orderBy('timestamp', 'asc'));

const unsubscribe = onSnapshot(q, (snapshot) => {
  const messages = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  // Update UI with messages
});
```

#### 7. Search Products by Category
```javascript
const q = query(
  collection(db, 'products'),
  where('category', '==', 'supplements'),
  where('in_stock', '==', true),
  orderBy('name', 'asc')
);
const snapshot = await getDocs(q);
```

#### 8. Get Completed Consultations for Doctor
```javascript
const q = query(
  collection(db, 'doctors', doctorId, 'appointments_completed'),
  orderBy('completed_at', 'desc'),
  limit(10)
);
const snapshot = await getDocs(q);
```

---

## Security Rules

Key security principles implemented:

### 1. Authentication Required
```javascript
function isAuthenticated() {
  return request.auth != null;
}
```

### 2. Owner-Only Access
```javascript
function isOwner(uid) {
  return isAuthenticated() && request.auth.uid == uid;
}
```

### 3. Doctor Verification
```javascript
function isDoctor() {
  return isAuthenticated() &&
         exists(/databases/$(database)/documents/doctors/$(request.auth.uid));
}
```

### 4. User-Doctor Relationship
```javascript
function isAssignedDoctor(userId) {
  return isDoctor() &&
         get(/databases/$(database)/documents/users/$(userId)).data.doctor == request.auth.uid;
}
```

See [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md) for complete security rules.

---

## Indexes

### Required Composite Indexes

Firestore automatically suggests creating indexes when queries fail. Common indexes needed:

#### 1. User Appointments by Time
```
Collection: users/{userId}/appointments_upcoming
Fields: time (Ascending), status (Ascending)
```

#### 2. Doctor Appointments by Time
```
Collection: doctors/{doctorId}/appointments_upcoming
Fields: time (Ascending), status (Ascending)
```

#### 3. Messages by Timestamp
```
Collection: users/{userId}/messages
Fields: timestamp (Ascending), read (Ascending)
```

#### 4. Products by Category and Stock
```
Collection: products
Fields: category (Ascending), in_stock (Ascending), name (Ascending)
```

#### 5. Doctor's Users by Assignment
```
Collection: doctors/{doctorId}/users
Fields: assigned_at (Descending)
```

### Creating Indexes

Indexes are created automatically when you run queries that require them. Firestore provides a URL in the error message to create the index.

Alternatively, create indexes manually in Firebase Console:
1. Go to **Firestore Database** → **Indexes**
2. Click "Create index"
3. Select collection and fields
4. Choose ascending/descending
5. Click "Create"

---

## Best Practices

### 1. Document Size
- Keep documents under 1MB
- Use subcollections for large arrays
- Avoid deeply nested objects (max 20 levels)

### 2. Real-time Listeners
```javascript
// ✅ GOOD: Unsubscribe when component unmounts
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, (doc) => {
    // Handle updates
  });

  return () => unsubscribe(); // Clean up
}, []);
```

### 3. Batch Operations
```javascript
// ✅ GOOD: Use batch for multiple writes
const batch = writeBatch(db);
batch.set(docRef1, data1);
batch.update(docRef2, data2);
batch.delete(docRef3);
await batch.commit();
```

### 4. Pagination
```javascript
// ✅ GOOD: Use cursor pagination
const q = query(
  collection(db, 'products'),
  orderBy('created_at', 'desc'),
  startAfter(lastDoc),
  limit(20)
);
```

### 5. Denormalization
```javascript
// ✅ GOOD: Cache frequently accessed data
{
  doctor_uid: "abc123",
  doctor_name: "Dr. Smith",  // Cached for quick display
  doctor_email: "smith@..."  // Cached
}
```

### 6. Timestamps
```javascript
// ✅ GOOD: Use Firestore server timestamp
import { serverTimestamp } from 'firebase/firestore';

await addDoc(collection(db, 'users'), {
  name: "John",
  created_at: serverTimestamp() // Server-side timestamp
});
```

### 7. Error Handling
```javascript
// ✅ GOOD: Always handle errors
try {
  await setDoc(doc(db, 'users', userId), data);
} catch (error) {
  console.error('Error writing document:', error);
  // Show user-friendly error message
}
```

### 8. Avoid Array Operations
```javascript
// ❌ BAD: Large arrays
{
  messages: [msg1, msg2, ..., msg1000]  // 1000 messages
}

// ✅ GOOD: Use subcollection
users/{userId}/messages/{messageId}
```

---

## Data Migration Strategies

### Adding New Fields to Existing Documents

```javascript
// Update all users with new field
const usersRef = collection(db, 'users');
const snapshot = await getDocs(usersRef);

const batch = writeBatch(db);
snapshot.docs.forEach((doc) => {
  batch.update(doc.ref, {
    new_field: default_value
  });
});

await batch.commit();
```

### Migrating Data Structure

```javascript
// Example: Moving from array to subcollection
const userDoc = await getDoc(doc(db, 'users', userId));
const oldMessages = userDoc.data().messages || [];

// Create subcollection documents
const batch = writeBatch(db);
oldMessages.forEach((msg, index) => {
  const msgRef = doc(collection(db, 'users', userId, 'messages'));
  batch.set(msgRef, msg);
});

// Remove old field
batch.update(doc(db, 'users', userId), {
  messages: deleteField()
});

await batch.commit();
```

---

## Performance Optimization

### 1. Use Shallow Queries
```javascript
// Only fetch what you need
const userDoc = await getDoc(doc(db, 'users', userId));
const { name, email } = userDoc.data();  // Extract only needed fields
```

### 2. Cache Static Data
```javascript
// Cache product catalog locally
const cachedProducts = localStorage.getItem('products');
if (!cachedProducts || Date.now() - lastFetch > 3600000) {
  // Fetch fresh data if cache older than 1 hour
}
```

### 3. Limit Real-time Listeners
```javascript
// Only listen to recent messages
const q = query(
  collection(db, 'users', userId, 'messages'),
  orderBy('timestamp', 'desc'),
  limit(50)  // Only last 50 messages
);
```

---

## Backup and Recovery

### Automated Backups

Firebase Firestore supports scheduled exports:

1. Go to **Firebase Console** → **Firestore Database**
2. Navigate to **Import/Export**
3. Set up scheduled exports to Cloud Storage
4. Configure retention policy

### Manual Export

```bash
gcloud firestore export gs://[BUCKET_NAME] \
  --project=[PROJECT_ID] \
  --collection-ids=users,doctors,products
```

### Manual Import

```bash
gcloud firestore import gs://[BUCKET_NAME]/[EXPORT_FOLDER] \
  --project=[PROJECT_ID]
```

---

## Monitoring and Analytics

### Track Database Usage

1. **Firebase Console** → **Firestore Database** → **Usage**
   - Document reads/writes/deletes
   - Storage usage
   - Network bandwidth

2. **Set up Alerts**
   - Alert when approaching quota limits
   - Monitor expensive queries
   - Track error rates

### Analyze Query Performance

```javascript
// Enable Firebase Performance Monitoring
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);

// Queries are automatically tracked
```

---

## Related Documentation

- [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md) - Security rules setup
- [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md) - Auth integration
- [USER_PORTAL.md](./USER_PORTAL.md) - User data flows
- [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md) - Doctor data flows
- [FEATURES_AND_WORKFLOWS.md](./FEATURES_AND_WORKFLOWS.md) - Feature implementations

---

**Database documentation complete!** For questions about specific queries or data structures, refer to the relevant feature documentation.
