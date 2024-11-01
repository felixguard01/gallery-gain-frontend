import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/database';
import 'firebase/compat/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyB39hD3WmeOSCxqdl0Dn0NxjzHJ6pG3DgI",
  authDomain: "photo-shop-53bed.firebaseapp.com",
  databaseURL: "https://photo-shop-53bed-default-rtdb.firebaseio.com",
  projectId: "photo-shop-53bed",
  storageBucket: "photo-shop-53bed.appspot.com",
  messagingSenderId: "1095590903758",
  appId: "1:1095590903758:web:ed648cbda86e930852359f",
  measurementId: "G-B6475WL6SN"
};

// ตรวจสอบว่ามีการ initialize Firebase แล้วหรือยัง
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);

    // Initialize Firebase Analytics ถ้าต้องการใช้งาน
    if (typeof window !== 'undefined' && 'measurementId' in firebaseConfig) {
        firebase.analytics();
    }
}

export default firebase;
