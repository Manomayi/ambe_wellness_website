# Detailed Next.js Migration Guide - Panacea Wellness Platform

This comprehensive guide provides detailed implementation patterns, code examples, and specific features from the Flutter app for Next.js migration.

## Table of Contents
1. [Project Setup & Configuration](#1-project-setup--configuration)
2. [Authentication Implementation](#2-authentication-implementation)
3. [User Registration Flow](#3-user-registration-flow)
4. [Doctor Features](#4-doctor-features)
5. [User/Patient Features](#5-userpatient-features)
6. [Consultation System](#6-consultation-system)
7. [Messaging System](#7-messaging-system)
8. [E-commerce Implementation](#8-e-commerce-implementation)
9. [Real-time Features](#9-real-time-features)
10. [Utility Functions & Helpers](#10-utility-functions--helpers)
11. [UI Components Library](#11-ui-components-library)
12. [Performance Optimizations](#12-performance-optimizations)
13. [Security Implementation](#13-security-implementation)
14. [Error Handling Patterns](#14-error-handling-patterns)
15. [Testing Strategies](#15-testing-strategies)

---

## 1. Project Setup & Configuration

### Folder Structure
```
src/
├── app/                    # Next.js 13+ app directory
│   ├── (auth)/            # Auth group routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (doctor)/          # Doctor routes
│   │   ├── dashboard/
│   │   ├── consultations/
│   │   ├── messages/
│   │   ├── patients/
│   │   ├── schedule/
│   │   └── profile/
│   ├── (user)/            # User routes
│   │   ├── home/
│   │   ├── consultations/
│   │   ├── store/
│   │   ├── cart/
│   │   └── profile/
│   └── api/               # API routes
├── components/
│   ├── auth/
│   ├── consultations/
│   ├── chat/
│   ├── store/
│   ├── shared/
│   └── ui/
├── hooks/
├── lib/
│   ├── firebase/
│   ├── stripe/
│   ├── agora/
│   └── utils/
├── services/
├── stores/                # State management
└── types/
```

### Firebase Configuration
```typescript
// lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Development emulators
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

---

## 2. Authentication Implementation

### Auth Context with Full Type Safety
```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { UserProfile, DoctorProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  userType: 'user' | 'doctor' | null;
  profile: UserProfile | DoctorProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userType: 'user' | 'doctor') => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isDoctor: boolean;
  isVerifiedDoctor: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'user' | 'doctor' | null>(null);
  const [profile, setProfile] = useState<UserProfile | DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is doctor
        const doctorDoc = await getDoc(doc(db, 'doctors', user.uid));
        const isDoctor = doctorDoc.exists();
        
        setUser(user);
        setUserType(isDoctor ? 'doctor' : 'user');
        
        // Set up real-time profile listener
        const profileUnsubscribe = onSnapshot(
          doc(db, isDoctor ? 'doctors' : 'users', user.uid),
          (doc) => {
            if (doc.exists()) {
              setProfile({ uid: doc.id, ...doc.data() } as any);
            }
          }
        );
        
        return () => profileUnsubscribe();
      } else {
        setUser(null);
        setUserType(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    
    // Check user type
    const doctorDoc = await getDoc(doc(db, 'doctors', user.uid));
    const isDoctor = doctorDoc.exists();
    
    // Navigate based on user type
    window.location.href = isDoctor ? '/doctor/dashboard' : '/user/home';
  };

  const signUp = async (email: string, password: string, userType: 'user' | 'doctor') => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    // Profile creation handled by cloud function
    return user;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    window.location.href = '/login';
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const isDoctor = userType === 'doctor';
  const isVerifiedDoctor = isDoctor && (profile as DoctorProfile)?.verification_status === 'Verified';

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

### Protected Route Middleware
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authToken = request.cookies.get('auth-token');

  // Protected routes
  const isProtectedRoute = 
    pathname.startsWith('/user/') || 
    pathname.startsWith('/doctor/');

  const isAuthRoute = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/signup');

  if (isProtectedRoute && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && authToken) {
    // Redirect to appropriate dashboard
    // Note: You'll need to check user type from token
    return NextResponse.redirect(new URL('/user/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 3. User Registration Flow

### Multi-Step Registration Component
```typescript
// components/auth/SignUpFlow.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PhoneInput from 'react-phone-number-input';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';

// Validation schemas
const basicInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  userType: z.enum(['user', 'doctor']),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const phoneSchema = z.object({
  phone: z.string().regex(/^\+\d{10,15}$/, 'Invalid phone number'),
});

const doctorSpecializationSchema = z.object({
  specialization: z.string(),
  customSpecialization: z.string().optional(),
});

interface SignUpFlowProps {
  initialUserType?: 'user' | 'doctor';
}

export default function SignUpFlow({ initialUserType = 'user' }: SignUpFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Info
  const basicInfoForm = useForm({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      userType: initialUserType,
    },
  });

  const handleBasicInfo = (data: any) => {
    setFormData({ ...formData, ...data });
    setStep(2);
  };

  // Step 2: Phone Number
  const phoneForm = useForm({
    resolver: zodResolver(phoneSchema),
  });

  const handlePhone = (data: any) => {
    setFormData({ ...formData, ...data });
    if (formData.userType === 'doctor') {
      setStep(3); // Go to specialization
    } else {
      submitRegistration({ ...formData, ...data });
    }
  };

  // Step 3: Doctor Specialization
  const specializationForm = useForm({
    resolver: zodResolver(doctorSpecializationSchema),
  });

  const handleSpecialization = (data: any) => {
    const finalData = { ...formData, ...data };
    submitRegistration(finalData);
  };

  // Submit to Cloud Function
  const submitRegistration = async (data: any) => {
    setLoading(true);
    try {
      const createUser = httpsCallable(functions, 'createUser');
      const result = await createUser({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        user_type: data.userType,
        specialization: data.specialization,
        customSpecialization: data.customSpecialization,
      });

      if (result.data.success) {
        // Sign in the user
        await signInWithEmailAndPassword(auth, data.email, data.password);
        
        // Navigate to appropriate onboarding
        router.push(data.userType === 'doctor' ? '/doctor/onboarding' : '/user/onboarding');
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const specializations = [
    { value: 'primary_care', label: 'Primary Care' },
    { value: 'mental_health', label: 'Mental Health' },
    { value: 'womens_health', label: "Women's Health" },
    { value: 'mens_health', label: "Men's Health" },
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'chronic_conditions', label: 'Chronic Conditions' },
    { value: 'nutrition', label: 'Nutrition' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'yoga_meditation', label: 'Yoga & Meditation' },
    { value: 'general_health', label: 'Other (Please Specify)' },
  ];

  return (
    <div className="max-w-md mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                i <= step ? 'bg-primary text-white' : 'bg-gray-200'
              }`}
            >
              {i}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <form onSubmit={basicInfoForm.handleSubmit(handleBasicInfo)}>
          <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2">I am a:</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...basicInfoForm.register('userType')}
                    value="user"
                    className="mr-2"
                  />
                  Patient
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...basicInfoForm.register('userType')}
                    value="doctor"
                    className="mr-2"
                  />
                  Doctor
                </label>
              </div>
            </div>

            <input
              {...basicInfoForm.register('firstName')}
              placeholder="First Name"
              className="w-full p-3 border rounded-lg"
            />
            {basicInfoForm.formState.errors.firstName && (
              <p className="text-red-500 text-sm">
                {basicInfoForm.formState.errors.firstName.message}
              </p>
            )}

            <input
              {...basicInfoForm.register('lastName')}
              placeholder="Last Name"
              className="w-full p-3 border rounded-lg"
            />

            <input
              {...basicInfoForm.register('email')}
              type="email"
              placeholder="Email"
              className="w-full p-3 border rounded-lg"
            />

            <input
              {...basicInfoForm.register('password')}
              type="password"
              placeholder="Password"
              className="w-full p-3 border rounded-lg"
            />

            <input
              {...basicInfoForm.register('confirmPassword')}
              type="password"
              placeholder="Confirm Password"
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-6 p-3 bg-primary text-white rounded-lg"
          >
            Continue
          </button>
        </form>
      )}

      {/* Step 2: Phone Number */}
      {step === 2 && (
        <form onSubmit={phoneForm.handleSubmit(handlePhone)}>
          <h2 className="text-2xl font-bold mb-6">Add Your Phone Number</h2>
          <p className="text-gray-600 mb-4">
            We'll use this to send appointment reminders and important updates.
          </p>

          <PhoneInput
            international
            defaultCountry="US"
            value={phoneForm.watch('phone')}
            onChange={(value) => phoneForm.setValue('phone', value || '')}
            className="w-full p-3 border rounded-lg"
          />
          {phoneForm.formState.errors.phone && (
            <p className="text-red-500 text-sm mt-2">
              {phoneForm.formState.errors.phone.message}
            </p>
          )}

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 p-3 border rounded-lg"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 p-3 bg-primary text-white rounded-lg"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Doctor Specialization */}
      {step === 3 && (
        <form onSubmit={specializationForm.handleSubmit(handleSpecialization)}>
          <h2 className="text-2xl font-bold mb-6">Select Your Specialization</h2>
          
          <div className="space-y-3">
            {specializations.map((spec) => (
              <label key={spec.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...specializationForm.register('specialization')}
                  value={spec.value}
                  className="mr-3"
                />
                {spec.label}
              </label>
            ))}
          </div>

          {specializationForm.watch('specialization') === 'general_health' && (
            <input
              {...specializationForm.register('customSpecialization')}
              placeholder="Please specify your specialization"
              className="w-full mt-4 p-3 border rounded-lg"
            />
          )}

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 p-3 border rounded-lg"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 p-3 bg-primary text-white rounded-lg"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
```

---

## 4. Doctor Features

### Doctor Dashboard with Real-time Stats
```typescript
// app/(doctor)/dashboard/page.tsx
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

export default function DoctorDashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({
    upcomingConsultations: 0,
    reportsToFinish: 0,
    totalPatients: 0,
    unreadMessages: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Real-time stats listener
    const unsubscribers = [];

    // Upcoming consultations
    const appointmentsQuery = query(
      collection(db, 'doctors', user.uid, 'appointments_upcoming'),
      where('time', '>=', new Date()),
      orderBy('time', 'asc')
    );
    
    unsubscribers.push(
      onSnapshot(appointmentsQuery, (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUpcomingAppointments(appointments);
        setStats(prev => ({ ...prev, upcomingConsultations: appointments.length }));
      })
    );

    // Reports to finish
    const reportsQuery = query(
      collection(db, 'doctors', user.uid, 'appointments_reports_to_finish')
    );
    
    unsubscribers.push(
      onSnapshot(reportsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, reportsToFinish: snapshot.size }));
      })
    );

    // Total patients
    const patientsQuery = collection(db, 'doctors', user.uid, 'users');
    
    unsubscribers.push(
      onSnapshot(patientsQuery, (snapshot) => {
        const patients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentPatients(patients.slice(0, 5));
        setStats(prev => ({ ...prev, totalPatients: snapshot.size }));
      })
    );

    // Unread messages
    const chatsQuery = query(
      collection(db, 'doctors', user.uid, 'chats'),
      where('unread_count', '>', 0)
    );
    
    unsubscribers.push(
      onSnapshot(chatsQuery, (snapshot) => {
        const totalUnread = snapshot.docs.reduce((sum, doc) => 
          sum + (doc.data().unread_count || 0), 0
        );
        setStats(prev => ({ ...prev, unreadMessages: totalUnread }));
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  const isVerified = profile?.verification_status === 'Verified';

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Account Verification Required</h2>
          <p className="text-gray-600 mb-6">
            Your account is currently under review. You'll be able to access all features once verified.
          </p>
          <button 
            onClick={() => router.push('/doctor/verification')}
            className="px-6 py-3 bg-primary text-white rounded-lg"
          >
            Check Verification Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Welcome back, Dr. {profile?.last_name}
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Upcoming Consultations"
          value={stats.upcomingConsultations}
          icon="📅"
          href="/doctor/consultations"
        />
        <StatCard
          title="Reports to Finish"
          value={stats.reportsToFinish}
          icon="📝"
          href="/doctor/consultations/reports"
          alert={stats.reportsToFinish > 0}
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon="👥"
          href="/doctor/patients"
        />
        <StatCard
          title="Unread Messages"
          value={stats.unreadMessages}
          icon="💬"
          href="/doctor/messages"
          alert={stats.unreadMessages > 0}
        />
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Today's Appointments</h2>
        {upcomingAppointments.length === 0 ? (
          <p className="text-gray-500">No appointments scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.slice(0, 3).map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Patients */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Patients</h2>
        <div className="space-y-3">
          {recentPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Doctor Schedule Management
```typescript
// components/doctor/ScheduleSetup.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import TimePicker from 'react-time-picker';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface DaySchedule {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

export default function ScheduleSetup() {
  const { user, profile } = useAuth();
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(
    profile?.schedule || {}
  );
  const [saving, setSaving] = useState(false);

  const handleDayToggle = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: !prev[day]?.isAvailable,
        startTime: prev[day]?.startTime || '09:00',
        endTime: prev[day]?.endTime || '17:00',
      }
    }));
  };

  const handleTimeChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }));
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'doctors', user!.uid), {
        schedule,
        is_schedule_set: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      
      toast.success('Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Set Your Availability</h2>
      
      <div className="space-y-4">
        {DAYS.map((day) => (
          <div key={day} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <label className="font-medium capitalize">{day}</label>
              <input
                type="checkbox"
                checked={schedule[day]?.isAvailable || false}
                onChange={() => handleDayToggle(day)}
                className="w-5 h-5"
              />
            </div>
            
            {schedule[day]?.isAvailable && (
              <div className="flex gap-4 items-center">
                <div>
                  <label className="text-sm text-gray-600">Start Time</label>
                  <TimePicker
                    value={schedule[day].startTime}
                    onChange={(value) => handleTimeChange(day, 'startTime', value)}
                    format="HH:mm"
                    disableClock
                    className="border rounded p-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">End Time</label>
                  <TimePicker
                    value={schedule[day].endTime}
                    onChange={(value) => handleTimeChange(day, 'endTime', value)}
                    format="HH:mm"
                    disableClock
                    className="border rounded p-2"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex gap-4">
        <button
          onClick={saveSchedule}
          disabled={saving}
          className="flex-1 py-3 bg-primary text-white rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Your timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </p>
        <p className="text-sm text-blue-800 mt-1">
          Patients in different timezones will see available times converted to their local time.
        </p>
      </div>
    </div>
  );
}
```

### Consultation Management with Reports
```typescript
// components/doctor/ConsultationReport.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

interface ConsultationReportProps {
  appointmentId: string;
  userId: string;
  doctorId: string;
}

export default function ConsultationReport({ 
  appointmentId, 
  userId, 
  doctorId 
}: ConsultationReportProps) {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      notes: '',
      diagnosis: '',
      referToSpecialist: false,
      specialistType: '',
    }
  });

  const addRecommendation = () => {
    setRecommendations([...recommendations, {
      id: Date.now(),
      type: '',
      title: '',
      description: '',
      frequency: '',
      duration: '',
    }]);
  };

  const updateRecommendation = (id: number, field: string, value: string) => {
    setRecommendations(recommendations.map(rec => 
      rec.id === id ? { ...rec, [field]: value } : rec
    ));
  };

  const removeRecommendation = (id: number) => {
    setRecommendations(recommendations.filter(rec => rec.id !== id));
  };

  const saveReport = async (data: any) => {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      // Create consultation document
      const consultationRef = doc(collection(db, 'consultations'));
      batch.set(consultationRef, {
        appointment_id: appointmentId,
        doctor_id: doctorId,
        user_id: userId,
        notes: data.notes,
        diagnosis: data.diagnosis,
        created_at: serverTimestamp(),
        status: 'completed',
      });

      // Add recommendations
      recommendations.forEach((rec) => {
        const recRef = doc(collection(db, 'consultations', consultationRef.id, 'recommendations'));
        batch.set(recRef, {
          ...rec,
          consultation_id: consultationRef.id,
          created_at: serverTimestamp(),
        });
      });

      // Update appointment status
      const appointmentRef = doc(db, 'doctors', doctorId, 'appointments_reports_to_finish', appointmentId);
      batch.delete(appointmentRef);

      // Update doctor's pending count
      const doctorRef = doc(db, 'doctors', doctorId);
      batch.update(doctorRef, {
        'pending.finish_report': increment(-1),
      });

      // Handle specialist referral if needed
      if (data.referToSpecialist) {
        // Store referral data in session storage for post-consultation flow
        sessionStorage.setItem('pendingReferral', JSON.stringify({
          userId,
          specialistType: data.specialistType,
          consultationId: consultationRef.id,
        }));
      }

      await batch.commit();
      
      // Navigate to success page or referral flow
      if (data.referToSpecialist) {
        router.push('/doctor/consultations/refer-specialist');
      } else {
        router.push('/doctor/consultations?success=true');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save consultation report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          <div className={`flex-1 h-2 ${currentSection >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-2 ml-2 ${currentSection >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-2 ml-2 ${currentSection >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>
      </div>

      <form onSubmit={handleSubmit(saveReport)}>
        {/* Section 1: Consultation Notes */}
        {currentSection === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Consultation Notes</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Chief Complaint</label>
                <textarea
                  {...register('chiefComplaint')}
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                  placeholder="Patient's main concern or reason for visit"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">History of Present Illness</label>
                <textarea
                  {...register('historyOfPresentIllness')}
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  placeholder="Detailed description of symptoms, duration, severity"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Physical Examination</label>
                <textarea
                  {...register('physicalExamination')}
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  placeholder="Findings from virtual examination"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Assessment/Diagnosis</label>
                <textarea
                  {...register('diagnosis')}
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                  placeholder="Your clinical assessment and diagnosis"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Additional Notes</label>
                <textarea
                  {...register('notes')}
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  placeholder="Any additional observations or notes"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentSection(2)}
              className="mt-6 px-6 py-3 bg-primary text-white rounded-lg"
            >
              Continue to Recommendations
            </button>
          </div>
        )}

        {/* Section 2: Recommendations */}
        {currentSection === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Treatment Recommendations</h2>
            
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onUpdate={updateRecommendation}
                  onRemove={removeRecommendation}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addRecommendation}
              className="mt-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg w-full"
            >
              + Add Recommendation
            </button>

            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentSection(1)}
                className="px-6 py-3 border rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentSection(3)}
                className="px-6 py-3 bg-primary text-white rounded-lg"
              >
                Continue to Review
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Review & Referral */}
        {currentSection === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Review & Submit</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4">Consultation Summary</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Diagnosis:</strong> {watch('diagnosis')}</p>
                <p><strong>Recommendations:</strong> {recommendations.length} items</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('referToSpecialist')}
                  className="mr-3"
                />
                <span className="font-medium">Refer patient to a specialist</span>
              </label>

              {watch('referToSpecialist') && (
                <select
                  {...register('specialistType')}
                  className="mt-3 w-full p-3 border rounded-lg"
                >
                  <option value="">Select specialist type</option>
                  <option value="cardiologist">Cardiologist</option>
                  <option value="dermatologist">Dermatologist</option>
                  <option value="endocrinologist">Endocrinologist</option>
                  <option value="gastroenterologist">Gastroenterologist</option>
                  <option value="neurologist">Neurologist</option>
                  <option value="psychiatrist">Psychiatrist</option>
                  <option value="pulmonologist">Pulmonologist</option>
                </select>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentSection(2)}
                className="px-6 py-3 border rounded-lg"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-primary text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Complete Consultation'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
```

---

## 5. User/Patient Features

### User Home Dashboard
```typescript
// app/(user)/home/page.tsx
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function UserHome() {
  const { profile, user } = useAuth();
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [assignedDoctor, setAssignedDoctor] = useState(null);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [healthTips, setHealthTips] = useState([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribers = [];

    // Get upcoming appointment
    const appointmentQuery = query(
      collection(db, 'users', user.uid, 'appointments_upcoming'),
      where('time', '>=', new Date()),
      orderBy('time', 'asc'),
      limit(1)
    );

    unsubscribers.push(
      onSnapshot(appointmentQuery, (snapshot) => {
        if (!snapshot.empty) {
          setUpcomingAppointment({
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
          });
        }
      })
    );

    // Get assigned doctor
    if (profile?.doctor?.uid) {
      unsubscribers.push(
        onSnapshot(doc(db, 'doctors', profile.doctor.uid), (doc) => {
          if (doc.exists()) {
            setAssignedDoctor({ id: doc.id, ...doc.data() });
          }
        })
      );
    }

    // Get recent purchases
    const purchasesQuery = query(
      collection(db, 'users', user.uid, 'purchases'),
      orderBy('created_at', 'desc'),
      limit(3)
    );

    unsubscribers.push(
      onSnapshot(purchasesQuery, (snapshot) => {
        setRecentPurchases(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, profile]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {getGreeting()}, {profile?.first_name}!
        </h1>
        <p className="text-gray-600">
          Here's your wellness dashboard for today
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <QuickActionCard
          icon="🏥"
          title="Book Consultation"
          href="/user/consultations/schedule"
          disabled={!profile?.doctor}
        />
        <QuickActionCard
          icon="💊"
          title="Shop Wellness"
          href="/user/store"
        />
        <QuickActionCard
          icon="📋"
          title="Health Assessment"
          href="/user/assessment"
        />
        <QuickActionCard
          icon="🎁"
          title="Refer Friends"
          href="/user/profile/refer"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Appointment */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Next Appointment</h2>
          {upcomingAppointment ? (
            <AppointmentCard appointment={upcomingAppointment} />
          ) : (
            <EmptyState
              message="No upcoming appointments"
              action={
                profile?.doctor ? (
                  <Link
                    href="/user/consultations/schedule"
                    className="text-primary underline"
                  >
                    Schedule one now
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500">
                    You need to be matched with a doctor first
                  </p>
                )
              }
            />
          )}
        </div>

        {/* Assigned Doctor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Doctor</h2>
          {assignedDoctor ? (
            <DoctorCard doctor={assignedDoctor} />
          ) : (
            <EmptyState
              message="Not matched with a doctor yet"
              action={
                <Link
                  href="/user/get-matched"
                  className="text-primary underline"
                >
                  Get matched now
                </Link>
              }
            />
          )}
        </div>

        {/* Health Score */}
        {profile?.health_score && (
          <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Health Score</h2>
            <div className="text-5xl font-bold mb-2">{profile.health_score}/100</div>
            <p className="text-sm opacity-90">
              Based on your last assessment
            </p>
            <Link
              href="/user/assessment"
              className="mt-4 inline-block text-sm underline"
            >
              Update assessment →
            </Link>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentPurchases.length > 0 ? (
              recentPurchases.map((purchase) => (
                <ActivityItem
                  key={purchase.id}
                  icon="🛍️"
                  title={`Purchased ${purchase.items.length} items`}
                  subtitle={`$${purchase.total}`}
                  time={purchase.created_at}
                />
              ))
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Banner */}
      {!profile?.subscription?.active && (
        <SubscriptionBanner />
      )}
    </div>
  );
}
```

### Consultation Booking with Timezone Support
```typescript
// components/user/ScheduleConsultation.tsx
import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment-timezone';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

const localizer = momentLocalizer(moment);

export default function ScheduleConsultation() {
  const { profile, user } = useAuth();
  const [doctorSchedule, setDoctorSchedule] = useState(null);
  const [doctorTimezone, setDoctorTimezone] = useState('America/New_York');
  const [userTimezone] = useState(moment.tz.guess());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDoctorSchedule();
  }, [profile]);

  const loadDoctorSchedule = async () => {
    if (!profile?.doctor?.uid) return;

    try {
      // Get doctor's schedule and timezone
      const doctorDoc = await getDoc(doc(db, 'doctors', profile.doctor.uid));
      const doctorData = doctorDoc.data();
      
      setDoctorSchedule(doctorData.schedule);
      setDoctorTimezone(doctorData.timezone || 'America/New_York');
      
      // Load booked appointments
      await loadBookedSlots();
    } catch (error) {
      console.error('Error loading doctor schedule:', error);
    }
  };

  const loadBookedSlots = async () => {
    const today = moment().startOf('day').toDate();
    const endDate = moment().add(30, 'days').endOf('day').toDate();
    
    const appointmentsQuery = query(
      collection(db, 'doctors', profile.doctor.uid, 'appointments_upcoming'),
      where('time', '>=', today),
      where('time', '<=', endDate)
    );
    
    const snapshot = await getDocs(appointmentsQuery);
    const booked = snapshot.docs.map(doc => doc.data().time.toDate());
    setBookedSlots(booked);
  };

  const generateTimeSlots = (date: Date) => {
    const dayName = moment(date).format('dddd').toLowerCase();
    const daySchedule = doctorSchedule?.[dayName];
    
    if (!daySchedule?.isAvailable) return [];
    
    const slots = [];
    const startTime = moment.tz(
      `${moment(date).format('YYYY-MM-DD')} ${daySchedule.startTime}`,
      doctorTimezone
    );
    const endTime = moment.tz(
      `${moment(date).format('YYYY-MM-DD')} ${daySchedule.endTime}`,
      doctorTimezone
    );
    
    let current = startTime.clone();
    
    while (current.isBefore(endTime)) {
      // Convert to user's timezone for display
      const slotInUserTz = current.clone().tz(userTimezone);
      
      // Check if slot is available (not booked and in future)
      const isBooked = bookedSlots.some(booked => 
        moment(booked).isSame(current, 'minute')
      );
      
      const isPast = current.isBefore(moment());
      
      if (!isBooked && !isPast) {
        slots.push({
          time: current.toDate(),
          displayTime: slotInUserTz.format('h:mm A'),
          doctorTime: current.format('h:mm A'),
        });
      }
      
      current.add(30, 'minutes');
    }
    
    return slots;
  };

  const scheduleAppointment = async () => {
    if (!selectedSlot) return;
    
    setLoading(true);
    try {
      const scheduleFunction = httpsCallable(functions, 'scheduleAppointment');
      const result = await scheduleFunction({
        appointmentTime: selectedSlot.time.getTime(),
        userTimezone,
        doctorTimezone,
      });
      
      if (result.data.success) {
        toast.success('Appointment scheduled successfully!');
        router.push('/user/consultations');
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast.error('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const showTimezoneDifference = doctorTimezone !== userTimezone;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Schedule Your Consultation</h1>
      
      {/* Doctor Info */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center">
          <img
            src={profile?.doctor?.image_url || '/default-doctor.png'}
            alt="Doctor"
            className="w-16 h-16 rounded-full mr-4"
          />
          <div>
            <h3 className="font-semibold">
              Dr. {profile?.doctor?.first_name} {profile?.doctor?.last_name}
            </h3>
            <p className="text-sm text-gray-600">
              {profile?.doctor?.specialization}
            </p>
          </div>
        </div>
      </div>

      {/* Timezone Info */}
      {showTimezoneDifference && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Timezone Notice:</strong> Dr. {profile?.doctor?.last_name} is in {doctorTimezone}. 
            All times shown are converted to your timezone ({userTimezone}).
          </p>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <Calendar
          localizer={localizer}
          events={[]}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 400 }}
          views={['month']}
          onSelectSlot={(slotInfo) => {
            const slots = generateTimeSlots(slotInfo.start);
            setAvailableSlots(slots);
            setSelectedSlot(null);
          }}
          selectable
          dayPropGetter={(date) => {
            const dayName = moment(date).format('dddd').toLowerCase();
            const isAvailable = doctorSchedule?.[dayName]?.isAvailable;
            
            return {
              style: {
                backgroundColor: isAvailable ? undefined : '#f3f4f6',
                cursor: isAvailable ? 'pointer' : 'not-allowed',
              }
            };
          }}
        />
      </div>

      {/* Time Slots */}
      {availableSlots.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Available Time Slots</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {availableSlots.map((slot, index) => (
              <button
                key={index}
                onClick={() => setSelectedSlot(slot)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedSlot === slot
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {slot.displayTime}
                {showTimezoneDifference && (
                  <div className="text-xs opacity-75 mt-1">
                    ({slot.doctorTime} doctor time)
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Button */}
      <div className="mt-6">
        <button
          onClick={scheduleAppointment}
          disabled={!selectedSlot || loading}
          className="w-full py-3 bg-primary text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Scheduling...' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
}
```

---

## 6. Consultation System

### Video Call Implementation with Agora
```typescript
// components/video/VideoCall.tsx
import { useEffect, useRef, useState } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  IMicrophoneAudioTrack, 
  ICameraVideoTrack 
} from 'agora-rtc-sdk-ng';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';

interface VideoCallProps {
  appointmentId: string;
  userId: string;
  isDoctor: boolean;
  onCallEnd: () => void;
}

export default function VideoCall({ 
  appointmentId, 
  userId, 
  isDoctor,
  onCallEnd 
}: VideoCallProps) {
  const [client] = useState<IAgoraRTCClient>(() => 
    AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
  );
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack>();
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack>();
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeAgora();
    
    return () => {
      leaveCall();
    };
  }, []);

  const initializeAgora = async () => {
    try {
      // Get Agora token from cloud function
      const getToken = httpsCallable(functions, 'getAgoraToken');
      const { data } = await getToken({ 
        channel: appointmentId,
        uid: userId,
        role: isDoctor ? 'publisher' : 'subscriber'
      });
      
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
      
      // Set up event listeners
      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);
      client.on('user-left', handleUserLeft);
      
      // Join channel
      await client.join(appId, appointmentId, data.token, userId);
      
      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      
      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }
      
      // Publish tracks
      await client.publish([audioTrack, videoTrack]);
      setIsJoined(true);
      
    } catch (error) {
      console.error('Error initializing Agora:', error);
      toast.error('Failed to join video call');
    }
  };

  const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    await client.subscribe(user, mediaType);
    
    if (mediaType === 'video' && remoteVideoRef.current) {
      user.videoTrack?.play(remoteVideoRef.current);
    }
    
    if (mediaType === 'audio') {
      user.audioTrack?.play();
    }
    
    setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
  };

  const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (mediaType === 'video' && remoteVideoRef.current) {
      remoteVideoRef.current.innerHTML = '';
    }
  };

  const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
  };

  const toggleMute = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const leaveCall = async () => {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    
    await client.leave();
    onCallEnd();
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Remote Video */}
      <div 
        ref={remoteVideoRef}
        className="absolute inset-0"
      />
      
      {/* Local Video */}
      <div 
        ref={localVideoRef}
        className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden"
      />
      
      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full ${
              isMuted ? 'bg-red-500' : 'bg-gray-700'
            } text-white`}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${
              isVideoOff ? 'bg-red-500' : 'bg-gray-700'
            } text-white`}
          >
            {isVideoOff ? '📷❌' : '📷'}
          </button>
          
          <button
            onClick={leaveCall}
            className="p-4 rounded-full bg-red-500 text-white"
          >
            📞 End Call
          </button>
        </div>
      </div>
      
      {/* Call Status */}
      {!isJoined && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-white mx-auto mb-4" />
            <p>Connecting to call...</p>
          </div>
        </div>
      )}
      
      {isJoined && remoteUsers.length === 0 && (
        <div className="absolute top-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-lg">
          Waiting for {isDoctor ? 'patient' : 'doctor'} to join...
        </div>
      )}
    </div>
  );
}
```

---

## 7. Messaging System

### Real-time Chat Implementation
```typescript
// components/chat/ChatWindow.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

interface ChatWindowProps {
  chatId: string;
  recipientName: string;
  recipientId: string;
  canSendMessage: boolean; // Based on consultation status
}

export default function ChatWindow({ 
  chatId, 
  recipientName, 
  recipientId,
  canSendMessage 
}: ChatWindowProps) {
  const { user, isDoctor } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Subscribe to messages
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      scrollToBottom();
      
      // Mark messages as read
      markMessagesAsRead();
    });
    
    return () => unsubscribe();
  }, [chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async () => {
    const batch = writeBatch(db);
    
    // Update unread messages
    messages
      .filter(msg => msg.sender_uid !== user?.uid && !msg.read)
      .forEach(msg => {
        const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
        batch.update(msgRef, { read: true });
      });
    
    // Reset unread count in chat metadata
    if (isDoctor) {
      const chatRef = doc(db, 'doctors', user!.uid, 'chats', chatId);
      batch.update(chatRef, { unread_count: 0 });
    }
    
    await batch.commit();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !canSendMessage) return;
    
    setSending(true);
    const messageText = newMessage;
    setNewMessage('');
    
    try {
      const batch = writeBatch(db);
      
      // Add message
      const messageData = {
        text: messageText,
        sender_uid: user!.uid,
        timestamp: serverTimestamp(),
        read: false,
      };
      
      const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
      batch.set(messageRef, messageData);
      
      // Update chat metadata for doctor
      const chatMetaRef = doc(db, 'doctors', isDoctor ? user!.uid : recipientId, 'chats', chatId);
      batch.update(chatMetaRef, {
        last_message: messageText,
        last_message_time: serverTimestamp(),
        unread_count: isDoctor ? 0 : increment(1),
      });
      
      await batch.commit();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold">{recipientName}</h3>
        {!canSendMessage && !isDoctor && (
          <p className="text-sm text-gray-500">
            You can message after your first consultation
          </p>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="text-center mb-4">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {date}
              </span>
            </div>
            {dateMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_uid === user?.uid}
                time={formatTime(message.timestamp)}
              />
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      {canSendMessage ? (
        <form onSubmit={sendMessage} className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 p-3 border rounded-lg resize-none"
              rows={1}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-primary text-white rounded-lg disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t bg-gray-50 text-center text-gray-500">
          {isDoctor ? 'This conversation is locked' : 'Complete your first consultation to start messaging'}
        </div>
      )}
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message, isOwn, time }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
          {time}
          {isOwn && (
            <span className="ml-1">
              {message.read ? '✓✓' : '✓'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
```

---

## 8. E-commerce Implementation

### Product Store with Cart
```typescript
// components/store/ProductStore.tsx
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';

export default function ProductStore() {
  const { user, profile } = useAuth();
  const { cartItems, cartTotal, addToCart, updateQuantity, removeFromCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = () => {
    let productsQuery = collection(db, 'products');
    
    if (selectedCategory !== 'all') {
      productsQuery = query(
        productsQuery,
        where('category', '==', selectedCategory),
        where('in_stock', '==', true)
      );
    }
    
    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Apply search filter
      const filtered = searchTerm
        ? prods.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : prods;
      
      setProducts(filtered);
      setLoading(false);
    });
    
    return () => unsubscribe();
  };

  const loadCategories = async () => {
    // In real app, you might have a categories collection
    const uniqueCategories = ['Supplements', 'Wellness Devices', 'Personal Care', 'Fitness'];
    setCategories(uniqueCategories);
  };

  const calculateDiscount = (price: number, mrp: number) => {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  const getMemberPrice = (price: number) => {
    if (profile?.subscription?.active) {
      return price * 0.9; // 10% member discount
    }
    return price;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-3 border rounded-lg"
            />
            <Link href="/user/cart" className="relative">
              <span className="text-2xl">🛒</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Categories */}
          <div className="w-64 shrink-0">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-4">Categories</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left p-2 rounded ${
                      selectedCategory === 'all' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    All Products
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left p-2 rounded ${
                        selectedCategory === cat ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Member Benefits */}
            {profile?.subscription?.active && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-green-800 mb-2">Member Benefits</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ 10% off all products</li>
                  <li>✓ Free shipping on orders over $50</li>
                  <li>✓ Exclusive member products</li>
                </ul>
              </div>
            )}
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <ProductGridSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    memberPrice={getMemberPrice(product.price)}
                    discount={calculateDiscount(product.price, product.mrp)}
                    isMember={profile?.subscription?.active}
                    onAddToCart={() => addToCart(product)}
                    inCart={cartItems.some(item => item.product_id === product.id)}
                  />
                ))}
              </div>
            )}

            {products.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Checkout Button */}
      {cartItems.length > 0 && (
        <Link
          href="/user/cart"
          className="fixed bottom-6 right-6 bg-primary text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 hover:bg-primary-dark transition-colors"
        >
          <span>View Cart ({cartItems.length})</span>
          <span className="font-bold">${cartTotal.toFixed(2)}</span>
        </Link>
      )}
    </div>
  );
}

// Product Card Component
function ProductCard({ product, memberPrice, discount, isMember, onAddToCart, inCart }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={product.image_url || '/placeholder-product.png'}
          alt={product.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-sm px-2 py-1 rounded">
            {discount}% OFF
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold">
            ${isMember ? memberPrice.toFixed(2) : product.price.toFixed(2)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-sm text-gray-500 line-through">
              ${product.mrp.toFixed(2)}
            </span>
          )}
          {isMember && memberPrice < product.price && (
            <span className="text-sm text-green-600">Member price</span>
          )}
        </div>
        
        <button
          onClick={onAddToCart}
          disabled={inCart}
          className={`w-full py-2 rounded-lg transition-colors ${
            inCart
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {inCart ? 'In Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
```

### Cart and Checkout
```typescript
// hooks/useCart.tsx
import { useState, useEffect, createContext, useContext } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  cartTotal: number;
  cartSubtotal: number;
  discountAmount: number;
  finalTotal: number;
  addToCart: (product: Product) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'cart'),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CartItem[];
        setCartItems(items);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    let discountPercent = 0;
    
    // Member discount
    if (profile?.subscription?.active) {
      discountPercent += 10;
    }
    
    // Referral discount (first purchase for referred users)
    if (profile?.referred_by && !profile?.has_made_purchase) {
      discountPercent += 25;
    }
    
    // Referral credits
    if (profile?.referral_credits > 0) {
      discountPercent += 25;
    }

    const discountAmount = subtotal * (discountPercent / 100);
    const finalTotal = subtotal - discountAmount;

    return {
      cartSubtotal: subtotal,
      discountAmount,
      finalTotal,
      cartTotal: finalTotal,
    };
  };

  const addToCart = async (product: Product) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'users', user.uid, 'cart'), {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        mrp: product.mrp,
        quantity: 1,
        image_url: product.image_url,
        added_at: serverTimestamp(),
      });
      
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user || quantity < 1) return;

    try {
      await updateDoc(
        doc(db, 'users', user.uid, 'cart', itemId),
        { quantity }
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'cart', itemId));
      toast.success('Removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    const batch = writeBatch(db);
    cartItems.forEach(item => {
      batch.delete(doc(db, 'users', user.uid, 'cart', item.id));
    });
    
    await batch.commit();
  };

  const totals = calculateTotals();

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      ...totals,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
```

---

## 9. Real-time Features

### Real-time Listeners Setup
```typescript
// hooks/useRealtimeData.ts
import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  DocumentData,
  QueryConstraint 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface UseRealtimeDataOptions {
  collectionPath: string;
  queries?: QueryConstraint[];
  dependencies?: any[];
}

export function useRealtimeData<T = DocumentData>({ 
  collectionPath, 
  queries = [], 
  dependencies = [] 
}: UseRealtimeDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const collectionRef = collection(db, collectionPath);
      const q = queries.length > 0 ? query(collectionRef, ...queries) : collectionRef;

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          
          setData(items);
          setLoading(false);
        },
        (err) => {
          console.error('Realtime data error:', err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Setup error:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, dependencies);

  return { data, loading, error };
}

// Usage Example
export function useUpcomingAppointments(userId: string, isDoctor: boolean) {
  const collectionPath = isDoctor 
    ? `doctors/${userId}/appointments_upcoming`
    : `users/${userId}/appointments_upcoming`;

  return useRealtimeData<Appointment>({
    collectionPath,
    queries: [
      where('time', '>=', new Date()),
      orderBy('time', 'asc')
    ],
    dependencies: [userId, isDoctor]
  });
}

export function useUnreadMessages(userId: string, isDoctor: boolean) {
  if (!isDoctor) return { count: 0 };

  const { data: chats } = useRealtimeData<ChatMetadata>({
    collectionPath: `doctors/${userId}/chats`,
    queries: [where('unread_count', '>', 0)],
    dependencies: [userId]
  });

  const count = chats.reduce((sum, chat) => sum + chat.unread_count, 0);
  return { count };
}
```

---

## 10. Utility Functions & Helpers

### Date/Time Utilities
```typescript
// lib/utils/datetime.ts
import { format, formatDistance, addMinutes, startOfDay, endOfDay } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export const formatAppointmentTime = (date: Date, timezone: string) => {
  const zonedDate = utcToZonedTime(date, timezone);
  return format(zonedDate, 'MMM d, yyyy h:mm a zzz');
};

export const getTimeSlots = (
  date: Date,
  startTime: string,
  endTime: string,
  timezone: string,
  duration: number = 30
) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let current = new Date(date);
  current.setHours(startHour, startMin, 0, 0);
  
  const end = new Date(date);
  end.setHours(endHour, endMin, 0, 0);
  
  while (current < end) {
    slots.push(new Date(current));
    current = addMinutes(current, duration);
  }
  
  return slots;
};

export const isTimeSlotAvailable = (
  slot: Date,
  bookedSlots: Date[],
  minBuffer: number = 30
) => {
  const now = new Date();
  
  // Check if slot is in the past
  if (slot < addMinutes(now, minBuffer)) {
    return false;
  }
  
  // Check if slot is already booked
  return !bookedSlots.some(booked => 
    Math.abs(booked.getTime() - slot.getTime()) < minBuffer * 60 * 1000
  );
};

export const formatRelativeTime = (date: Date) => {
  return formatDistance(date, new Date(), { addSuffix: true });
};
```

### Form Validation Schemas
```typescript
// lib/validations/index.ts
import { z } from 'zod';

export const phoneNumberSchema = z.string().regex(
  /^\+[1-9]\d{1,14}$/,
  'Please enter a valid phone number with country code'
);

export const consultationNotesSchema = z.object({
  chiefComplaint: z.string().min(10, 'Please provide detailed chief complaint'),
  historyOfPresentIllness: z.string().min(20, 'Please provide detailed history'),
  physicalExamination: z.string().optional(),
  diagnosis: z.string().min(5, 'Please provide a diagnosis'),
  notes: z.string().optional(),
});

export const recommendationSchema = z.object({
  type: z.enum(['medication', 'lifestyle', 'diet', 'exercise', 'followup']),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Please provide detailed description'),
  frequency: z.string().optional(),
  duration: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(3, 'Product name is required'),
  description: z.string().min(20, 'Please provide detailed description'),
  price: z.number().positive('Price must be positive'),
  mrp: z.number().positive().optional(),
  category: z.string().min(3, 'Category is required'),
  sub_category: z.string().optional(),
  in_stock: z.boolean(),
});
```

### Firebase Query Helpers
```typescript
// lib/firebase/queries.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';

export async function getUserType(uid: string): Promise<'user' | 'doctor' | null> {
  const doctorDoc = await getDoc(doc(db, 'doctors', uid));
  if (doctorDoc.exists()) return 'doctor';
  
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) return 'user';
  
  return null;
}

export async function getAvailableDoctors(specialization?: string) {
  let q = query(
    collection(db, 'doctors'),
    where('verification_status', '==', 'Verified'),
    where('is_schedule_set', '==', true)
  );
  
  if (specialization) {
    q = query(q, where('specialization', '==', specialization));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPaginatedData<T>(
  collectionPath: string,
  pageSize: number,
  lastDoc?: DocumentSnapshot,
  queries: any[] = []
) {
  let q = query(
    collection(db, collectionPath),
    ...queries,
    limit(pageSize)
  );
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  })) as T[];
  
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];
  const hasMore = snapshot.docs.length === pageSize;
  
  return { data, lastVisible, hasMore };
}
```

---

## 11. UI Components Library

### Loading States
```typescript
// components/ui/LoadingStates.tsx
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="animate-pulse">
        <div className="h-12 bg-gray-100 border-b"></div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 border-b">
            <div className="p-4 flex gap-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
```

### Empty States
```typescript
// components/ui/EmptyStates.tsx
interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function ErrorState({ 
  error, 
  onRetry 
}: { 
  error: Error; 
  onRetry?: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {error.message || 'An unexpected error occurred'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-primary text-white rounded-lg"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
```

### Modal Components
```typescript
// components/ui/Modal.tsx
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}>
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  {title}
                </Dialog.Title>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

---

## 12. Performance Optimizations

### Image Optimization
```typescript
// components/ui/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width = 400, 
  height = 300, 
  className,
  priority = false 
}: OptimizedImageProps) {
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoadingComplete={() => setLoading(false)}
        onError={() => setError(true)}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}
```

### Lazy Loading Components
```typescript
// lib/utils/lazyLoad.ts
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

export function lazyLoadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  return dynamic(importFunc, {
    loading: () => fallback || <div>Loading...</div>,
    ssr: false,
  });
}

// Usage
const VideoCall = lazyLoadComponent(
  () => import('@/components/video/VideoCall'),
  <div>Loading video call...</div>
);
```

### Query Optimization
```typescript
// hooks/useOptimizedQuery.ts
import { useEffect, useState, useRef } from 'react';
import { Query, onSnapshot, QuerySnapshot } from 'firebase/firestore';

interface UseOptimizedQueryOptions {
  query: Query;
  debounceMs?: number;
  transform?: (data: any[]) => any[];
}

export function useOptimizedQuery({ 
  query, 
  debounceMs = 0,
  transform 
}: UseOptimizedQueryOptions) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const unsubscribe = onSnapshot(query, (snapshot: QuerySnapshot) => {
      const handleSnapshot = () => {
        let items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (transform) {
          items = transform(items);
        }
        
        setData(items);
        setLoading(false);
      };

      if (debounceMs > 0) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(handleSnapshot, debounceMs);
      } else {
        handleSnapshot();
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutRef.current);
    };
  }, [query, debounceMs]);

  return { data, loading };
}
```

---

## 13. Security Implementation

### Input Sanitization
```typescript
// lib/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}

export function validateFileUpload(file: File, options: {
  maxSizeMB?: number;
  allowedTypes?: string[];
} = {}) {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'] } = options;
  
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File size must be less than ${maxSizeMB}MB`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  return true;
}
```

### API Route Protection
```typescript
// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  try {
    const token = request.headers.get('authorization')?.split('Bearer ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    return handler(request, decodedToken.uid);
    
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// Usage in API route
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    // Your protected logic here
  });
}
```

---

## 14. Error Handling Patterns

### Global Error Boundary
```typescript
// components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.state.errorInfo!);
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-lg"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Error Handler
```typescript
// lib/api/errorHandler.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): {
  message: string;
  statusCode: number;
  code?: string;
} {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
  };
}

// Usage in API route
export async function POST(request: Request) {
  try {
    // Your logic here
  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
```

---

## 15. Testing Strategies

### Component Testing
```typescript
// __tests__/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/store/ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test description',
    price: 29.99,
    mrp: 39.99,
    image_url: '/test.jpg',
  };

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('shows discount when MRP is higher than price', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('25% OFF')).toBeInTheDocument();
    expect(screen.getByText('$39.99')).toHaveClass('line-through');
  });

  it('calls onAddToCart when button is clicked', () => {
    const mockAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
```

### Integration Testing
```typescript
// __tests__/integration/checkout.test.ts
import { renderWithProviders } from '@/test-utils';
import { CheckoutFlow } from '@/components/checkout/CheckoutFlow';
import { waitFor } from '@testing-library/react';

describe('Checkout Flow', () => {
  it('completes checkout successfully', async () => {
    const { user } = renderWithProviders(<CheckoutFlow />, {
      preloadedState: {
        cart: {
          items: [{ id: '1', name: 'Test Product', price: 29.99, quantity: 1 }],
        },
        auth: {
          user: { uid: 'test-user' },
          profile: { subscription: { active: true } },
        },
      },
    });

    // Step 1: Review cart
    expect(screen.getByText('Cart Review')).toBeInTheDocument();
    expect(screen.getByText('$26.99')).toBeInTheDocument(); // With member discount
    
    fireEvent.click(screen.getByText('Continue to Payment'));
    
    // Step 2: Payment
    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });
    
    // Fill payment form
    await user.type(screen.getByLabelText('Card Number'), '4242424242424242');
    await user.type(screen.getByLabelText('Expiry'), '12/25');
    await user.type(screen.getByLabelText('CVC'), '123');
    
    fireEvent.click(screen.getByText('Complete Order'));
    
    // Step 3: Success
    await waitFor(() => {
      expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
    });
  });
});
```

---

## Migration Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Next.js project with TypeScript
- [ ] Configure Firebase and environment variables
- [ ] Implement authentication system
- [ ] Create user/doctor registration flows
- [ ] Set up routing and navigation
- [ ] Implement protected routes

### Phase 2: Core Features (Week 3-4)
- [ ] Build doctor-user matching system
- [ ] Implement consultation scheduling
- [ ] Add timezone support
- [ ] Create video calling with Agora
- [ ] Build messaging system with restrictions
- [ ] Add real-time data synchronization

### Phase 3: E-commerce & Payments (Week 5)
- [ ] Create product catalog
- [ ] Implement shopping cart
- [ ] Add discount calculations
- [ ] Integrate Stripe payments
- [ ] Build purchase history

### Phase 4: Advanced Features (Week 6)
- [ ] Implement both referral systems
- [ ] Add subscription management
- [ ] Create doctor verification flow
- [ ] Build consultation reports system
- [ ] Add wellness questionnaires

### Phase 5: Polish & Testing (Week 7-8)
- [ ] Implement comprehensive error handling
- [ ] Add loading and empty states
- [ ] Optimize performance
- [ ] Write tests
- [ ] Security audit
- [ ] Deploy to production

## Deployment Considerations

### Vercel Deployment
```json
// vercel.json
{
  "functions": {
    "app/api/*": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

### Environment Variables Setup
```bash
# Production secrets in Vercel dashboard
FIREBASE_ADMIN_SDK
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
AGORA_APP_CERTIFICATE
```

This comprehensive guide should provide everything needed to migrate the Flutter wellness app to Next.js!