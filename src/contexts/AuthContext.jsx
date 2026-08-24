"use client";

import { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    let profileUnsubscribe;
    let verificationUnsubscribe;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = undefined;
      }
      if (verificationUnsubscribe) {
        verificationUnsubscribe();
        verificationUnsubscribe = undefined;
      }

      if (user) {
        // Check if user is doctor
        const doctorDoc = await getDoc(doc(db, 'doctors', user.uid));
        const isDoctor = doctorDoc.exists();
        
        setUser(user);
        setUserType(isDoctor ? 'doctor' : 'user');
        
        // Set up real-time profile listener
        profileUnsubscribe = onSnapshot(
          doc(db, isDoctor ? 'doctors' : 'users', user.uid),
          (doc) => {
            if (doc.exists()) {
              setProfile({ uid: doc.id, ...doc.data() });
            } else {
              setProfile(null);
            }
            setLoading(false); // Set loading to false after profile is loaded
          },
          (error) => {
            console.error('Error fetching profile:', error);
            setProfile(null);
            setLoading(false);
          }
        );

        // Set up real-time verification listener for doctors
        if (isDoctor) {
          verificationUnsubscribe = onSnapshot(
            doc(db, 'verification', user.uid),
            (doc) => {
              if (doc.exists()) {
                setVerification({ uid: doc.id, ...doc.data() });
              } else {
                setVerification(null);
              }
            },
            (error) => {
              console.error('Error fetching verification:', error);
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
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
      if (verificationUnsubscribe) {
        verificationUnsubscribe();
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
