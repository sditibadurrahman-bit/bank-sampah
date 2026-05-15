
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function dumpUsers() {
  console.log("Dumping ALL users:");
  const snapshot = await getDocs(collection(db, 'users'));
  console.log("Count:", snapshot.size);
  snapshot.forEach((doc) => {
    console.log(doc.id, doc.data());
  });
}

dumpUsers();
