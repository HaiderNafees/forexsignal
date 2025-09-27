// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration is now hardcoded
const firebaseConfig = {
  "projectId": "studio-7266010797-fc857",
  "appId": "1:1042174511317:web:1e87e6a61932d20ade3a5c",
  "apiKey": "AIzaSyDLXBA-IFpLqr7wQ9BT9G-mgY94qWFbGUY",
  "authDomain": "studio-7266010797-fc857.firebaseapp.com",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This function initializes Firebase and returns the services
function getFirebase() {
  if (!app) {
    if (getApps().length) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfig);
    }
    auth = getAuth(app);
    db = getFirestore(app);
  }

  return { app, auth, db };
}

export { getFirebase };
