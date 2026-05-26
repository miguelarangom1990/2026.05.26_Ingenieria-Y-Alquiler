import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, linkWithPopup, reauthenticateWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { User, Role } from '../types';
import { Permission } from '../constants/permissions';

import { fetchProfileEmail } from '../services/gmailService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  userRole: Role | null;
  isLoading: boolean;
  accessToken: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  viewingAsRole: Role | null;
  setViewAsRole: (role: Role | null) => void;
  gmailAccounts: { email: string; accessToken: string }[];
  activeGmailEmail: string | null;
  setActiveGmailEmail: (email: string | null) => void;
  removeGmailAccount: (email: string) => void;
  addGmailAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [viewingAsRole, setViewAsRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [gmailAccounts, setGmailAccounts] = useState<{ email: string; accessToken: string }[]>(() => {
    try {
      const saved = localStorage.getItem('gmail_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeGmailEmail, setActiveGmailEmailState] = useState<string | null>(() => {
    return localStorage.getItem('active_gmail_email');
  });

  const setActiveGmailEmail = (email: string | null) => {
    setActiveGmailEmailState(email);
    if (email) {
      localStorage.setItem('active_gmail_email', email);
    } else {
      localStorage.removeItem('active_gmail_email');
    }
  };

  const removeGmailAccount = (email: string) => {
    setGmailAccounts((prev) => {
      const updated = prev.filter(acc => acc.email.toLowerCase() !== email.toLowerCase());
      localStorage.setItem('gmail_accounts', JSON.stringify(updated));
      return updated;
    });
    if (activeGmailEmail?.toLowerCase() === email.toLowerCase()) {
      setActiveGmailEmail(null);
    }
  };

  const handleAddNewToken = async (token: string) => {
    setAccessToken(token);
    try {
      const email = await fetchProfileEmail(token);
      if (email) {
        setGmailAccounts((prev) => {
          const newAccount = { email, accessToken: token };
          const index = prev.findIndex(acc => acc.email.toLowerCase() === email.toLowerCase());
          let updated;
          if (index !== -1) {
            updated = [...prev];
            updated[index] = newAccount;
          } else {
            updated = [...prev, newAccount];
          }
          localStorage.setItem('gmail_accounts', JSON.stringify(updated));
          return updated;
        });
        setActiveGmailEmail(email);
      }
    } catch (e) {
      console.error("Error fetching email profile for newly added token:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (!user) {
        setAccessToken(null);
      }

      if (user) {
        try {
          // Fetch user data from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as User;
            setUserData(data);
            
            // Fetch role data
            if (data.roleId) {
              const roleDocRef = doc(db, 'roles', data.roleId);
              const roleDocSnap = await getDoc(roleDocRef);
              if (roleDocSnap.exists()) {
                setUserRole(roleDocSnap.data() as Role);
              }
            }
          } else {
            // Document doesn't exist, this might be a new user or missing access.
            // For now, we won't automatically create a user document to avoid
            // unauthorized access. The admin will create/assign roles.
            // Note: If you want auto-creation on first login, uncomment below:
            /*
            const newUser: User = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              roleId: 'viewer', // default role
              isActive: true,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newUser);
            setUserData(newUser);
            */
           // Let's create a temporary user state if the document is missing
           // They will simply have no role or permissions until the admin assigns one.
           const temporaryUser: User = {
             uid: user.uid,
             email: user.email || '',
             displayName: user.displayName || '',
             photoURL: user.photoURL || '',
             roleId: '', // No role assigned initially
             isActive: true,
           };
           // We keep the DB empty for this user until an admin registers them, or we could add them automatically.
           // For simplicity and testing let's save the basic profile in 'users' but with no role.
           await setDoc(userDocRef, temporaryUser);
           setUserData(temporaryUser);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
        setUserRole(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

    provider.setCustomParameters({
      prompt: 'select_account'
    });

    if (currentUser) {
      try {
        // Obtenemos una credencial actualizada u otorgamos nuevos permisos (scopes)
        // intentando reautenticar o vincular. Si la cuenta ya tiene Google como proveedor
        // esto puede fallar si intentan usar una cuenta diferente.
        const providerId = currentUser.providerData.find(p => p.providerId === 'google.com');
        if (providerId) {
            // El usuario ya tiene google vinculado. Reautenticamos para obtener nuevos permisos(scopes).
            const result = await reauthenticateWithPopup(currentUser, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
               await handleAddNewToken(credential.accessToken);
            }
        } else {
            // No tiene google. Lo vinculamos.
            const result = await linkWithPopup(currentUser, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
              await handleAddNewToken(credential.accessToken);
            }
        }
      } catch (error: any) {
        console.error("Error al autenticar para Gmail:", error);
        if (error.code === 'auth/credential-already-in-use') {
           throw new Error("Esta cuenta de Google ya está registrada o vinculada a otro usuario en el sistema. No puedes vincular otra cuenta diferente a la actual.");
        } else if (error.code === 'auth/provider-already-linked') {
           throw new Error("Ya tienes una cuenta de Google vinculada.");
        } else if (error.code === 'auth/popup-closed-by-user') {
           throw new Error("La ventana de autorización de Google fue cerrada antes de finalizar.");
        } else if (error.code === 'auth/popup-blocked') {
           throw new Error("La ventana emergente fue bloqueada por el navegador. Por favor, permite las ventanas emergentes (pop-ups) e intenta de nuevo.");
        }
        throw new Error(error.message || "Error al conectar con Google");
      }
    } else {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        await handleAddNewToken(credential.accessToken);
      }
    }
  };

  const addGmailAccount = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        await handleAddNewToken(credential.accessToken);
      }
    } catch (error: any) {
      console.error("Error al añadir cuenta de Gmail:", error);
      if (error.code === 'auth/popup-closed-by-user') {
         throw new Error("La ventana de autorización de Google fue cerrada.");
      } else if (error.code === 'auth/popup-blocked') {
         throw new Error("La ventana emergente fue bloqueada por el navegador. Por favor perimite pop-ups para continuar.");
      }
      throw new Error(error.message || "Error al conectar con Google");
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (viewingAsRole) {
      return viewingAsRole.permissions.includes(permission);
    }
    if (currentUser?.email === 'recepcionfacturas@ingenieriayalquiler.com') {
      return true;
    }
    if (!userRole) return false;
    // Admins usually have all permissions, but for safety rely on the roles permissions list.
    return userRole.permissions.includes(permission);
  };

  const activeRole = viewingAsRole || userRole;

  const activeToken = activeGmailEmail
    ? (gmailAccounts.find(acc => acc.email.toLowerCase() === activeGmailEmail.toLowerCase())?.accessToken || accessToken)
    : (gmailAccounts[0]?.accessToken || accessToken);

  return (
    <AuthContext.Provider value={{ currentUser, userData, userRole: activeRole, isLoading, accessToken: activeToken, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, logout, hasPermission, viewingAsRole, setViewAsRole, gmailAccounts, activeGmailEmail, setActiveGmailEmail, removeGmailAccount, addGmailAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
