# User Portal Documentation

**Last Updated**: October 2025

Complete documentation of all features available to users (patients/clients) in the Ambé Wellness platform.

---

## Table of Contents

1. [Overview](#overview)
2. [User Dashboard](#user-dashboard)
3. [User Onboarding](#user-onboarding)
4. [Health Questionnaire](#health-questionnaire)
5. [Doctor Matching](#doctor-matching)
6. [Consultations](#consultations)
7. [Subscription Management](#subscription-management)
8. [Store & Shopping](#store--shopping)
9. [Cart & Checkout](#cart--checkout)
10. [Referral Program](#referral-program)
11. [Messaging](#messaging)
12. [Profile Management](#profile-management)
13. [Purchase History](#purchase-history)
14. [Notifications](#notifications)

---

## Overview

The User Portal is the patient/client-facing side of the Ambé Wellness platform. Users can:

- Complete health assessments
- Get matched with doctors
- Schedule and attend video consultations
- Purchase wellness products
- Message their assigned doctor
- Manage subscriptions
- Track referrals and earn credits

### User Journey Flow

```
Sign Up → Complete Questionnaire → Get Matched with Doctor
    ↓
Subscribe ($50/month) → Schedule First Consultation
    ↓
Video Consultation → Receive Report → Ongoing Messaging
    ↓
Browse Store → Purchase Products (with discounts) → Refer Friends
```

### Access

**Base Route**: `/user/*`

All user routes are protected and require:
- Authentication (`user` must be logged in)
- User type verification (`userType === "user"`)

---

## User Dashboard

**Location**: `src/app/(dashboard)/user/home/page.jsx:1`

**Route**: `/user/home`

### Features

The dashboard displays:

1. **Personalized Greeting**: "Hello {firstName},"
2. **Things To Do**: Dynamic task list based on user progress
3. **Quick Actions**: Shortcut buttons to main features
4. **Coming Soon**: Announcements for future features

### Things To Do System

Dynamic task list that changes based on user state:

#### Task: Become a User
**Condition**: `!profile?.subscription?.active`

```javascript
{
  id: 'become-user',
  title: 'Become a user',
  subtitle: 'Become a user to save on products recommended by our doctors...',
  onSelect: () => router.push('/user/payment')
}
```

#### Task: Checkout Personalized Products
**Condition**: `profile?.is_first_consultation_completed`

```javascript
{
  id: 'view-products',
  title: 'Checkout your personalized products',
  subtitle: 'Checkout the personalized products recommended for you...',
  onSelect: () => router.push('/user/cart')
}
```

#### Task: View Latest Consultation Results
**Condition**: `profile?.is_first_consultation_completed`

```javascript
{
  id: 'view-consult',
  title: 'View latest consultation results',
  subtitle: 'View your personalized report on your latest consultation...',
  onSelect: () => navigateToLatestConsultationResults()
}
```

#### Task: Review Questionnaire Results
**Condition**: `profile?.is_free_questionnaire_completed`

```javascript
{
  id: 'view-questionnaire',
  title: 'Review questionnaire results',
  subtitle: 'Review your personalized report on your unique constitution',
  onSelect: () => router.push('/user/menu/questionnaire/results')
}
```

#### Task: Complete Questionnaire
**Condition**: `!profile?.is_free_questionnaire_completed`

```javascript
{
  id: 'complete-questionnaire',
  title: 'Complete the questionnaire',
  subtitle: 'Complete the questionnaire to receive a personalized report...',
  onSelect: () => router.push('/user/menu/questionnaire')
}
```

#### Task: Schedule Consultation
**Condition**: `!profile?.is_consultation_set && profile?.is_free_questionnaire_completed`

```javascript
{
  id: 'schedule-consultation',
  title: 'Schedule your consultation',
  subtitle: 'Schedule your consultation with a doctor',
  onSelect: async () => {
    if (profile?.subscription?.active) {
      router.push('/user/consult/schedule');
    } else {
      router.push('/user/payment');
    }
  }
}
```

### Quick Actions

Four main action buttons:

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| Calendar | Consultations | `/user/consult` | Book or view consultations |
| Chat | Messages | `/user/consult/message_doctor` | Chat with doctor |
| Shopping Bag | Store | `/user/store` | Browse products |
| Shopping Cart | Cart | `/user/cart` | View shopping cart |

### Coming Soon Section

```javascript
<div className="bg-gradient-to-r from-purple-500 to-pink-500 ...">
  <h4>Courses section opening soon</h4>
  <p>We are proud to announce our new courses section...</p>
</div>
```

---

## User Onboarding

**Location**: `src/components/auth/UserOnboarding.jsx:1`

**Route**: `/user/get-matched`

### Purpose

Initial onboarding flow for new users to get matched with a doctor.

### Get Matched Page

**Location**: `src/app/(dashboard)/user/get-matched/page.jsx:1`

Guides users through the matching process:
1. Completes health questionnaire (if not done)
2. Analyzes responses
3. Matches with appropriate doctor
4. Shows matched doctor profile

---

## Health Questionnaire

**Location**: `src/app/(dashboard)/user/menu/questionnaire/page.jsx:1`

**Route**: `/user/menu/questionnaire`

### Purpose

Comprehensive health assessment used for:
- Doctor matching
- Personalized recommendations
- Baseline health tracking
- Treatment planning

### Questionnaire Structure

The questionnaire is divided into multiple sections:

#### Section 1: Basic Health History
- Past medical conditions
- Surgeries
- Chronic conditions
- Family history

#### Section 2: Current Symptoms
- Present health concerns
- Symptom severity
- Duration of symptoms
- Impact on daily life

#### Section 3: Lifestyle Assessment
- Exercise habits
- Sleep patterns
- Stress levels
- Work-life balance

#### Section 4: Dietary Habits
- Eating patterns
- Dietary restrictions
- Supplements
- Allergies

#### Section 5: Mental & Emotional Health
- Mood assessment
- Stress management
- Support systems
- Mental health history

### Health Field Mapping

Responses are categorized into health fields:

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
  behavorial: "Behavorial"
};
```

### Questionnaire Results

**Route**: `/user/menu/questionnaire/results`

**Location**: `src/app/(dashboard)/user/menu/questionnaire/results/page.jsx:1`

Displays:
- Health score
- Primary concerns identified
- Recommended focus areas
- Matched doctor information
- Next steps

### Database Storage

Responses stored in:
```
/users/{userId}/profile/{profileId}
{
  questionnaire_responses: {
    section1: {...},
    section2: {...},
    section3: {...},
    section4: {...},
    section5: {...}
  },
  health_score: number,
  primary_concerns: string[]
}
```

---

## Doctor Matching

### Matching Algorithm

Users are matched with doctors based on:

1. **Primary Health Field**: Main health concerns
2. **Doctor Specialization**: Doctor's expertise areas
3. **Doctor Availability**: Currently accepting patients
4. **Verification Status**: Only verified doctors
5. **Patient Load**: Balanced distribution

### Matching Flow

```
Complete Questionnaire
    ↓
System analyzes primary_health_field
    ↓
Query doctors collection:
  - specialization matches health field
  - accepting_new_patients === true
  - verification_status === "Verified"
  - Sort by fewest current patients
    ↓
Select best match
    ↓
Update user.doctor = doctor.uid
Update doctor's users subcollection
    ↓
Notify both user and doctor
```

### Updating User with Doctor Assignment

```javascript
await updateDoc(doc(db, 'users', userId), {
  doctor: doctorId,
  doctor_name: `Dr. ${doctorData.last_name}`
});

// Add user to doctor's users subcollection
await setDoc(doc(db, 'doctors', doctorId, 'users', userId), {
  user_uid: userId,
  user_name: userName,
  user_email: userEmail,
  assigned_at: serverTimestamp(),
  primary_health_concerns: healthConcerns,
  health_field: primaryHealthField
});
```

---

## Consultations

### Consultation Overview

**Route**: `/user/consult`

**Location**: `src/app/(dashboard)/user/consult/page.jsx:1`

Displays:
- Upcoming consultations
- Past consultations
- Schedule new consultation button

### Scheduling Consultation

**Route**: `/user/consult/schedule`

**Location**: `src/app/(dashboard)/user/consult/schedule/page.jsx:1`

#### Prerequisites

1. ✅ Questionnaire completed
2. ✅ Matched with doctor
3. ✅ Active subscription ($50/month)

#### Scheduling Process

```
User selects date
    ↓
Fetch doctor's availability for that day
    ↓
Display available time slots (in user's timezone)
    ↓
User selects time slot
    ↓
Create appointment document (dual storage):
  - /users/{userId}/appointments_upcoming/{appointmentId}
  - /doctors/{doctorId}/appointments_upcoming/{appointmentId}
    ↓
Send confirmation notification
```

#### Timezone Handling

```javascript
import moment from 'moment-timezone';

// Doctor availability stored in doctor's timezone
const doctorTZ = doctorProfile.timezone; // e.g., "America/Los_Angeles"
const userTZ = userProfile.timezone;     // e.g., "America/New_York"

// Convert time slots to user's timezone for display
const userLocalTime = moment.tz(appointmentTime, doctorTZ)
  .tz(userTZ)
  .format('h:mm A z');
```

### Video Consultation

**Route**: `/user/consult/appointment/{id}`

**Location**: `src/app/(dashboard)/user/consult/appointment/[id]/page.jsx:1`

#### Before Consultation

Shows:
- Consultation details
- Doctor information
- Scheduled time (in user timezone)
- Join button (enabled 5 minutes before)

#### During Consultation

Uses Agora SDK for video:
- Full-screen video interface
- Camera/mic controls
- End call button
- Connection status indicator

See [INTEGRATIONS.md](./INTEGRATIONS.md) for Agora implementation details.

#### After Consultation

- Doctor creates report
- User receives notification
- Report available at `/user/consult/report/{documentID}`

### Consultation Report

**Route**: `/user/consult/report/{documentID}`

**Location**: `src/app/(dashboard)/user/consult/report/[documentID]/page.jsx:1`

Displays:
- Consultation summary
- Doctor's recommendations
- Prescribed products
- Follow-up needed
- Next steps

Report Structure:
```javascript
{
  appointment_id: string,
  doctor_name: string,
  time: Timestamp,
  report: {
    summary: string,
    recommendations: string[],
    prescribed_products: string[],
    follow_up_needed: boolean,
    follow_up_date: Timestamp,
    notes: string
  }
}
```

### Consultation History

**Route**: `/user/consult/history`

**Location**: `src/app/(dashboard)/user/consult/history/page.jsx:1`

List of past consultations with:
- Date and time
- Doctor name
- View report button
- Leave feedback option

---

## Subscription Management

**Route**: `/user/payment`

**Location**: `src/app/(dashboard)/user/payment/page.jsx:1`

### Subscription Details

**Price**: $50/month

**Benefits**:
- Unlimited text messaging with doctor
- Video consultation access
- $50 discount on store products
- Priority scheduling

### Subscription Flow

```
User clicks "Subscribe"
    ↓
Redirect to Stripe Checkout
    ↓
User enters payment details
    ↓
Stripe processes payment
    ↓
Webhook updates Firestore:
  users/{userId}.subscription = {
    active: true,
    status: "active",
    stripe_customer_id: string,
    stripe_subscription_id: string,
    current_period_end: Timestamp
  }
    ↓
User redirected back to dashboard
```

### Subscription States

| Status | Description | User Access |
|--------|-------------|-------------|
| **active** | Subscription current | Full access |
| **past_due** | Payment failed | Limited access |
| **canceled** | User canceled | Access until period end |
| **unpaid** | Multiple failed payments | No access |

### Managing Subscription

Users can:
- View subscription status
- Update payment method
- Cancel subscription
- View billing history

### Subscription Discount on Store

Applied automatically at checkout:

```javascript
// In cart calculation
const getSubscriptionDiscount = () => {
  return userSubscription?.active ? 50.0 : 0;
};

const total = subtotal + tax + shipping - subscriptionDiscount - referralDiscount;
```

---

## Store & Shopping

**Route**: `/user/store`

**Location**: `src/app/(dashboard)/user/store/page.jsx:1`

### Store Features

1. **Product Catalog**: Browse all available products
2. **Search**: Search products by name/description
3. **Category Filter**: Filter by product category
4. **Doctor Recommendations**: Highlighted recommended products
5. **Cart Management**: Add to cart with variants/quantities

### Product Display

Each product card shows:
- Product image
- Product name
- Description
- Price
- Discount badge (if applicable)
- Variant selector (size/type)
- Quantity selector
- "Add to Cart" button

### Product Variants

Products can have multiple variants (sizes/options):

```javascript
{
  id: string,
  name: "Wellness Supplement",
  variants: [
    {
      id: "variant_1",
      name: "30 capsules",
      price: 29.99,
      original_price: 39.99
    },
    {
      id: "variant_2",
      name: "60 capsules",
      price: 49.99,
      original_price: 69.99
    }
  ]
}
```

### Adding to Cart

```javascript
async function addToCart() {
  if (variants.length > 0 && !selectedVariant) {
    alert('Please select a variant');
    return;
  }

  try {
    const cartRef = collection(db, 'users', user.uid, 'cart');
    const q = query(
      cartRef,
      where('productId', '==', product.id),
      where('variantId', '==', selectedVariant || 'default')
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      // Update existing cart item
      const docRef = snap.docs[0].ref;
      const currentQty = snap.docs[0].data().quantity;
      await updateDoc(docRef, {
        quantity: currentQty + quantity,
        updatedAt: new Date()
      });
    } else {
      // Add new cart item
      await addDoc(cartRef, {
        productId: product.id,
        productName: product.name,
        variantId: selectedVariant || 'default',
        variantName: selectedVariantData?.name || 'Standard',
        price: price,
        originalPrice: originalPrice,
        quantity: quantity,
        imageUrl: product.imageUrl,
        addedAt: new Date()
      });
    }

    alert('Added to cart successfully!');
  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('Failed to add to cart');
  }
}
```

### Doctor Recommendations

Products recommended by doctor are highlighted:

```javascript
{
  doctor_recommended: true,
  product_name: string,
  size: string,
  quantity: number,
  reason: string
}
```

---

## Cart & Checkout

### Shopping Cart

**Route**: `/user/cart`

**Location**: `src/app/(dashboard)/user/cart/page.jsx:1`

#### Cart Features

1. **Item List**: All items with quantities
2. **Quantity Adjustment**: Increase/decrease quantity
3. **Remove Items**: Delete from cart
4. **Doctor Recommendations**: Add recommended products
5. **Order Summary**: Subtotal, tax, shipping, discounts
6. **Checkout Button**: Proceed to payment

#### Cart Display

Each cart item shows:
- Product name
- Variant/size
- Price
- Quantity controls (+/-)
- Remove button
- "RECOMMENDED" badge (if applicable)

#### Cart Real-time Updates

Cart uses Firestore real-time listeners:

```javascript
useEffect(() => {
  const cartQuery = query(collection(db, 'users', user.uid, 'cart'));

  const unsubscribe = onSnapshot(cartQuery, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCartItems(items);
    setLoading(false);
  });

  return () => unsubscribe(); // Cleanup
}, [user]);
```

#### Price Calculation

```javascript
const subtotal = cartItems.reduce((sum, item) =>
  sum + (item.price * item.quantity), 0
);

const tax = subtotal * 0.10;  // 10% tax

const shipping = 10.0;  // Fixed shipping

const subscriptionDiscount = userSubscription?.active ? 50.0 : 0;

const referralDiscount = referralInfo.isFirstTimeReferred || referralInfo.credits > 0
  ? subtotal * 0.25  // 25% off
  : 0;

const total = subtotal + tax + shipping - subscriptionDiscount - referralDiscount;
```

### Checkout Process

**Route**: `/user/checkout`

**Location**: `src/app/(dashboard)/user/checkout/page.jsx:1`

#### Checkout Flow

```
User clicks "CHECKOUT"
    ↓
Display order summary
    ↓
Apply discounts:
  - Subscription discount ($50)
  - Referral discount (25%)
    ↓
Create Stripe Checkout Session
    ↓
Redirect to Stripe hosted checkout
    ↓
User enters payment details
    ↓
Stripe processes payment
    ↓
Redirect to success page
    ↓
Webhook updates Firestore:
  - Clear cart
  - Create order record
  - Update referral credits (if applicable)
  - Update has_made_purchase flag
```

#### Checkout Success

**Route**: `/user/checkout/success`

**Location**: `src/app/(dashboard)/user/checkout/success/page.jsx:1`

Displays:
- Order confirmation
- Order number
- Expected delivery
- Track order button

---

## Referral Program

**Route**: `/user/referral`

**Location**: `src/app/(dashboard)/user/referral/page.jsx:1`

### Referral System Overview

Both referrer and referee get **25% off** their next order.

### Referral Code Generation

Each user gets a unique 8-character code:

```javascript
async function generateReferralCode() {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data();
  let code = userData.referral_code;

  if (!code) {
    // Generate from first 8 chars of UID
    code = user.uid.substring(0, 8).toUpperCase();
    await updateDoc(doc(db, 'users', user.uid), {
      referral_code: code
    });
  }

  return code;
}
```

### How It Works

1. **User A** shares their referral code
2. **User B** signs up using the code
3. **User B** gets 25% off first purchase
4. **User A** gets credit for 25% off next purchase
5. No limit on number of referrals

### Referral Tracking

```javascript
// When User B signs up with referral code
await updateDoc(doc(db, 'users', userB_uid), {
  referred_by: userA_uid,
  has_made_purchase: false
});

// When User B makes first purchase
await updateDoc(doc(db, 'users', userA_uid), {
  referral_count: increment(1),
  referral_credits: increment(1)
});

await updateDoc(doc(db, 'users', userB_uid), {
  has_made_purchase: true
});
```

### Referral Stats Display

Shows:
- Unique referral code
- Copy button
- Share button (native share API)
- Friends referred count
- Discounts available count

### Sharing Referral Code

```javascript
function shareReferralCode() {
  const message = `Join Ambe Wellness and get 25% off your first order! Use my referral code: ${referralCode}`;

  if (navigator.share) {
    navigator.share({
      title: 'Join Ambe Wellness',
      text: message,
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(message);
  }
}
```

---

## Messaging

**Route**: `/user/consult/message_doctor`

**Location**: `src/app/(dashboard)/user/consult/message_doctor/page.jsx:1`

### Prerequisites

- Must have assigned doctor
- First consultation must be completed
- Subscription must be active (for unlimited messaging)

### Messaging Features

1. **Real-time Chat**: Instant message delivery
2. **Message History**: Scrollable conversation
3. **Typing Indicator**: See when doctor is typing
4. **Read Receipts**: See when messages are read
5. **File Attachments**: Share images/documents

### Message Structure

```javascript
{
  message_id: string,
  sender_uid: string,
  sender_name: string,
  sender_type: "user" | "doctor",
  receiver_uid: string,
  receiver_name: string,
  message: string,
  timestamp: Timestamp,
  read: boolean,
  read_at: Timestamp,
  image_url: string,  // Optional
  file_url: string    // Optional
}
```

### Real-time Implementation

```javascript
useEffect(() => {
  const messagesRef = collection(db, 'users', userId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setMessages(messages);
    scrollToBottom();
  });

  return () => unsubscribe();
}, [userId]);
```

### Sending Messages

Messages stored in both user and doctor collections for dual access:

```javascript
async function sendMessage(messageText) {
  const messageData = {
    sender_uid: user.uid,
    sender_name: profile.first_name + ' ' + profile.last_name,
    sender_type: 'user',
    receiver_uid: profile.doctor,
    receiver_name: profile.doctor_name,
    message: messageText,
    timestamp: serverTimestamp(),
    read: false
  };

  // Add to user's messages
  await addDoc(collection(db, 'users', user.uid, 'messages'), messageData);

  // Add to doctor's messages
  await addDoc(collection(db, 'doctors', profile.doctor, 'messages'), messageData);
}
```

---

## Profile Management

**Route**: `/user/menu`

**Location**: `src/app/(dashboard)/user/menu/page.jsx:1`

### Profile Options

1. **Update Name**: Change first/last name
2. **Update Email**: Change email address
3. **Update Password**: Change password
4. **View Questionnaire**: Review health questionnaire
5. **Purchase History**: View past orders
6. **Subscription Settings**: Manage subscription
7. **Logout**: Sign out

### Update Name

**Route**: `/user/menu/name`

```javascript
async function updateName(firstName, lastName) {
  await updateDoc(doc(db, 'users', user.uid), {
    first_name: firstName,
    last_name: lastName,
    updated_at: serverTimestamp()
  });
}
```

### Update Email

**Route**: `/user/menu/email`

```javascript
import { updateEmail } from 'firebase/auth';

async function updateUserEmail(newEmail) {
  // Update Firebase Auth
  await updateEmail(user, newEmail);

  // Update Firestore
  await updateDoc(doc(db, 'users', user.uid), {
    email: newEmail,
    updated_at: serverTimestamp()
  });
}
```

### Update Password

**Route**: `/user/menu/password`

```javascript
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

async function changePassword(currentPassword, newPassword) {
  // Re-authenticate first
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Update password
  await updatePassword(user, newPassword);
}
```

---

## Purchase History

**Route**: `/user/menu/purchase_history`

**Location**: `src/app/(dashboard)/user/menu/purchase_history/page.jsx:1`

### Displays

- Order date
- Order number
- Items purchased
- Total amount
- Order status
- Tracking information (if available)

### Order Structure

```javascript
{
  order_id: string,
  user_id: string,
  order_date: Timestamp,
  status: "pending" | "processing" | "shipped" | "delivered",
  items: [
    {
      product_name: string,
      quantity: number,
      price: number
    }
  ],
  subtotal: number,
  tax: number,
  shipping: number,
  discounts: number,
  total: number,
  shipping_address: object,
  tracking_number: string
}
```

---

## Notifications

**Route**: `/user/notifications`

**Location**: `src/app/(dashboard)/user/notifications/page.jsx:1`

### Notification Types

1. **Consultation Reminders**: 24 hours and 1 hour before
2. **New Messages**: When doctor sends message
3. **Report Ready**: When consultation report available
4. **Subscription Renewal**: Before card is charged
5. **Order Updates**: Shipping and delivery updates
6. **Referral Credits**: When referral makes purchase

### Notification Structure

```javascript
{
  notification_id: string,
  user_id: string,
  type: string,
  title: string,
  message: string,
  read: boolean,
  created_at: Timestamp,
  action_url: string  // Where to navigate on click
}
```

---

## Related Documentation

- [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md) - User authentication
- [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) - User data structure
- [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md) - Doctor-side features
- [FEATURES_AND_WORKFLOWS.md](./FEATURES_AND_WORKFLOWS.md) - Detailed workflows
- [INTEGRATIONS.md](./INTEGRATIONS.md) - Stripe and Agora integration

---

**User Portal documentation complete!** For doctor-side features, see [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md).
