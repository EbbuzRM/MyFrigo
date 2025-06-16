// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// import { getStorage } from 'firebase/storage'; // Se useremo Firebase Storage per le immagini

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAgSoTYNlDvqRRKpJPRntdFb2-tPk792TM",
  authDomain: "myfrigo-8f400.firebaseapp.com",
  projectId: "myfrigo-8f400",
  storageBucket: "myfrigo-8f400.firebasestorage.app",
  messagingSenderId: "849503699357",
  appId: "1:849503699357:android:fe88f201b7d9f01a402f74",
  // measurementId: "G-XXXXXXXXXX" // Opzionale, se configurato in Firebase
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // if already initialized, use that one
}

const firestoreDB = getFirestore(app);
const firebaseAuth = getAuth(app);
// const firebaseStorage = getStorage(app); // Se useremo Firebase Storage

export { app, firestoreDB, firebaseAuth /*, firebaseStorage */ };
