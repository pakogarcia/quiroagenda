'use client';

import * as React from 'react';
import { remoteConfig } from '@/lib/firebase';
import { fetchAndActivate, getBoolean } from 'firebase/remote-config';
import { SplashScreen } from './layout/splash-screen';
import { InvalidLicense } from './invalid-license';

const LICENSE_KEY_STORAGE = 'quiroagenda_license_key';

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const [licenseStatus, setLicenseStatus] = React.useState<'loading' | 'valid' | 'invalid'>('loading');
  const [licenseKey, setLicenseKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    // This effect should only run once on the client side.
    let key = localStorage.getItem(LICENSE_KEY_STORAGE);
    
    // Check if the key is in the old, invalid format (contains hyphens) or doesn't exist.
    if (!key || key.includes('-')) {
      // Generate a new, valid key for Remote Config: starts with a letter, no hyphens.
      key = `key_${crypto.randomUUID().replace(/-/g, '')}`;
      localStorage.setItem(LICENSE_KEY_STORAGE, key);
    }
    
    setLicenseKey(key);

    const checkLicense = async (keyToCheck: string) => {
      try {
        await fetchAndActivate(remoteConfig);
        const isValid = getBoolean(remoteConfig, keyToCheck);
        
        if (isValid) {
          setLicenseStatus('valid');
        } else {
          setLicenseStatus('invalid');
        }
      } catch (error) {
        console.error("Error fetching remote config for license check:", error);
        // Default to invalid if there's an error, to be safe.
        setLicenseStatus('invalid');
      }
    };

    if (key) {
        checkLicense(key);
    }

  }, []);

  if (licenseStatus === 'loading') {
    return <SplashScreen />;
  }

  if (licenseStatus === 'invalid') {
    return <InvalidLicense licenseKey={licenseKey} />;
  }

  // If license is valid, render the actual app
  return <>{children}</>;
}
