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
        // Check if user is doctor
        const doctorDoc = await getDoc(doc(db, 'doctors', currentUser.uid)).catch(() => ({ exists: () => false }));
        const isDoctor = doctorDoc && doctorDoc.exists && doctorDoc.exists();
        
        setUser(currentUser);
        setUserType(isDoctor ? 'doctor' : 'user');
        
        // Set up real-time profile listener
        profileUnsubscribeRef.current = onSnapshot(
          doc(db, isDoctor ? 'doctors' : 'users', currentUser.uid),
          (doc) => {
            if (doc.exists()) {
              setProfile({ uid: doc.id, ...doc.data() });
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            // Silently ignore permission-denied on logout
            if (error?.code === 'permission-denied') return;
            console.warn('Profile listener note:', error?.message || error);
            setProfile(null);
            setLoading(false);
          }
        );

        // Set up real-time verification listener for doctors
        if (isDoctor) {
          verificationUnsubscribeRef.current = onSnapshot(
            doc(db, 'verification', currentUser.uid),
            (doc) => {
              if (doc.exists()) {
                setVerification({ uid: doc.id, ...doc.data() });
              } else {
                setVerification(null);
              }
            },
            (error) => {
              // Silently ignore permission-denied on logout
              if (error?.code === 'permission-denied') return;
              console.warn('Verification listener note:', error?.message || error);
              setVerification(null);
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

    return () => {
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
    isStatusVerified(profile?.verification_status) ||
    isStatusVerified(profile?.overall_status) ||
    isStatusVerified(profile?.status) ||
    profile?.is_verified === true ||
    profile?.isVerified === true ||
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
