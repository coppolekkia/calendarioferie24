import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0078533526",
  appId: "1:956205630002:web:af2dab8c20ff8c8d0e322b",
  apiKey: "AIzaSyBO2QV3bjv7WrjMF5gUw2lhbxSWQBGYsHs",
  authDomain: "gen-lang-client-0078533526.firebaseapp.com",
  storageBucket: "gen-lang-client-0078533526.firebasestorage.app",
  messagingSenderId: "956205630002"
};

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = "ai-studio-calendarioferie-5b8bc038-94df-447c-a932-5749f40baaa1";
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firestoreDatabaseId);
