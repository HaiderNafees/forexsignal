// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "studio-7266010797-fc857",
  "appId": "1:1042174511317:web:1e87e6a61932d20ade3a5c",
  "apiKey": "AIzaSyDLXBA-IFpLqr7wQ9BT9G-mgY94qWFbGUY",
  "authDomain": "studio-7266010797-fc857.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1042174511317"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
