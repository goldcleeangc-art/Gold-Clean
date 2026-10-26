import { useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { isUserMasterAdmin } from '../lib/types/store';

export function useStoreAuth() {
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<'user' | 'manager' | 'admin'>('user');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubRole: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (unsubRole) {
        unsubRole();
        unsubRole = null;
      }

      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const isAdminEmail = isUserMasterAdmin(currentUser.email);

        getDoc(userRef).then((snap) => {
          let finalRole: 'user' | 'manager' | 'admin' = isAdminEmail ? 'admin' : 'user';
          if (snap.exists()) finalRole = snap.data().role || finalRole;
          if (isAdminEmail) finalRole = 'admin';

          return setDoc(userRef, {
            email: currentUser.email || '',
            name: currentUser.displayName || 'عميل Gold Clean',
            photoURL: currentUser.photoURL || '',
            role: finalRole,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }).catch(err => console.error("Error setting user document:", err));

        unsubRole = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role || 'user');
          } else {
            setUserRole(isAdminEmail ? 'admin' : 'user');
          }
        }, (error) => {
          const defaultRole = isAdminEmail ? 'admin' : 'user';
          if (error.code === 'permission-denied') {
            setUserRole(defaultRole);
          } else {
            console.error("Error listening to user role overrides:", error);
          }
        });

        setCheckingAuth(false);
      } else {
        setUserRole('user');
        setCheckingAuth(false);
      }
    });

    return () => {
      if (unsubRole) unsubRole();
      unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const loggedUser = result.user;
      setUser(loggedUser);
      setIsAuthModalOpen(false);

      const userRef = doc(db, 'users', loggedUser.uid);
      const isAdminEmail = isUserMasterAdmin(loggedUser.email);
      const snap = await getDoc(userRef);
      
      let finalRole: 'user' | 'manager' | 'admin' = isAdminEmail ? 'admin' : 'user';
      if (snap.exists()) finalRole = snap.data().role || finalRole;
      if (isAdminEmail) finalRole = 'admin';

      await setDoc(userRef, {
        email: loggedUser.email || '',
        name: loggedUser.displayName || 'عميل Gold Clean',
        photoURL: loggedUser.photoURL || '',
        role: finalRole,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setAuthError('فشل تسجيل الدخول: ' + (err.message || 'يرجى المحاولة مجدداً'));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole('user');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    checkingAuth,
    userRole,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authError,
    handleGoogleSignIn,
    handleSignOut
  };
}