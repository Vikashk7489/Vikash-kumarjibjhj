import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Databases
export const rtdb = getDatabase(app);

// Connectivity check for Realtime Database
const connectedRef = ref(rtdb, ".info/connected");
onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
    console.log("Realtime Database: Connected");
  } else {
    console.warn("Realtime Database: Disconnected / Local data only");
  }
});
