
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
        // This is a dummy or placeholder for server-side execution
        // It won't be used for real operations on the server.
        return {} as RemoteConfig;
    }

    if (!remoteConfigInstance) {
        remoteConfigInstance = getRemoteConfig(app);
        remoteConfigInstance.settings.minimumFetchIntervalMillis = process.env.NODE_ENV === 'development' ? 0 : 3600000;
        remoteConfigInstance.defaultConfig = {};
    }
    return remoteConfigInstance;
}

export { app, getRemoteConfigInstance as remoteConfig };
