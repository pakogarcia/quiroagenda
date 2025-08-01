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
remoteConfig.settings.minimumFetchIntervalMillis = process.env.NODE_ENV === 'development' ? 0 : 3600000; // 0 for dev, 1h for prod

// Default values - We no longer need a single default, as each key will be checked.
// If a key does not exist in Remote Config, it will return the default value for getBoolean(), which is false.
remoteConfig.defaultConfig = {};


export { app, remoteConfig };
