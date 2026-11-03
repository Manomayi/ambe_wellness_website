"use client";

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { clearWebPushToken } from '@/lib/firebase/messaging';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  const profileUnsubscribeRef = useRef(null);
  const verificationUnsubscribeRef = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }
      if (verificationUnsubscribeRef.current) {
        verificationUnsubscribeRef.current();
        verificationUnsubscribeRef.current = null;
      }

      if (currentUser) {
        // Fast-path set user so child pages know authentication is active
        setUser(currentUser);

        // Check if user is a doctor by custom claim or doctors collection document
        let isDoctor = false;
        try {
          const tokenResult = await currentUser.getIdTokenResult().catch(() => null);
          if (tokenResult?.claims?.doctor === true || tokenResult?.claims?.role === 'doctor') {
            isDoctor = true;
          } else {
            const doctorDoc = await getDoc(doc(db, 'doctors', currentUser.uid));
            isDoctor = Boolean(doctorDoc && doctorDoc.exists && doctorDoc.exists());
          }
        } catch (roleError) {
          console.warn('Could not determine doctor role via direct check:', roleError?.message || roleError);
        }

        setUserType(isDoctor ? 'doctor' : 'user');
        
        if (isDoctor) {
          // For doctors, wait for BOTH profile and verification snapshots before releasing loading.
          // This prevents flashing the review/unverified banner on initial load.
          let profileResolved = false;
          let verificationResolved = false;

          const checkDoctorReady = () => {
            if (profileResolved && verificationResolved) {
              setLoading(false);
            }
          };

          profileUnsubscribeRef.current = onSnapshot(
            doc(db, 'doctors', currentUser.uid),
            (docSnap) => {
              if (docSnap.exists()) {
                setProfile({ uid: docSnap.id, ...docSnap.data() });
              } else {
                setProfile(null);
              }
              profileResolved = true;
              checkDoctorReady();
            },
            (error) => {
              if (error?.code !== 'permission-denied') {
                console.warn('Doctor profile listener note:', error?.message || error);
              }
              setProfile(null);
              profileResolved = true;
              checkDoctorReady();
            }
          );

          verificationUnsubscribeRef.current = onSnapshot(
            doc(db, 'verification', currentUser.uid),
            (docSnap) => {
              if (docSnap.exists()) {
                setVerification({ uid: docSnap.id, ...docSnap.data() });
              } else {
                setVerification(null);
              }
              verificationResolved = true;
              checkDoctorReady();
            },
            (error) => {
              if (error?.code !== 'permission-denied') {
                console.warn('Doctor verification listener note:', error?.message || error);
              }
              setVerification(null);
              verificationResolved = true;
              checkDoctorReady();
            }
          );
        } else {
          // Regular patient profile listener
          profileUnsubscribeRef.current = onSnapshot(
            doc(db, 'users', currentUser.uid),
            (docSnap) => {
              if (docSnap.exists()) {
                setProfile({ uid: docSnap.id, ...docSnap.data() });
              } else {
                setProfile(null);
              }
              setLoading(false);
            },
            (error) => {
              if (error?.code !== 'permission-denied') {
                console.warn('User profile listener note:', error?.message || error);
              }
              setProfile(null);
              setLoading(false);
            }
          );
        }
      } else {
        setUser(null);
        setUserType(null);
        setProfile(null);
        setVerification(null);
        setLoading(false);
      }
    });

    // Safari tab visibility recovery: when switching back from another tab
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (auth.currentUser && !user) {
          setUser(auth.currentUser);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribeAuth();
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }
      if (verificationUnsubscribeRef.current) {
        verificationUnsubscribeRef.current();
        verificationUnsubscribeRef.current = null;
      }
    };
  }, []);

  const signIn = async (email, password) => {
    // A different account still signed in on this browser: detach its browser
    // push token first so its notifications don't follow the browser.
    if (auth.currentUser && auth.currentUser.email !== email.trim()) {
      await clearWebPushToken(auth.currentUser.uid, userType);
    }

    // Trim the email — leading/trailing whitespace (common with autofill) is
    // rejected by Firebase as INVALID_LOGIN_CREDENTIALS.
    const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
    
    // Check user type
    const doctorDoc = await getDoc(doc(db, 'doctors', user.uid));
    const isDoctor = doctorDoc.exists();
    
    // Return user type for routing
    return isDoctor ? 'doctor' : 'user';
  };

  const signUp = async (email, password, userType) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    // Profile creation should be handled by cloud function
    return user;
  };

  const signOut = async () => {
    // Detach this browser's push token while still authenticated (rules need the
    // signed-in owner). Never throws and is time-capped, so logout can't hang.
    if (auth.currentUser) {
      await clearWebPushToken(auth.currentUser.uid, userType);
    }

    // Proactively clean up snapshot listeners before Firebase destroys the auth token
    if (profileUnsubscribeRef.current) {
      profileUnsubscribeRef.current();
      profileUnsubscribeRef.current = null;
    }
    if (verificationUnsubscribeRef.current) {
      verificationUnsubscribeRef.current();
      verificationUnsubscribeRef.current = null;
    }
    setUser(null);
    setUserType(null);
    setProfile(null);
    setVerification(null);
    await firebaseSignOut(auth);
  };


  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const reloadUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const currentUser = auth.currentUser;
      setUser(currentUser ? { ...currentUser } : null);
      return currentUser;
    }
    return null;
  };

  const isStatusVerified = (status) => {
    if (!status) return false;
    const normalized = String(status).trim().toLowerCase();
    return normalized === 'verified' || normalized === 'approved';
  };

  const isDoctor = userType === 'doctor';
  const isVerifiedDoctor = isDoctor && (
    profile?.verified === true ||
    profile?.is_verified === true ||
    profile?.isVerified === true ||
    isStatusVerified(profile?.verification_status) ||
    isStatusVerified(profile?.overall_status) ||
    isStatusVerified(profile?.status) ||
    verification?.verified === true ||
    verification?.is_verified === true ||
    verification?.isVerified === true ||
    isStatusVerified(verification?.overall_status) ||
    isStatusVerified(verification?.status) ||
    isStatusVerified(verification?.verification_status)
  );

  return (
    <AuthContext.Provider value={{
      user,
      userType,
      profile,
      verification,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      sendVerificationEmail,
      reloadUser,
      isDoctor,
      isVerifiedDoctor,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
