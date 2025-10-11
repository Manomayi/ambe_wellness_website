# Doctor Portal Documentation

**Last Updated**: October 2025

Complete documentation of all features available to healthcare providers (doctors) in the Ambé Wellness platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Doctor Dashboard](#doctor-dashboard)
3. [Verification System](#verification-system)
4. [Schedule Management](#schedule-management)
5. [User Management](#user-management)
6. [Consultations](#consultations)
7. [Consultation Reports](#consultation-reports)
8. [Messaging System](#messaging-system)
9. [Profile Management](#profile-management)
10. [Feedback & Ratings](#feedback--ratings)

---

## Overview

The Doctor Portal is the healthcare provider interface of the Ambé Wellness platform. Doctors can:

- Manage their schedule and availability
- View and manage assigned users (patients)
- Conduct video consultations
- Create post-consultation reports
- Message assigned users
- Track pending tasks and consultations

### Doctor Journey Flow

```
Sign Up → Submit Verification Documents → Get Verified
    ↓
Set Weekly Schedule → Get Assigned Users
    ↓
View Upcoming Consultations → Conduct Video Calls
    ↓
Create Consultation Reports → Message with Users
    ↓
Receive Ratings/Feedback → Track Performance
```

### Access

**Base Route**: `/doctor/*`

All doctor routes are protected and require:
- Authentication (`user` must be logged in)
- User type verification (`userType === "doctor"`)
- Some features require verification status

---

## Doctor Dashboard

**Location**: `src/app/(dashboard)/doctor/dashboard/page.jsx:1`

**Route**: `/doctor/dashboard`

### Dashboard Overview

The main dashboard displays:

1. **Welcome Message**: "Welcome back, Dr. {lastName}"
2. **Verification Warning**: If not verified
3. **Stats Grid**: Key metrics
4. **Quick Actions**: Shortcut buttons
5. **Upcoming Appointments**: Next 5 consultations
6. **Schedule Reminder**: If schedule not set

### Stats Grid

Four key metrics displayed:

| Metric | Description | Icon | Query |
|--------|-------------|------|-------|
| **Total Users** | Number of assigned users | UserGroupIcon | Count in `/doctors/{uid}/users` |
| **Upcoming Consultations** | Next consultations | CalendarIcon | Count in `appointments_upcoming` |
| **Pending Reports** | Reports to complete | DocumentTextIcon | `profile.pending.finish_report` |
| **Completed Consultations** | Total completed | CheckCircleIcon | Count in `appointments_completed` |

### Implementation

```javascript
// src/app/(dashboard)/doctor/dashboard/page.jsx

const fetchDashboardData = async () => {
  try {
    // Fetch total users
    const usersQuery = collection(db, `doctors/${user.uid}/users`);
    const usersSnapshot = await getDocs(usersQuery);
    const totalUsers = usersSnapshot.size;

    // Fetch upcoming consultations
    const now = Timestamp.now();
    const upcomingQuery = query(
      collection(db, `doctors/${user.uid}/appointments_upcoming`),
      where('time', '>=', now),
      orderBy('time', 'asc'),
      limit(5)
    );
    const upcomingSnapshot = await getDocs(upcomingQuery);
    const upcomingList = upcomingSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch completed consultations count
    const completedQuery = collection(db, `doctors/${user.uid}/appointments_completed`);
    const completedSnapshot = await getDocs(completedQuery);
    const completedCount = completedSnapshot.size;

    // Get pending reports from profile
    const pendingReports = profile?.pending?.finish_report || 0;

    setStats({
      totalUsers,
      upcomingConsultations: upcomingList.length,
      pendingReports,
      completedConsultations: completedCount,
    });
    setUpcomingAppointments(upcomingList);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
};
```

### Verification Warning

Displayed when `profile.verification_status !== "Verified"`:

```javascript
{!isVerifiedDoctor && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <h3 className="font-semibold text-yellow-800">Verification Pending</h3>
    <p className="text-yellow-700 text-sm mt-1">
      Your account is under review. You'll be able to see users once verified.
    </p>
    <button onClick={() => router.push('/doctor/menu/verification')}>
      Check verification status
    </button>
  </div>
)}
```

### Quick Actions

Three main action buttons:

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| Calendar | View Consultations | `/doctor/consultations` | Manage consultations |
| Clock | Messages | `/doctor/messages` | Chat with users |
| UserGroup | My Users | `/doctor/users` | View assigned users |

### Upcoming Appointments Section

Displays next 5 appointments with:
- User name
- Appointment time (formatted)
- Click to view consultations page

```javascript
{upcomingAppointments.map((appointment, index) => (
  <div
    key={appointment.id}
    className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
    onClick={() => router.push(`/doctor/consultations`)}
  >
    <div>
      <p className="font-semibold text-gray-800">{appointment.user_name}</p>
      <p className="text-sm text-gray-600">
        {formatAppointmentTime(appointment.time)}
      </p>
    </div>
    <ClockIcon className="h-5 w-5 text-gray-400" />
  </div>
))}
```

---

## Verification System

### Verification Status

**Location**: `src/app/(dashboard)/doctor/menu/verification/page.jsx:1`

**Route**: `/doctor/menu/verification`

### Verification States

| Status | Description | User Access |
|--------|-------------|-------------|
| **Pending** | Documents submitted, awaiting review | Limited access |
| **Verified** | Approved by admin | Full access |
| **Rejected** | Verification failed | Re-submit required |

### Required Documents

Doctors must submit:
1. **Medical License**: Copy of active license
2. **Government ID**: Driver's license or passport
3. **Professional Certificate**: Relevant certifications
4. **Proof of Practice**: Hospital affiliation or practice verification

### Document Upload

```javascript
async function uploadVerificationDocument(file) {
  try {
    // Upload to Firebase Storage
    const storageRef = ref(storage, `verification/${user.uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Update doctor document
    await updateDoc(doc(db, 'doctors', user.uid), {
      verification_documents: arrayUnion(downloadURL),
      verification_status: 'Pending',
      verification_submitted_at: serverTimestamp()
    });

    alert('Document uploaded successfully');
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload document');
  }
}
```

### Admin Verification Process

1. Admin reviews documents in Firebase Console
2. Updates `verification_status` to "Verified" or "Rejected"
3. If verified:
   - `verified_at: serverTimestamp()`
   - Doctor gains full access
4. If rejected:
   - Add `rejection_reason` field
   - Doctor can re-submit

---

## Schedule Management

**Location**: `src/app/(dashboard)/doctor/schedule/page.jsx:1`

**Route**: `/doctor/schedule`

### Purpose

Set weekly availability for user consultations.

### Schedule Structure

```javascript
{
  monday: {
    isAvailable: boolean,
    startTime: string,      // "09:00"
    endTime: string         // "17:00"
  },
  tuesday: {...},
  wednesday: {...},
  thursday: {...},
  friday: {...},
  saturday: {...},
  sunday: {...}
}
```

### Time Slots

Available in 30-minute increments:

```javascript
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00'
];
```

### Timezone Selection

Doctors choose their timezone:

```javascript
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London Time' },
  { value: 'Asia/Kolkata', label: 'India Time' },
  // ... more timezones
];
```

### Schedule Validation

Before saving, validates:
1. At least one day is available
2. End time is after start time for each day
3. Both start and end times are set for available days

```javascript
const validateSchedule = () => {
  for (const day of DAYS_OF_WEEK) {
    if (schedule[day].isAvailable) {
      const start = schedule[day].startTime;
      const end = schedule[day].endTime;

      if (!start || !end) {
        alert(`Please set both start and end times for ${day}`);
        return false;
      }

      if (start >= end) {
        alert(`End time must be after start time for ${day}`);
        return false;
      }
    }
  }

  // Check if at least one day is available
  const hasAvailableDay = DAYS_OF_WEEK.some(day => schedule[day].isAvailable);
  if (!hasAvailableDay) {
    alert('Please set availability for at least one day');
    return false;
  }

  return true;
};
```

### Saving Schedule

```javascript
const handleSave = async () => {
  if (!validateSchedule()) return;

  try {
    await updateDoc(doc(db, 'doctors', user.uid), {
      schedule,
      timezone,
      is_schedule_set: true,
      updated_at: serverTimestamp()
    });

    alert('Schedule saved successfully');
  } catch (error) {
    console.error('Error saving schedule:', error);
    alert('Failed to save schedule');
  }
};
```

### How Users See Availability

When users book:
1. System loads doctor's schedule and timezone
2. Generates available slots for selected date
3. Converts slots to user's timezone
4. Displays in user-friendly format

---

## User Management

**Location**: `src/app/(dashboard)/doctor/users/page.jsx:1`

**Route**: `/doctor/users`

### User List

Displays all assigned users/patients.

### User Data Structure

```javascript
// /doctors/{doctorId}/users/{userId}
{
  user_uid: string,
  user_name: string,
  user_email: string,
  assigned_at: Timestamp,
  first_consultation_completed: boolean,
  last_consultation: Timestamp,
  total_consultations: number,
  primary_health_concerns: string[],
  health_field: string,
  next_appointment: Timestamp,
  has_pending_messages: boolean,
  doctor_notes: string
}
```

### View User Profile

**Route**: `/doctor/users/{userUid}`

**Location**: `src/app/(dashboard)/doctor/users/[userUid]/page.jsx:1`

Displays:
- User's full name and contact
- Primary health concerns
- Health field category
- Consultation history count
- Next scheduled appointment
- View questionnaire button
- Add notes section

### View User Questionnaire

**Route**: `/doctor/users/{userUid}/questionnaire`

**Location**: `src/app/(dashboard)/doctor/users/[userUid]/questionnaire/page.jsx:1`

Shows user's health questionnaire responses:
- All section responses
- Health score
- Primary concerns
- Doctor's previous notes

### Add Doctor Notes

Doctors can add private notes about users:

```javascript
async function saveNotes(userId, notes) {
  await updateDoc(doc(db, 'doctors', doctorId, 'users', userId), {
    doctor_notes: notes,
    notes_updated_at: serverTimestamp()
  });
}
```

---

## Consultations

### Consultations Overview

**Route**: `/doctor/consultations`

**Location**: `src/app/(dashboard)/doctor/consultations/page.jsx:1`

Three tabs:

1. **Upcoming**: Future consultations
2. **Pending Reports**: Completed but no report
3. **History**: Past consultations with reports

### Upcoming Consultations

Displays list with:
- User name
- Scheduled time (in doctor's timezone)
- Join button (enabled 5 minutes before)
- Status indicator

```javascript
const upcomingQuery = query(
  collection(db, 'doctors', doctorId, 'appointments_upcoming'),
  where('time', '>=', Timestamp.now()),
  orderBy('time', 'asc')
);
```

### Video Consultation

**Route**: `/doctor/consultations/appointment/{id}`

**Location**: `src/app/(dashboard)/doctor/consultations/appointment/[id]/page.jsx:1`

#### Features During Consultation

- Full-screen video interface
- User video feed
- Doctor video feed
- Camera/mic toggle controls
- Screen sharing capability
- End consultation button
- Timer display
- Connection quality indicator

See [INTEGRATIONS.md](./INTEGRATIONS.md) for Agora implementation.

### Consultation History

**Route**: `/doctor/consultations/history`

**Location**: `src/app/(dashboard)/doctor/consultations/history/page.jsx:1`

List of completed consultations:
- User name
- Date/time
- View report link
- User feedback/rating

---

## Consultation Reports

**Route**: `/doctor/consultations/report/{documentID}`

**Location**: `src/app/(dashboard)/doctor/consultations/report/[documentID]/page.jsx:1`

### Report Creation

After consultation, doctor creates report with:

1. **Consultation Summary**: Overview of discussion
2. **Recommendations**: Treatment recommendations
3. **Prescribed Products**: Suggested wellness products
4. **Follow-up Needed**: Yes/No
5. **Follow-up Date**: If follow-up needed
6. **Additional Notes**: Private doctor notes

### Report Structure

```javascript
{
  appointment_id: string,
  user_uid: string,
  user_name: string,
  doctor_uid: string,
  doctor_name: string,
  consultation_date: Timestamp,
  report: {
    summary: string,
    recommendations: string[],
    prescribed_products: [
      {
        product_name: string,
        size: string,
        quantity: number,
        reason: string
      }
    ],
    follow_up_needed: boolean,
    follow_up_date: Timestamp,
    notes: string
  },
  created_at: Timestamp
}
```

### Creating Report

```javascript
async function createConsultationReport(appointmentId, reportData) {
  try {
    // Move appointment from upcoming to completed
    const appointmentRef = doc(
      db,
      'doctors',
      doctorId,
      'appointments_upcoming',
      appointmentId
    );
    const appointmentDoc = await getDoc(appointmentRef);
    const appointmentData = appointmentDoc.data();

    // Create completed appointment with report
    const completedRef = doc(
      db,
      'doctors',
      doctorId,
      'appointments_completed',
      appointmentId
    );
    await setDoc(completedRef, {
      ...appointmentData,
      report: reportData,
      completed_at: serverTimestamp()
    });

    // Mirror in user's collection
    const userCompletedRef = doc(
      db,
      'users',
      appointmentData.user_uid,
      'appointments_completed',
      appointmentId
    );
    await setDoc(userCompletedRef, {
      ...appointmentData,
      report: reportData,
      completed_at: serverTimestamp()
    });

    // Delete from upcoming
    await deleteDoc(appointmentRef);
    const userUpcomingRef = doc(
      db,
      'users',
      appointmentData.user_uid,
      'appointments_upcoming',
      appointmentId
    );
    await deleteDoc(userUpcomingRef);

    // Update user's profile
    await updateDoc(doc(db, 'users', appointmentData.user_uid), {
      is_first_consultation_completed: true
    });

    // Decrease pending reports count
    await updateDoc(doc(db, 'doctors', doctorId), {
      'pending.finish_report': increment(-1)
    });

    // Send notification to user
    // ... notification logic

    alert('Report submitted successfully');
  } catch (error) {
    console.error('Error creating report:', error);
    alert('Failed to submit report');
  }
}
```

### Product Recommendations

When recommending products:

```javascript
// Add to user's cart or recommendations
await updateDoc(doc(db, 'users', userId, 'profile', profileId), {
  store_recommendations: reportData.prescribed_products
});
```

---

## Messaging System

**Route**: `/doctor/messages`

**Location**: `src/app/(dashboard)/doctor/messages/page.jsx:1`

### Messages Overview

Lists all users with conversations:
- User name
- Last message preview
- Unread count badge
- Timestamp of last message

### Chat Interface

**Route**: `/doctor/messages/{userId}`

**Location**: `src/app/(dashboard)/doctor/messages/[id]/page.jsx:1`

#### Features

- Real-time message updates
- Message history
- Send text messages
- Image attachments
- Typing indicators
- Read receipts
- Scroll to latest

### Message Structure

```javascript
{
  message_id: string,
  sender_uid: string,
  sender_name: string,
  sender_type: "doctor" | "user",
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

### Real-time Message Listener

```javascript
useEffect(() => {
  const messagesRef = collection(db, 'doctors', doctorId, 'messages');
  const q = query(
    messagesRef,
    where('receiver_uid', '==', userId),  // Messages from this user
    orderBy('timestamp', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setMessages(messages);
    markAsRead(messages);
    scrollToBottom();
  });

  return () => unsubscribe();
}, [doctorId, userId]);
```

### Sending Messages

```javascript
async function sendMessage(messageText) {
  const messageData = {
    sender_uid: doctorId,
    sender_name: `Dr. ${profile.last_name}`,
    sender_type: 'doctor',
    receiver_uid: userId,
    receiver_name: userName,
    message: messageText,
    timestamp: serverTimestamp(),
    read: false
  };

  // Add to doctor's messages
  await addDoc(
    collection(db, 'doctors', doctorId, 'messages'),
    messageData
  );

  // Add to user's messages
  await addDoc(
    collection(db, 'users', userId, 'messages'),
    messageData
  );

  // Send push notification to user
  // ... notification logic
}
```

### Mark Messages as Read

```javascript
async function markAsRead(messages) {
  const unreadMessages = messages.filter(
    msg => !msg.read && msg.sender_type === 'user'
  );

  for (const msg of unreadMessages) {
    // Update in doctor's collection
    await updateDoc(
      doc(db, 'doctors', doctorId, 'messages', msg.id),
      {
        read: true,
        read_at: serverTimestamp()
      }
    );

    // Update in user's collection (mirror)
    await updateDoc(
      doc(db, 'users', msg.sender_uid, 'messages', msg.id),
      {
        read: true,
        read_at: serverTimestamp()
      }
    );
  }
}
```

---

## Profile Management

**Route**: `/doctor/menu`

**Location**: `src/app/(dashboard)/doctor/menu/page.jsx:1`

### Profile Options

1. **Update Name**: Change first/last name
2. **Update Email**: Change email address
3. **Update Password**: Change password
4. **Verification Status**: Check verification
5. **View Feedback**: See user ratings/feedback
6. **Logout**: Sign out

### Update Name

**Route**: `/doctor/menu/name`

**Location**: `src/app/(dashboard)/doctor/menu/name/page.jsx:1`

```javascript
async function updateName(firstName, lastName) {
  await updateDoc(doc(db, 'doctors', doctorId), {
    first_name: firstName,
    last_name: lastName,
    updated_at: serverTimestamp()
  });
}
```

### Update Email

**Route**: `/doctor/menu/email`

**Location**: `src/app/(dashboard)/doctor/menu/email/page.jsx:1`

```javascript
import { updateEmail } from 'firebase/auth';

async function updateDoctorEmail(newEmail) {
  // Update Firebase Auth
  await updateEmail(user, newEmail);

  // Update Firestore
  await updateDoc(doc(db, 'doctors', doctorId), {
    email: newEmail,
    updated_at: serverTimestamp()
  });
}
```

### Update Password

**Route**: `/doctor/menu/password`

**Location**: `src/app/(dashboard)/doctor/menu/password/page.jsx:1`

```javascript
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

async function changePassword(currentPassword, newPassword) {
  // Re-authenticate
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Update password
  await updatePassword(user, newPassword);
}
```

---

## Feedback & Ratings

**Route**: `/doctor/menu/feedback`

**Location**: `src/app/(dashboard)/doctor/menu/feedback/page.jsx:1`

### View Ratings

Displays all user feedback:
- Average rating (out of 5)
- Total ratings count
- Individual feedback items with:
  - User name
  - Rating (stars)
  - Written feedback
  - Date

### Feedback Structure

Stored in completed appointments:

```javascript
{
  appointment_id: string,
  user_name: string,
  user_rating: number,        // 1-5
  user_feedback: string,
  feedback_submitted_at: Timestamp
}
```

### Calculate Average Rating

```javascript
async function calculateAverageRating() {
  const completedQuery = query(
    collection(db, 'doctors', doctorId, 'appointments_completed'),
    where('user_rating', '>', 0)
  );

  const snapshot = await getDocs(completedQuery);
  const ratings = snapshot.docs.map(doc => doc.data().user_rating);

  if (ratings.length === 0) return 0;

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  const average = sum / ratings.length;

  // Update doctor profile
  await updateDoc(doc(db, 'doctors', doctorId), {
    average_rating: average,
    total_ratings: ratings.length
  });

  return average;
}
```

---

## Performance Tracking

### Key Metrics Tracked

1. **Total Consultations**: Lifetime count
2. **Average Rating**: From user feedback
3. **Response Time**: Average message response time
4. **Completion Rate**: Reports completed on time
5. **User Retention**: Users with repeat consultations

### Statistics Dashboard

```javascript
{
  total_consultations: number,
  average_rating: number,
  total_ratings: number,
  total_users: number,
  consultations_this_month: number,
  pending_reports: number,
  average_response_time_minutes: number
}
```

---

## Doctor Workflow Summary

### Daily Workflow

```
1. Log in to Dashboard
   ↓
2. Check Upcoming Consultations
   ↓
3. Review Pending Messages
   ↓
4. Complete Pending Reports
   ↓
5. Conduct Scheduled Consultations
   ↓
6. Create Consultation Reports
   ↓
7. Respond to User Messages
   ↓
8. Review New Assigned Users
```

### Weekly Tasks

- Update schedule if needed
- Review all user profiles
- Check feedback and ratings
- Plan follow-up consultations

### Monthly Review

- Performance metrics
- User retention rate
- Average consultation ratings
- Pending tasks completion

---

## Related Documentation

- [USER_PORTAL.md](./USER_PORTAL.md) - User-side features
- [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md) - Auth system
- [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) - Doctor data structure
- [INTEGRATIONS.md](./INTEGRATIONS.md) - Agora video implementation
- [FEATURES_AND_WORKFLOWS.md](./FEATURES_AND_WORKFLOWS.md) - Detailed workflows

---

**Doctor Portal documentation complete!** For integration details, see [INTEGRATIONS.md](./INTEGRATIONS.md).
