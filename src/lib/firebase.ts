// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCMNEY5IcP7nGwKW7nt98AfTze1d62F8SE",
    authDomain: "forexsignal-371b3.firebaseapp.com",
    projectId: "forexsignal-371b3",
    storageBucket: "forexsignal-371b3.appspot.com",
    messagingSenderId: "617111923339",
    appId: "1:617111923339:web:063a079794acf64a3e028e",
};


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This function initializes Firebase and returns the services
function getFirebase() {
  if (getApps().length) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
  auth = getAuth(app);
  db = getFirestore(app);

  return { app, auth, db };
}

export { getFirebase };
