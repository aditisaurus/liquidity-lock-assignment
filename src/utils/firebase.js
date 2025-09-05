import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCsYdGsds6daPCn2RKVVXw3bFxMzO-jciI",
  authDomain: "liquidity-lock-assignment.firebaseapp.com",
  projectId: "liquidity-lock-assignment",
  storageBucket: "liquidity-lock-assignment.firebasestorage.app",
  messagingSenderId: "692368002813",
  appId: "1:692368002813:web:7128e20abed3f7c381b894",
  measurementId: "G-EK8P8DFF5Z",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
