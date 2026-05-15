import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  console.log("Adding doc");
  try {
    const res = await setDoc(doc(db, "users", "testuid"), {
        id: "testuid",
        name: "test",
        address: "test",
        phone: "123",
        email: "test@example.com",
        role: "nasabah",
        balance: 0,
        joinDate: new Date().toISOString(),
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    console.log("Success", res);
  } catch (e) {
    console.log("Error", e);
  }
}
test();
