import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("Firebase client helpers must run in the browser.");
  }
}

export function getFirebaseApp() {
  assertBrowser();
  appInstance ??= getApps().length ? getApp() : initializeApp(firebaseConfig);
  return appInstance;
}

export function getClientAuth() {
  authInstance ??= getAuth(getFirebaseApp());
  return authInstance;
}

export function getClientDb() {
  dbInstance ??= getFirestore(getFirebaseApp());
  return dbInstance;
}

export function isTeacherUser(user: User | null) {
  return Boolean(user && !user.isAnonymous);
}

export function getCurrentUser() {
  if (typeof window === "undefined") {
    return null;
  }

  return getClientAuth().currentUser;
}

export function observeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(getClientAuth(), callback);
}

export async function ensureAnonymousAuth() {
  const auth = getClientAuth();
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function signInTeacherWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(getClientAuth(), email, password);
  return result.user;
}

export async function registerTeacherWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(getClientAuth(), email, password);
  return result.user;
}

export async function signOutCurrentUser() {
  await signOut(getClientAuth());
}

export function requireAuthenticatedUser() {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }

  return user;
}

export function requireTeacherUser() {
  const user = requireAuthenticatedUser();
  if (!isTeacherUser(user)) {
    throw new Error("Teacher authentication required.");
  }

  return user;
}

export function requireCurrentUserUid(expectedUid: string) {
  const user = requireAuthenticatedUser();
  if (user.uid !== expectedUid) {
    throw new Error("This action is only allowed for the current user.");
  }

  return user;
}
