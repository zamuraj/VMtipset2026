import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDgZeryeAXjnW3u5fExDm029c1IoXLOqTI",
  authDomain: "kroppsoptimering.firebaseapp.com",
  projectId: "kroppsoptimering",
  storageBucket: "kroppsoptimering.firebasestorage.app",
  messagingSenderId: "676906891678",
  appId: "1:676906891678:web:89fb6f7411f9062db73e8f",
  measurementId: "G-LV434RW0CL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
