import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// TODO: Replace with actual configuration
const firebaseConfig = {
    apiKey: "AIzaSyCLDdIMg0Ci1svtSw-axZuXxQ0ZUA1SzpE",
    authDomain: "quiz-guru-engine.firebaseapp.com",
    databaseURL: "https://quiz-guru-engine-default-rtdb.firebaseio.com",
    projectId: "quiz-guru-engine",
    storageBucket: "quiz-guru-engine.firebasestorage.app",
    messagingSenderId: "849351009851",
    appId: "1:849351009851:web:8787eecd89e3e093311e1e",
    measurementId: "G-SJ6P05XYG5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
