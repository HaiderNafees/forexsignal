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

// This function lazily initializes Firebase.
// It ensures that Firebase is only initialized when the config is available.
function initializeFirebase() {
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId ||
    !firebaseConfig.appId
  ) {
    // This will now only be a warning in the browser console if config is missing,
    // instead of a build-breaking error.
    console.error("Firebase configuration is missing. Make sure all NEXT_PUBLIC_FIREBASE_* environment variables are set.");
    // We can't proceed, so we'll just have to stop here.
    // The app will not have firebase functionality but at least it will build.
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

// Call the function to initialize Firebase.
// This will run when this module is first imported.
initializeFirebase();

// Export the initialized services.
// They might be undefined if initialization failed, but this prevents build errors.
export { app, auth, db };
