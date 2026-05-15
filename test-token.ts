import { initializeApp as initializeAdminApp, credential } from 'firebase-admin';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp as initializeClientApp } from 'firebase/app';
import { getAuth as getClientAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import firebaseConfig from './firebase-applet-config.json';
import serviceAccount from './service-account.json'; // if we have it

async function runTest() {
  console.log("No service account available, cannot generate custom token.");
}
runTest();
