'use client'
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAB8Ifmm46XMULRiTNWpivV6UwxN3x8M1A",
    authDomain: "daobinhyen-c02a0.firebaseapp.com",
    projectId: "daobinhyen-c02a0",
    storageBucket: "daobinhyen-c02a0.firebasestorage.app",
    messagingSenderId: "756886504813",
    appId: "1:756886504813:web:c87f65f7f2f3e41d088664",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };