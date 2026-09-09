import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCdakn-JJI7sddaaAyOBqRWSZS9s1xRBoM",
  authDomain: "giftcraft-5c6c8.firebaseapp.com",
  projectId: "giftcraft-5c6c8",
  storageBucket: "giftcraft-5c6c8.firebasestorage.app",
  messagingSenderId: "770704176760",
  appId: "1:770704176760:web:bb85ae03e9578d4e5c1f8d",
  measurementId: "G-FX2EPRB1WP",
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

function getApp(): FirebaseApp {
  if (!app) app = getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

export function getAuthClient(): Auth {
  if (!authInstance) authInstance = getAuth(getApp());
  return authInstance;
}

export function getDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(getApp());
  return dbInstance;
}

export function getStorageClient(): FirebaseStorage | null {
  try {
    if (!storageInstance) storageInstance = getStorage(getApp());
    return storageInstance;
  } catch {
    return null;
  }
}

export const ADMIN_EMAIL = "brcreatives4@gmail.com";
export const UPI_ID = "9176501954@ibl";


