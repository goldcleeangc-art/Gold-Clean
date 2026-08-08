import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

let firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

let databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;

// Fallback to local config file if env vars are missing (e.g. during production build compilation)
if (!firebaseConfig.apiKey) {
  try {
    const localConfig = require("../firebase-applet-config.json");
    firebaseConfig = {
      projectId: localConfig.projectId || "",
      appId: localConfig.appId || "",
      apiKey: localConfig.apiKey || "",
      authDomain: localConfig.authDomain || "",
      storageBucket: localConfig.storageBucket || "",
      messagingSenderId: localConfig.messagingSenderId || "",
      measurementId: localConfig.measurementId || ""
    };
    if (!databaseId) {
      databaseId = localConfig.firestoreDatabaseId;
    }
  } catch (e) {
    console.warn("No firebase config env vars or firebase-applet-config.json found.");
  }
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use custom database ID if provided, otherwise use default
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
