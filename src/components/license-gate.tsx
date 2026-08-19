"use client"

import * as React from "react"
import { remoteConfig } from "@/lib/firebase"
import { fetchAndActivate, getBoolean } from "firebase/remote-config"
import { SplashScreen } from "./layout/splash-screen"
import { InvalidLicense } from "./invalid-license"

import { usePathname } from "next/navigation"

const LICENSE_KEY_STORAGE = "quiroagenda_license_key"

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [licenseStatus, setLicenseStatus] = React.useState<"loading" | "valid" | "invalid">("loading")
  const [licenseKey, setLicenseKey] = React.useState<string | null>(null)

  const isPublicRoute = pathname?.startsWith('/reservas') || pathname?.startsWith('/api')

  React.useEffect(() => {
    if (isPublicRoute) {
      setLicenseStatus("valid")
      return
    }
    let key = localStorage.getItem(LICENSE_KEY_STORAGE)
    if (!key || key.includes("-")) {
      key = `key_${crypto.randomUUID().replace(/-/g, "")}`
      localStorage.setItem(LICENSE_KEY_STORAGE, key)
    }
    setLicenseKey(key)
  }, [isPublicRoute])

  React.useEffect(() => {
    if (!licenseKey) return

    const checkLicense = async () => {
      // Reloj de seguridad de 8 segundos para evitar bloqueos infinitos de "Starting app"
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve("timeout"), 8000)
      );

      try {
        const fetchPromise = (async () => {
          try {
            const rc = remoteConfig();
            if (!rc || !rc.settings) return true;
            await fetchAndActivate(rc);
            const keyValid = getBoolean(rc, licenseKey);
            const generalValid = getBoolean(rc, "license_key_valid");
            return keyValid || generalValid;
          } catch (e) {
            console.warn("Firebase Remote Config fetch warning (proceeding with local access):", e);
            return true;
          }
        })();

        const result = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (result === "timeout") {
            console.warn("License check timed out. Proceeding to start application.");
            setLicenseStatus("valid");
            return;
        }

        if (result === true) {
          setLicenseStatus("valid");
        } else {
          setLicenseStatus("invalid");
        }
      } catch (error) {
        console.warn("License check error, allowing access:", error);
        setLicenseStatus("valid");
      }
    };

    checkLicense();
  }, [licenseKey])

  if (isPublicRoute) {
    return <>{children}</>
  }

  if (licenseStatus === "loading") {
    return <SplashScreen />
  }

  if (licenseStatus === "invalid") {
    return <InvalidLicense licenseKey={licenseKey} />
  }

  return <>{children}</>
}