import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBbn2ilkvWxEqeMX2nD0VHb-aoBWKuFUFU",
  authDomain: "geosafe-735f1.firebaseapp.com",
  projectId: "geosafe-735f1",
  storageBucket: "geosafe-735f1.firebasestorage.app",
  messagingSenderId: "282153865188",
  appId: "1:282153865188:web:550fcdd930af324f9381f1",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);