
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
    /**
     * Gestión de la Clave de Licencia.
     * 
     * 1. ¿Cómo funciona?
     *    - La primera vez que un usuario abre la app en un navegador, se genera una clave única (UUID).
     *    - Esta clave se guarda en el `localStorage` del navegador. El `localStorage` es un pequeño
     *      almacén de datos persistente que pertenece a un sitio web específico en un navegador concreto.
     *    - En las siguientes visitas desde ese mismo navegador/dispositivo, la app leerá la clave ya guardada.
     * 
     * 2. ¿La clave es única por usuario o por dispositivo?
     *    - La clave es única por **navegador en un dispositivo específico**.
     *    - Si un usuario accede desde Chrome en su portátil y luego desde Safari en su móvil, se generarán
     *      DOS claves diferentes, una para cada navegador.
     * 
     * 3. ¿Qué pasa si el usuario borra la caché?
     *    - Si el usuario borra los datos de navegación ("site data" o "local storage"), la clave se eliminará.
     *    - La próxima vez que abra la app, se generará una **NUEVA** clave, y el administrador deberá
     *      validarla de nuevo en Firebase Remote Config.
     * 
     * 4. Formato de la clave:
     *    - La clave se genera usando crypto.randomUUID().
     *    - Se le quitan los guiones y se le añade el prefijo "key_" para que sea compatible con las reglas
     *      de nombres de parámetros de Firebase Remote Config (no guiones, no empezar con número).
     */
    let key = localStorage.getItem(LICENSE_KEY_STORAGE);
    
    // Comprueba si la clave no existe o si está en el formato antiguo (con guiones).
    // Si es así, genera una nueva clave con el formato correcto.
    if (!key || key.includes('-')) {
      key = `key_${crypto.randomUUID().replace(/-/g, '')}`;
      localStorage.setItem(LICENSE_KEY_STORAGE, key);
    }
    
    setLicenseKey(key);

    const checkLicense = async (keyToCheck: string) => {
      try {
        await fetchAndActivate(remoteConfig());
        const isValid = getBoolean(remoteConfig(), keyToCheck);
        
        if (isValid) {
          setLicenseStatus('valid');
        } else {
          setLicenseStatus('invalid');
        }
      } catch (error) {
        console.error("Error fetching remote config for license check:", error);
        // Por seguridad, si hay un error, se considera la licencia inválida.
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

  // Si la licencia es válida, renderiza la aplicación real.
  return <>{children}</>;
}
