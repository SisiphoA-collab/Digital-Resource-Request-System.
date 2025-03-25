import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwBgGhU6w080DW_XP_cIByvz7ctZA-hKY",
  authDomain: "my-app-6b118.firebaseapp.com",
  databaseURL: "https://my-app-6b118-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-app-6b118",
  storageBucket: "my-app-6b118.firebasestorage.app",
  messagingSenderId: "402071573813",
  appId: "1:402071573813:web:0abd6bc08753d8dc44e87c",
  measurementId: "G-CRQKK5JDH9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// Function to register a user and send a verification email
const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);
    
    return { success: true, message: "Verification email sent. Please check your inbox." };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export { auth, db, analytics, storage, registerUser };
