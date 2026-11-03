'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { getInitialAppointments } from '@/lib/data';
import type { Appointment, Client, Service, BusinessProfile, VoucherSale, Expense } from '@/lib/types';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

const APPOINTMENTS_STORAGE_KEY = 'quiroagenda_appointments';
const CLIENTS_STORAGE_KEY = 'quiroagenda_clients';
const SERVICES_STORAGE_KEY = 'quiroagenda_services';
const BLOCKED_DAYS_STORAGE_KEY = 'quiroagenda_blocked_days';
const PROFILE_STORAGE_KEY = 'quiroagenda_profile';
const VOUCHER_SALES_STORAGE_KEY = 'quiroagenda_voucher_sales';
const EXPENSES_STORAGE_KEY = 'quiroagenda_expenses';

const STORAGE_KEYS = [
    APPOINTMENTS_STORAGE_KEY,
    CLIENTS_STORAGE_KEY,
    SERVICES_STORAGE_KEY,
    BLOCKED_DAYS_STORAGE_KEY,
    PROFILE_STORAGE_KEY,
    VOUCHER_SALES_STORAGE_KEY,
    EXPENSES_STORAGE_KEY
];

const getInitialServices = (): Service[] => {
    return [
        { id: '1', name: 'Masaje Relajante', duration: 60, price: 25 },
        { id: '2', name: 'Masaje Integral (Cuerpo Entero)', duration: 60, price: 40 },
        { id: '3', name: 'Espalda y Cuello', duration: 60, price: 25 },
        { id: '4', name: 'Espalda y Piernas', duration: 60, price: 25 },
        { id: '5', name: 'Alquimia Massage', duration: 75, price: 30 },
        { id: '6', name: 'Vulcan Massage (Piedras Calientes)', duration: 60, price: 35 },
        { id: '7', name: 'Candle Massage (Velas de Karité)', duration: 60, price: 35 },
        { id: '8', name: 'Masaje Circulatorio', duration: 60, price: 25 },
        { id: '9', name: 'Masaje de Pies (Reflexología Podal)', duration: 30, price: 15 },
        { id: '10', name: 'Masaje Parejas', duration: 120, price: 43 },
        { id: '11', name: 'Drenaje Linfático', duration: 50, price: 45 },
    ];
};

type AppDataContextType = {
    appointments: Appointment[];
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    services: Service[];
    setServices: React.Dispatch<React.SetStateAction<Service[]>>;
    blockedDays: string[];
    setBlockedDays: React.Dispatch<React.SetStateAction<string[]>>;
    profile: BusinessProfile | null;
    setProfile: React.Dispatch<React.SetStateAction<BusinessProfile | null>>;
    voucherSales: VoucherSale[];
    setVoucherSales: React.Dispatch<React.SetStateAction<VoucherSale[]>>;
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    isLoading: boolean;
    loadData: () => void;
    refreshData: () => Promise<void>;
    addAppointment: (apt: Appointment) => Promise<void>;
    updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
    deleteAppointment: (id: string) => Promise<void>;
    setCloudBlockedDays: (days: string[]) => Promise<void>;
    updateProfile: (newProfile: BusinessProfile) => Promise<void>;
    exportData: () => void;
    importData: (jsonString: string) => Promise<void>;
};

