'use client';

import * as React from 'react';
import { remoteConfig } from '@/lib/firebase';
import { fetchAndActivate, getBoolean } from 'firebase/remote-config';
import { SplashScreen } from './layout/splash-screen';
import { InvalidLicense } from './invalid-license';

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const [licenseStatus, setLicenseStatus] = React.useState<'loading' | 'valid' | 'invalid'>('loading');

  React.useEffect(() => {
    const checkLicense = async () => {
      try {
        // Fetch the latest values from the backend.
        await fetchAndActivate(remoteConfig);
        // Get the value of our license key.
        const isValid = getBoolean(remoteConfig, 'license_key_valid');
        
        if (isValid) {
          setLicenseStatus('valid');
        } else {
          setLicenseStatus('invalid');
        }
      } catch (error) {
        console.error("Error fetching remote config for license check:", error);
        // If there's any error, default to invalid for security.
        setLicenseStatus('invalid');
      }
    };

    checkLicense();
  }, []);

  if (licenseStatus === 'loading') {
    return <SplashScreen />;
  }

  if (licenseStatus === 'invalid') {
    return <InvalidLicense />;
  }

  // If license is valid, render the actual app
  return <>{children}</>;
}
