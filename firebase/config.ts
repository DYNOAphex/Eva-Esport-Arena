import { getApp, getApps, initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyDOR7kw6b5bpe1QQtx646xsUyGQl26Ft14",
  authDomain: "eva-esport-arena.firebaseapp.com",
  projectId: "eva-esport-arena",
  storageBucket: "eva-esport-arena.firebasestorage.app",
  messagingSenderId: "305693664434",
  appId: "1:305693664434:web:7c7e807395d57413a055ab",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
