
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getRemoteConfig, type RemoteConfig } from 'firebase/remote-config';

const firebaseConfig = {
  projectId: 'quiroagenda',
  appId: '1:77325796753:web:cb45dc3cfee137f83f8630',
  storageBucket: 'quiroagenda.firebasestorage.app',
  apiKey: 'AIzaSyBR921D3tLf0QfeBS4d6uhdzCxasd3mV4I',
  authDomain: 'quiroagenda.firebaseapp.com',
  messagingSenderId: '77325796753',
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
            "license_key_valid": false, // Default to false
        };
    }
    return remoteConfigInstance;
}

export { app, getRemoteConfigInstance as remoteConfig };
