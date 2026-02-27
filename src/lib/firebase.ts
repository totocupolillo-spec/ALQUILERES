import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDUDEQW1srj8pU2pIvgD0d-VEBFXLkiLhA",
  authDomain: "sistema-de-alquileres-364a5.firebaseapp.com",
  projectId: "sistema-de-alquileres-364a5",
  storageBucket: "sistema-de-alquileres-364a5.firebasestorage.app",
  messagingSenderId: "344893816322",
  appId: "1:344893816322:web:5851116bb5b7c88970711b"
};

// Inicializa Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Inicializa Firestore (Base de datos)
export const db = getFirestore(firebaseApp);