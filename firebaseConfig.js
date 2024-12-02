// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMLzUBxZ7BWHMf8FrceImsPAV_bOEC3KM", // API_KEY from GoogleService-Info.plist
  authDomain: "photo-app-6a4ef.firebaseapp.com", // Format: <project_id>.firebaseapp.com
  projectId: "photo-app-6a4ef", // PROJECT_ID from both files
  storageBucket: "photo-app-6a4ef.firebasestorage.app", // STORAGE_BUCKET from both files
  messagingSenderId: "73653748968", // GCM_SENDER_ID from GoogleService-Info.plist
  appId: "1:73653748968:android:5d3959e29b80355110355d" // GOOGLE_APP_ID from google-services.json (Android)
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export const storage = getStorage(firebaseApp); // Export Firebase Storage instance
export const db = getFirestore(firebaseApp); // Export Firestore