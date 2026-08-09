'use client';

import * as React from 'react';
import { getInitialAppointments } from '@/lib/data';
import type { Appointment, Client, Service, BusinessProfile, VoucherSale, Expense } from '@/lib/types';
import { format } from 'date-fns';

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
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
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
    const [expenses, setExpenses] = React.useState<Expense[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    
    const loadData = React.useCallback(() => {
        setIsLoading(true);
        try {
            if (typeof window === 'undefined') return;

            // Helper for safe JSON parsing
            const safeParse = (key: string, fallback: any) => {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : fallback;
                } catch (e) {
                    console.warn(`Failed to parse localStorage key ${key}:`, e);
                    return fallback;
                }
            };

            // Appointments
            const rawAppointments = safeParse(APPOINTMENTS_STORAGE_KEY, null);
            const initialAppointments = rawAppointments && Array.isArray(rawAppointments)
                ? rawAppointments
                    .map((apt: any) => ({
                        ...apt,
                        dateTime: new Date(apt.dateTime),
                        status: apt.status || 'scheduled',
                        payment: apt.payment || undefined,
                    }))
                    .filter((apt: Appointment) => apt.dateTime && !isNaN(new Date(apt.dateTime).getTime()))
                : getInitialAppointments(new Date());
            setAppointments(initialAppointments);

            // Clients
            const rawClients = safeParse(CLIENTS_STORAGE_KEY, []);
            setClients(Array.isArray(rawClients) ? rawClients : []);

            // Services
            const rawServices = safeParse(SERVICES_STORAGE_KEY, null);
            setServices(rawServices && Array.isArray(rawServices) ? rawServices : getInitialServices());

            // Blocked Days
            const rawBlockedDays = safeParse(BLOCKED_DAYS_STORAGE_KEY, []);
            setBlockedDays(Array.isArray(rawBlockedDays) ? rawBlockedDays : []);

            // Profile
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
            
            // Voucher Sales
            const rawVoucherSales = safeParse(VOUCHER_SALES_STORAGE_KEY, []);
            setVoucherSales(Array.isArray(rawVoucherSales) ? rawVoucherSales.map((s:any) => ({...s, date: new Date(s.date)})) : []);

            // Expenses
            const rawExpenses = safeParse(EXPENSES_STORAGE_KEY, []);
            setExpenses(Array.isArray(rawExpenses) ? rawExpenses.map((e:any) => ({...e, date: new Date(e.date)})) : []);

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);
    
    // Auto-save logic
    React.useEffect(() => {
        if (!isLoading) {
            localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
            localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
            localStorage.setItem(BLOCKED_DAYS_STORAGE_KEY, JSON.stringify(blockedDays));
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
            localStorage.setItem(VOUCHER_SALES_STORAGE_KEY, JSON.stringify(voucherSales));
            localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
            window.dispatchEvent(new Event('storage'));
        }
    }, [appointments, clients, services, blockedDays, profile, voucherSales, expenses, isLoading]);
    
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

    const importData = (jsonString: string) => {
        const data = JSON.parse(jsonString);
        STORAGE_KEYS.forEach(key => {
            if (data[key]) localStorage.setItem(key, JSON.stringify(data[key]));
        });
        loadData();
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
            loadData,
            exportData,
            importData,
        }}>
            {children}
        </AppDataContext.Provider>
    );
}

export function useAppData() {
    const context = React.useContext(AppDataContext);
    if (context === undefined) throw new Error('useAppData must be used within an AppDataProvider');
    return context;
}