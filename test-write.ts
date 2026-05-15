import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  console.log("Adding doc testuid2");
  try {
    const res = await setDoc(doc(db, "users", "testuid2"), {
        id: "testuid2",
        name: "test",
        email: "test@example.com",
        role: "nasabah",
        balance: 0,
        joinDate: new Date().toISOString(),
        isActive: false,
    });
    console.log("Success", res);
  } catch (e) {
    console.error("Error", e);
  }
}
test();
