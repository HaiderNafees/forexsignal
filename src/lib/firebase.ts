
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration is now loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This function checks if the config is valid and initializes Firebase.
// It's designed to be run on the client side.
function initializeFirebaseClient() {
    if (
        !firebaseConfig.apiKey ||
        !firebaseConfig.authDomain ||
        !firebaseConfig.projectId ||
        !firebaseConfig.appId
    ) {
        console.error("Firebase configuration is missing. Make sure all NEXT_PUBLIC_FIREBASE_* environment variables are set.");
        // We don't throw here to avoid crashing the server during build.
        // The error will be visible in the browser console.
        return;
    }
  
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
}

// Initialize on module load (client-side)
if (typeof window !== 'undefined') {
    initializeFirebaseClient();
}


export { app, auth, db, initializeFirebaseClient };
