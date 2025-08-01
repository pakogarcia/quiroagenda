
'use client';

import * as React from 'react';
import { getInitialAppointments } from '@/lib/data';
import type { Appointment, Client, Service, BusinessProfile, VoucherSale } from '@/lib/types';
import { format } from 'date-fns';

const APPOINTMENTS_STORAGE_KEY = 'quiroagenda_appointments';
const CLIENTS_STORAGE_KEY = 'quiroagenda_clients';
const SERVICES_STORAGE_KEY = 'quiroagenda_services';
const BLOCKED_DAYS_STORAGE_KEY = 'quiroagenda_blocked_days';
const PROFILE_STORAGE_KEY = 'quiroagenda_profile';
const VOUCHER_SALES_STORAGE_KEY = 'quiroagenda_voucher_sales';
const STORAGE_KEYS = [
    APPOINTMENTS_STORAGE_KEY,
    CLIENTS_STORAGE_KEY,
    SERVICES_STORAGE_KEY,
    BLOCKED_DAYS_STORAGE_KEY,
    PROFILE_STORAGE_KEY,
    VOUCHER_SALES_STORAGE_KEY
];

const getInitialServices = (): Service[] => {
    return [
        { id: '1', name: 'Masaje Relajante', duration: 60, price: 50 },
        { id: '2', name: 'Drenaje Linfático', duration: 50, price: 45 },
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
    isLoading: boolean;
    loadData: () => void;
    exportData: () => void;
    importData: (jsonString: string) => void;
};

const AppDataContext = React.createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
    const [appointments, setAppointments] = React.useState<Appointment[]>([]);
    const [clients, setClients] = React.useState<Client[]>([]);
    const [services, setServices] = React.useState<Service[]>([]);
    const [blockedDays, setBlockedDays] = React.useState<string[]>([]);
    const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
    const [voucherSales, setVoucherSales] = React.useState<VoucherSale[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    
    const loadData = React.useCallback(() => {
        setIsLoading(true);
        try {
            // Appointments
            const storedAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
            const initialAppointments = storedAppointments
                ? JSON.parse(storedAppointments)
                    .map((apt: any) => ({
                        ...apt,
                        dateTime: new Date(apt.dateTime),
                        status: apt.status || 'scheduled',
                        payment: apt.payment || undefined,
                    }))
                    .filter((apt: Appointment) => apt.dateTime && !isNaN(apt.dateTime.getTime()))
                : getInitialAppointments(new Date());
            setAppointments(initialAppointments);

            // Clients
            const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
            if (storedClients) {
                const parsedClients = JSON.parse(storedClients);
                const migratedClients = parsedClients.map((client: any) => ({
                    ...client,
                    lastName: client.lastName || '',
                    voucher: client.voucher || undefined,
                }));
                setClients(migratedClients);
            }

            // Services
            const storedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
            const initialServices = storedServices ? JSON.parse(storedServices) : getInitialServices();
            setServices(initialServices);

            // Blocked Days
            const storedBlockedDays = localStorage.getItem(BLOCKED_DAYS_STORAGE_KEY);
            if (storedBlockedDays) {
                setBlockedDays(JSON.parse(storedBlockedDays));
            }

            // Profile
            const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (storedProfile) {
                setProfile(JSON.parse(storedProfile));
            }
            
            // Voucher Sales
            const storedVoucherSales = localStorage.getItem(VOUCHER_SALES_STORAGE_KEY);
            if (storedVoucherSales) {
                const parsedVoucherSales = JSON.parse(storedVoucherSales)
                    .map((sale: any) => ({
                        ...sale,
                        date: new Date(sale.date),
                    }));
                setVoucherSales(parsedVoucherSales);
            }

        } catch (error) {
            console.error("Failed to load data, using initial data.", error);
            setAppointments(getInitialAppointments(new Date()));
            setServices(getInitialServices());
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);
    
    // Save to localStorage whenever data changes
    React.useEffect(() => {
        if (!isLoading) localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
    }, [appointments, isLoading]);

    React.useEffect(() => {
        if (!isLoading) localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    }, [clients, isLoading]);

    React.useEffect(() => {
        if (!isLoading) localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
    }, [services, isLoading]);

    React.useEffect(() => {
        if (!isLoading) localStorage.setItem(BLOCKED_DAYS_STORAGE_KEY, JSON.stringify(blockedDays));
    }, [blockedDays, isLoading]);
    
    React.useEffect(() => {
        if (!isLoading) localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
         window.dispatchEvent(new Event('storage'));
    }, [profile, isLoading]);
    
    React.useEffect(() => {
        if (!isLoading) localStorage.setItem(VOUCHER_SALES_STORAGE_KEY, JSON.stringify(voucherSales));
    }, [voucherSales, isLoading]);
    
    const exportData = () => {
        const dataToExport: { [key: string]: any } = {};
        STORAGE_KEYS.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                dataToExport[key] = JSON.parse(data);
            }
        });

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = format(new Date(), 'yyyy-MM-dd');
        link.download = `quiroagenda_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const importData = (jsonString: string) => {
        const data = JSON.parse(jsonString);
        STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
        Object.keys(data).forEach(key => {
            if (STORAGE_KEYS.includes(key)) {
                localStorage.setItem(key, JSON.stringify(data[key]));
            }
        });
        loadData(); // Reload data into context state
    };


    const value = {
        appointments, setAppointments,
        clients, setClients,
        services, setServices,
        blockedDays, setBlockedDays,
        profile, setProfile,
        voucherSales, setVoucherSales,
        isLoading,
        loadData,
        exportData,
        importData,
    };

    return (
        <AppDataContext.Provider value={value}>
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
