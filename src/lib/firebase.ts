import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// KUNCI RESMI DARI GOOGLE-SERVICES.JSON
const OFFICIAL_KEY = "AIzaSyDVJ189A_e59z7xMCufdwnpUwmuoQVuuLU";

const firebaseConfig = {
  apiKey: OFFICIAL_KEY,
  authDomain: "gen-lang-client-0026787248.firebaseapp.com",
  projectId: "gen-lang-client-0026787248",
  storageBucket: "gen-lang-client-0026787248.firebasestorage.app",
  messagingSenderId: "604958834296",
  appId: "1:604958834296:web:5d65b20d8481812123378d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
