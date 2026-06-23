"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
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
      } else {
        setUser(null);
        setUserType(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (profileUnsubscribe) {
        profileUnsubscribe();
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

  const isDoctor = userType === 'doctor';
  const isVerifiedDoctor = isDoctor && profile?.verification_status === 'Verified';

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