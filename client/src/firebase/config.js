import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCDF0OUJcRX4I6R7iEfMhT8D4ZB_UTY5DU",
  authDomain: "surplus-to-shelter-bf873.firebaseapp.com",
  projectId: "surplus-to-shelter-bf873",
  storageBucket: "surplus-to-shelter-bf873.firebasestorage.app",
  messagingSenderId: "687207843771",
  appId: "1:687207843771:web:2ca6039b7d55dfd6eda69e"
};

const app = initializeApp(firebaseConfig);

export default app;