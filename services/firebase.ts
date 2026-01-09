
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Credenciales del proyecto 'survivai'
const firebaseConfig = {
  apiKey: "AIzaSyBya7tPHliAVG0tMK3qPOhHOecCwHzD5AE",
  authDomain: "survivai.firebaseapp.com",
  projectId: "survivai",
  storageBucket: "survivai.firebasestorage.app",
  messagingSenderId: "413194703492",
  appId: "1:413194703492:web:acd04d2f73ec7f7123a8d1",
  measurementId: "G-9P8DY3V7RE"
};

// Inicialización controlada (Singleton)
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase inicializado correctamente: Survivai");
} catch (error) {
    console.error("Error crítico inicializando Firebase:", error);
}

export { auth, db };
