
'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, User, Phone, Users } from 'lucide-react';
import type { Client } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ClientForm } from '@/components/client-form';
import { motion, AnimatePresence } from 'framer-motion';
import { SplashScreen } from '@/components/layout/splash-screen';

const CLIENTS_STORAGE_KEY = 'quiroagenda_clients';

export default function ClientsPage() {
    const [clients, setClients] = React.useState<Client[]>([]);
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        try {
            const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
            if (storedClients) {
                const parsedClients = JSON.parse(storedClients);
                const migratedClients = parsedClients.map((client: any) => ({
                    ...client,
                    lastName: client.lastName || '',
                }));
                setClients(migratedClients);
            }
        } catch (error) {
            console.error("Failed to load clients.", error);
        }
        setIsClient(true);
    }, []);

    React.useEffect(() => {
        if (isClient) {
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
        }
    }, [clients, isClient]);

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingClient, setEditingClient] = React.useState<Client | undefined>(undefined);
    
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
    const [deletingClientId, setDeletingClientId] = React.useState<string | null>(null);

    const handleAddClient = (data: Omit<Client, 'id'>) => {
        const newClient: Client = { ...data, id: crypto.randomUUID() };
        setClients(prev => [...prev, newClient].sort((a, b) => {
            const nameComp = a.name.localeCompare(b.name);
            if (nameComp !== 0) return nameComp;
            return (a.lastName || '').localeCompare(b.lastName || '');
        }));
        setIsFormOpen(false);
    };

    const handleUpdateClient = (id: string, data: Omit<Client, 'id'>) => {
        setClients(prev => prev.map((client) => (client.id === id ? { ...client, ...data } : client)).sort((a, b) => {
            const nameComp = a.name.localeCompare(b.name);
            if (nameComp !== 0) return nameComp;
            return (a.lastName || '').localeCompare(b.lastName || '');
        }));
        setIsFormOpen(false);
        setEditingClient(undefined);
    };

    const handleDeleteClient = () => {
        if (!deletingClientId) return;
        setClients(clients.filter((client) => client.id !== deletingClientId));
        setIsDeleteConfirmOpen(false);
        setDeletingClientId(null);
    };

    const openEditForm = (client: Client) => {
        setEditingClient(client);
        setIsFormOpen(true);
    };

    const openDeleteConfirm = (id: string) => {
        setDeletingClientId(id);
        setIsDeleteConfirmOpen(true);
    };

    if (!isClient) {
        return <SplashScreen />;
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground font-body">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold font-headline text-primary">Clientes</h1>
                    <Button onClick={() => { setEditingClient(undefined); setIsFormOpen(true); }}>
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Añadir Cliente</span>
                    </Button>
                </div>
                
                {clients.length > 0 ? (
                    <motion.div layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      <AnimatePresence>
                        {clients.map(client => (
                            <motion.div
                              key={client.id}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="origin-top"
                            >
                              <Card className="shadow-md hover:shadow-xl transition-shadow duration-300 group h-full">
                                  <CardHeader>
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <CardTitle className="text-xl text-accent flex items-center gap-2"><User className="w-5 h-5"/>{`${client.name} ${client.lastName}`}</CardTitle>
                                              <CardDescription className="flex items-center gap-2 pt-2">
                                                  <Phone className="w-4 h-4"/>
                                                  {client.phone}
                                              </CardDescription>
                                          </div>
                                          <div className="flex items-center gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                                              <Button variant="ghost" size="icon" onClick={() => openEditForm(client)}>
                                                  <Edit className="w-5 h-5" />
                                              </Button>
                                              <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(client.id)}>
                                                  <Trash2 className="w-5 h-5 text-destructive" />
                                              </Button>
                                          </div>
                                      </div>
                                  </CardHeader>
                              </Card>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg mt-8">
                        <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-xl font-semibold text-muted-foreground">No hay clientes guardados.</h3>
                        <p className="text-muted-foreground mt-1">Añade tu primer cliente para empezar.</p>
                    </div>
                )}
            </main>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingClient ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</DialogTitle>
                    </DialogHeader>
                    <ClientForm 
                        onSubmit={editingClient ? (data) => handleUpdateClient(editingClient.id, data) : handleAddClient}
                        client={editingClient}
                        allClients={clients}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente de tu lista. Las citas existentes no se verán afectadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
