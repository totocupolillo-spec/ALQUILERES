import { db } from './firebase';
import { collection, addDoc, getDocs, limit, query } from 'firebase/firestore';

export async function firebaseSmokeTest() {
  try {
    // 1) Escribimos un doc de prueba
    await addDoc(collection(db, 'smoke_test'), {
      createdAt: new Date().toISOString(),
      message: 'Firebase conectado OK'
    });

    // 2) Leemos 1 doc de prueba
    const q = query(collection(db, 'smoke_test'), limit(1));
    const snap = await getDocs(q);

    console.log('✅ Firestore OK. Docs encontrados:', snap.size);
    snap.forEach(d => console.log('Doc:', d.id, d.data()));
  } catch (err) {
    console.error('❌ Firestore FAIL:', err);
    throw err;
  }
}