import { AppDataProvider } from '@/context/app-data-context';

export default function AppPagesLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AppDataProvider>
            {children}
        </AppDataProvider>
    );
}