const AppDataContext = React.createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
    const [appointments, setAppointments] = React.useState<Appointment[]>([]);
    const [clients, setClients] = React.useState<Client[]>([]);
    const [services, setServices] = React.useState<Service[]>([]);
    const [blockedDays, setBlockedDays] = React.useState<string[]>([]);
    const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
    const [voucherSales, setVoucherSales] = React.useState<VoucherSale[]>([]);
    const [expenses, setExpenses] = React.useState<Expense[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    
    const pathname = usePathname();
    const isPublic = React.useMemo(() => {
        if (!pathname) return false;
        if (pathname.startsWith('/reservas') || pathname.startsWith('/mi-cuenta') || pathname.startsWith('/api')) {
            return true;
        }
        if (pathname === '/') {
            if (typeof window !== 'undefined') {
                const host = window.location.hostname.toLowerCase();
                return !host.includes('hosted.app') && !host.includes('localhost') && !host.includes('127.0.0.1');
            }
            return true;
        }
        return false;
    }, [pathname]);

    const isCloudLoadedRef = React.useRef(false);
    const isIncomingFromCloudRef = React.useRef(false);

    // 1. Initial Local Storage Hydration
    const loadLocalFallback = React.useCallback(() => {
        if (isPublic) return;
        try {
            if (typeof window === 'undefined') return;

            const safeParse = (key: string, fallback: any) => {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : fallback;
                } catch {
                    return fallback;
                }
            };

            const rawAppointments = safeParse(APPOINTMENTS_STORAGE_KEY, null);
            if (rawAppointments && Array.isArray(rawAppointments)) {
                setAppointments(
                    rawAppointments
                        .map((apt: any) => ({
                            ...apt,
                            dateTime: new Date(apt.dateTime),
                            status: apt.status || 'scheduled',
                            payment: apt.payment || undefined,
                        }))
                        .filter((apt: Appointment) => apt.dateTime && !isNaN(new Date(apt.dateTime).getTime()))
                );
            } else {
                setAppointments(getInitialAppointments(new Date()));
            }

            const rawClients = safeParse(CLIENTS_STORAGE_KEY, []);
            setClients(Array.isArray(rawClients) ? rawClients : []);

            const rawServices = safeParse(SERVICES_STORAGE_KEY, null);
            setServices(rawServices && Array.isArray(rawServices) ? rawServices : getInitialServices());

            const rawBlockedDays = safeParse(BLOCKED_DAYS_STORAGE_KEY, []);
            setBlockedDays(Array.isArray(rawBlockedDays) ? rawBlockedDays : []);

            const defaultProfile = {
                name: 'QuiroAgenda',
                address: '',
                phone: '',
                openingHours: {
                    morning: { start: '09:00', end: '14:00', enabled: true },
                    afternoon: { start: '16:00', end: '20:00', enabled: true },
                },
                vacations: [],
            };
            const rawProfile = safeParse(PROFILE_STORAGE_KEY, null);
            setProfile(rawProfile ? { ...defaultProfile, ...rawProfile } : defaultProfile);
            
            const rawVoucherSales = safeParse(VOUCHER_SALES_STORAGE_KEY, []);
            setVoucherSales(Array.isArray(rawVoucherSales) ? rawVoucherSales.map((s:any) => ({...s, date: new Date(s.date)})) : []);

            const rawExpenses = safeParse(EXPENSES_STORAGE_KEY, []);
            setExpenses(Array.isArray(rawExpenses) ? rawExpenses.map((e:any) => ({...e, date: new Date(e.date)})) : []);

        } catch (error) {
            console.error("Error loading local fallback data:", error);
        }
    }, [isPublic]);

    // 2. Cloud Firestore Realtime Sync
    React.useEffect(() => {
        if (isPublic) {
            setIsLoading(false);
            // Blindaje de privacidad: purgar cualquier clave sensible del localStorage del visitante
            if (typeof window !== 'undefined') {
                [APPOINTMENTS_STORAGE_KEY, CLIENTS_STORAGE_KEY, VOUCHER_SALES_STORAGE_KEY, EXPENSES_STORAGE_KEY].forEach(k => {
                    localStorage.removeItem(k);
                });
            }
            return;
        }

        loadLocalFallback();

        const syncDocRef = doc(db, 'gabinete_data', 'main');

        const unsubscribe = onSnapshot(syncDocRef, (docSnap) => {
            if (docSnap.exists()) {
                isIncomingFromCloudRef.current = true;
                const cloud = docSnap.data();

                // Hydrate from cloud if present
                if (cloud.appointments && Array.isArray(cloud.appointments) && cloud.appointments.length > 0) {
                    setAppointments(
                        cloud.appointments
                            .map((apt: any) => ({
                                ...apt,
                                dateTime: new Date(apt.dateTime),
                            }))
                            .filter((apt: any) => apt.dateTime && !isNaN(new Date(apt.dateTime).getTime()))
                    );
                }

                if (cloud.clients && Array.isArray(cloud.clients) && cloud.clients.length > 0) {
                    setClients(cloud.clients);
                }

                if (cloud.services && Array.isArray(cloud.services) && cloud.services.length > 0) {
                    setServices(cloud.services);
                }

                if (cloud.blockedDays && Array.isArray(cloud.blockedDays)) {
                    setBlockedDays(cloud.blockedDays);
                }

                if (cloud.profile && cloud.profile.name) {
                    setProfile(cloud.profile);
                }

                if (cloud.voucherSales && Array.isArray(cloud.voucherSales)) {
                    setVoucherSales(cloud.voucherSales.map((s: any) => ({ ...s, date: new Date(s.date) })));
                }

                if (cloud.expenses && Array.isArray(cloud.expenses)) {
                    setExpenses(cloud.expenses.map((e: any) => ({ ...e, date: new Date(e.date) })));
                }
            }
            isCloudLoadedRef.current = true;
            setIsLoading(false);
        }, (err) => {
            console.warn("Firestore snapshot listener notice (offline mode):", err);
            setIsLoading(false);
            isCloudLoadedRef.current = true;
        });

        return () => unsubscribe();
    }, [loadLocalFallback, isPublic]);

    // 3. Auto-Save to Local Storage AND Cloud Firestore
    React.useEffect(() => {
        if (isPublic) return;
        if (!isLoading) {
            localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
            localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
            localStorage.setItem(BLOCKED_DAYS_STORAGE_KEY, JSON.stringify(blockedDays));
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
            localStorage.setItem(VOUCHER_SALES_STORAGE_KEY, JSON.stringify(voucherSales));
            localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
            window.dispatchEvent(new Event('storage'));

            // Evitar bucle infinito de auto-guardado si el cambio proviene de una actualización entrante de Firestore
            if (isIncomingFromCloudRef.current) {
                isIncomingFromCloudRef.current = false;
                return;
            }

            // Sync to Firestore only if we have real data to avoid saving blank states
            if (isCloudLoadedRef.current && (appointments.length > 0 || clients.length > 0)) {
                const timer = setTimeout(async () => {
                    try {
                        const syncDocRef = doc(db, 'gabinete_data', 'main');
                        const snap = await getDoc(syncDocRef);
                        const cloudData = snap.exists() ? snap.data() : {};
                        const cloudClients: any[] = cloudData.clients || [];
                        const cloudAppointments: any[] = cloudData.appointments || [];

                        // 1. Fusionar citas sin perder citas creadas en tiempo real vía web
                        const apptUnion = new Map<string, any>();
                        cloudAppointments.forEach((a: any) => {
                            if (a && a.id) apptUnion.set(a.id, a);
                        });
                        appointments.forEach((a: any) => {
                            if (a && a.id) {
                                apptUnion.set(a.id, { ...a, dateTime: new Date(a.dateTime).toISOString() });
                            }
                        });
                        const safeAppointments = Array.from(apptUnion.values());

                        // 2. Fusionar clientes sin sobrescribir clientes creados vía web
                        // Los PINs se gestionan exclusivamente en gabinete_data/client_pins y nunca en main
                        const clientUnion = new Map<string, any>();
                        cloudClients.forEach((c: any) => {
                            if (c && c.id) {
                                const { pinHash, ...clean } = c;
                                clientUnion.set(c.id, clean);
                            }
                        });
                        clients.forEach((c: any) => {
                            if (c && c.id) {
                                const { pinHash, ...clean } = c;
                                clientUnion.set(c.id, clean);
                            }
                        });
                        const safeClientsList = Array.from(clientUnion.values());

                        await setDoc(syncDocRef, {
                            appointments: safeAppointments,
                            clients: safeClientsList,
                            services,
                            blockedDays,
                            profile,
                            voucherSales: voucherSales.map(v => ({ ...v, date: new Date(v.date).toISOString() })),
                            expenses: expenses.map(e => ({ ...e, date: new Date(e.date).toISOString() })),
                            updatedAt: new Date().toISOString()
                        }, { merge: true });
                    } catch (cloudErr) {
                        console.warn("Failed syncing update to Firestore:", cloudErr);
                    }
                }, 1000);

                return () => clearTimeout(timer);
            }
        }
    }, [appointments, clients, services, blockedDays, profile, voucherSales, expenses, isLoading]);

    // 4. (Cal.com auto-sync removido - QuiroAgenda ahora gestiona reservas directamente)

    const refreshData = React.useCallback(async () => {
        try {
            const syncDocRef = doc(db, 'gabinete_data', 'main');
            const docSnap = await getDoc(syncDocRef);
            if (docSnap.exists()) {
                const cloud = docSnap.data();
                if (cloud.appointments && Array.isArray(cloud.appointments)) {
                    setAppointments(
                        cloud.appointments
                            .map((apt: any) => ({
                                ...apt,
                                dateTime: new Date(apt.dateTime),
                            }))
                            .filter((apt: any) => apt.dateTime && !isNaN(new Date(apt.dateTime).getTime()))
                    );
                }
                if (cloud.clients && Array.isArray(cloud.clients)) setClients(cloud.clients);
                if (cloud.services && Array.isArray(cloud.services)) setServices(cloud.services);
                if (cloud.blockedDays && Array.isArray(cloud.blockedDays)) setBlockedDays(cloud.blockedDays);
                if (cloud.profile && cloud.profile.name) setProfile(cloud.profile);
                if (cloud.voucherSales && Array.isArray(cloud.voucherSales)) setVoucherSales(cloud.voucherSales.map((s: any) => ({ ...s, date: new Date(s.date) })));
                if (cloud.expenses && Array.isArray(cloud.expenses)) setExpenses(cloud.expenses.map((e: any) => ({ ...e, date: new Date(e.date) })));
            }
        } catch (e) {
            console.warn("Error refreshing from Firestore:", e);
        }
    }, []);

    const addAppointment = async (newApt: Appointment) => {
        setAppointments(prev => [...prev.filter(a => a.id !== newApt.id), newApt]);
        try {
            const syncDocRef = doc(db, 'gabinete_data', 'main');
            const snap = await getDoc(syncDocRef);
            if (snap.exists()) {
                const cloud = snap.data();
                const existing = cloud.appointments || [];
                const serialized = {
                    ...newApt,
                    dateTime: new Date(newApt.dateTime).toISOString()
                };
                const updatedList = [...existing.filter((a: any) => a.id !== newApt.id), serialized];
                await setDoc(syncDocRef, {
                    ...cloud,
                    appointments: updatedList,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }
        } catch (err) {
            console.error("Error direct saving appointment:", err);
            throw err;
        }
    };

    const updateAppointment = async (id: string, aptData: Partial<Appointment>) => {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...aptData } : a));
        try {
            const syncDocRef = doc(db, 'gabinete_data', 'main');
            const snap = await getDoc(syncDocRef);
            if (snap.exists()) {
                const cloud = snap.data();
                const existing = cloud.appointments || [];
                const updatedList = existing.map((a: any) => {
                    if (a.id === id) {
                        return {
                            ...a,
                            ...aptData,
                            dateTime: aptData.dateTime ? new Date(aptData.dateTime).toISOString() : a.dateTime
                        };
                    }
                    return a;
                });
                await setDoc(syncDocRef, {
                    ...cloud,
                    appointments: updatedList,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }
        } catch (err) {
            console.error("Error direct updating appointment:", err);
            throw err;
        }
    };

    const deleteAppointment = async (id: string) => {
        setAppointments(prev => prev.filter(a => a.id !== id));
        try {
            const syncDocRef = doc(db, 'gabinete_data', 'main');
            const snap = await getDoc(syncDocRef);
            if (snap.exists()) {
                const cloud = snap.data();
                const existing = cloud.appointments || [];
                const updatedList = existing.filter((a: any) => a.id !== id);
                await setDoc(syncDocRef, {
                    ...cloud,
                    appointments: updatedList,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }
        } catch (err) {
            console.error("Error direct deleting appointment:", err);
            throw err;
        }
    };

    const setCloudBlockedDays = async (newBlockedDays: string[]) => {
        setBlockedDays(newBlockedDays);
        if (typeof window !== 'undefined') {
            localStorage.setItem(BLOCKED_DAYS_STORAGE_KEY, JSON.stringify(newBlockedDays));
        }
        try {
            const syncDocRef = doc(db, 'gabinete_data', 'main');
            await setDoc(syncDocRef, {
                blockedDays: newBlockedDays,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (err) {
            console.error("Error direct saving blocked days:", err);
            throw err;
        }
    };

    const updateProfile = async (newProfile: BusinessProfile) => {
        setProfile(newProfile);
        if (typeof window !== 'undefined') {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
        }
        try {
            const syncDocRef = doc(db, 'gabinete_data', 'main');
            await setDoc(syncDocRef, {
                profile: newProfile,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (err) {
            console.error("Error direct saving profile:", err);
            throw err;
        }
    };

    // Auto-refresh when tab gains focus or visibility changes
    React.useEffect(() => {
        const handleVisibilityOrFocus = () => {
            if (document.visibilityState === 'visible') {
                refreshData();
            }
        };

        window.addEventListener('focus', handleVisibilityOrFocus);
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);

        return () => {
            window.removeEventListener('focus', handleVisibilityOrFocus);
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        };
    }, [refreshData]);
    
    const exportData = () => {
        const dataToExport: { [key: string]: any } = {};
        STORAGE_KEYS.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) dataToExport[key] = JSON.parse(data);
        });
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `quiroagenda_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
        link.click();
    };

    const importData = async (jsonString: string) => {
        const data = JSON.parse(jsonString);
        STORAGE_KEYS.forEach(key => {
            if (data[key]) localStorage.setItem(key, JSON.stringify(data[key]));
        });
        loadLocalFallback();
        
        // Push imported data directly to Firestore AND wait for completion
        try {
            const syncDocRef = doc(db, 'gabinete_data', 'main');
            await setDoc(syncDocRef, {
                appointments: data[APPOINTMENTS_STORAGE_KEY] || [],
                clients: data[CLIENTS_STORAGE_KEY] || [],
                services: data[SERVICES_STORAGE_KEY] || getInitialServices(),
                blockedDays: data[BLOCKED_DAYS_STORAGE_KEY] || [],
                profile: data[PROFILE_STORAGE_KEY] || null,
                voucherSales: data[VOUCHER_SALES_STORAGE_KEY] || [],
                expenses: data[EXPENSES_STORAGE_KEY] || [],
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (importCloudErr) {
            console.error("Could not push import to Firestore:", importCloudErr);
            throw importCloudErr;
        }
    };

    return (
        <AppDataContext.Provider value={{
            appointments, setAppointments,
            clients, setClients,
            services, setServices,
            blockedDays, setBlockedDays,
            profile, setProfile,
            voucherSales, setVoucherSales,
            expenses, setExpenses,
            isLoading,
            loadData: loadLocalFallback,
            refreshData,
            addAppointment,
            updateAppointment,
            deleteAppointment,
            setCloudBlockedDays,
            updateProfile,
            exportData,
            importData,
        }}>
            {children}
        </AppDataContext.Provider>
    );
}

export function useAppData() {
    const context = React.useContext(AppDataContext);
    if (context === undefined) {
        throw new Error('useAppData must be used within an AppDataProvider');
    }
    return context;
}
