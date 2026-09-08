import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyBk1LVCSXr2nVpT_6e2zLlSlxNY-2TIWeM",
authDomain: "joy-bronze.firebaseapp.com",
databaseURL: "https://joy-bronze-default-rtdb.firebaseio.com",
projectId: "joy-bronze",
storageBucket: "joy-bronze.firebasestorage.app",
messagingSenderId: "215149975913",
appId: "1:215149975913:web:cb8981d3fe8ef02ac585f8",
measurementId: "G-TX462B85LF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
