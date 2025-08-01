'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getRemoteConfig } from 'firebase/remote-config';

const firebaseConfig = {
  projectId: 'quiroagenda',
  appId: '1:77325796753:web:cb45dc3cfee137f83f8630',
  storageBucket: 'quiroagenda.firebasestorage.app',
  apiKey: 'AIzaSyBR921D3tLf0QfeBS4d6uhdzCxasd3mV4I',
  authDomain: 'quiroagenda.firebaseapp.com',
  messagingSenderId: '77325796753',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const remoteConfig = getRemoteConfig(app);

// It's a good practice to set default values in case fetching fails
// or for the first time a user opens the app.
if (typeof window !== 'undefined') {
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
    
    // Default values
    remoteConfig.defaultConfig = {
      'license_key_valid': false, // Default to false
    };
}


export { app, remoteConfig };
