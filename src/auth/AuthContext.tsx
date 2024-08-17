// src/auth/AuthContext.tsx
import React, { useContext, useState, useEffect, createContext } from "react";
import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

interface AuthContextProps {
  currentUser: User | null;
  userName: string | null;
  signup: (email: string, password: string, name: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  googleSignIn: () => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const signup = async (email: string, password: string, name: string) => {
    // Ensure this returns the userCredential object
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Add user information to Firestore
    const user = userCredential.user;
    await setDoc(doc(db, "users", email), {
      uid: user.uid,
      name,
      email,
      createdAt: new Date(),
    });

    return userCredential; // Return this object for further use in Signup component
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.email!));
      if (userDoc.exists()) {
        setUserName(userDoc.data().name);
      }
      navigate("/");
    } catch (error) {
      console.error("Failed to sign in with Google:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserName(null);
    navigate("/login");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.email!));
        if (userDoc.exists()) {
          setUserName(userDoc.data().name);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userName,
    signup,
    login,
    googleSignIn,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
