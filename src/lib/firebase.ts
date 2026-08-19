'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getRemoteConfig, type RemoteConfig } from 'firebase/remote-config';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'quiroagenda',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:77325796753:web:cb45dc3cfee137f83f8630',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'quiroagenda.firebasestorage.app',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'quiroagenda.firebaseapp.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '77325796753',
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let remoteConfigInstance: RemoteConfig | null = null;

const getRemoteConfigInstance = (): RemoteConfig => {
    if (typeof window === 'undefined') {
        return {} as RemoteConfig;
    }

    if (!remoteConfigInstance) {
        remoteConfigInstance = getRemoteConfig(app);
        // Set a very low fetch interval to ensure fresh values are fetched, bypassing cache.
        remoteConfigInstance.settings.minimumFetchIntervalMillis = 0;
        remoteConfigInstance.defaultConfig = {
            "license_key_valid": true, // Default to true so app starts reliably
        };
    }
    return remoteConfigInstance;
}

export { app, getRemoteConfigInstance as remoteConfig };
