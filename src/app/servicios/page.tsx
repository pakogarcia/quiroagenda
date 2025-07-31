
'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Clock, Euro, Edit, Trash2 } from 'lucide-react';
import type { Service } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ServiceForm } from '@/components/service-form';
import { motion, AnimatePresence } from 'framer-motion';
import { SplashScreen } from '@/components/layout/splash-screen';

const SERVICES_STORAGE_KEY = 'quiroagenda_services';

const getInitialServices = (): Service[] => {
    return [
        { id: '1', name: 'Masaje Relajante', duration: 60, price: 50 },
        { id: '2', name: 'Drenaje Linfático', duration: 50, price: 45 },
    ];
};

export default function ServicesPage() {
    const [services, setServices] = React.useState<Service[]>([]);
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        try {
            const storedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
            const initialServices = storedServices ? JSON.parse(storedServices) : getInitialServices();
            setServices(initialServices);
        } catch (error) {
            console.error("Failed to load services, using initial data.", error);
            setServices(getInitialServices());
        }
        setIsClient(true);
    }, []);

    React.useEffect(() => {
        if (isClient) {
            localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
        }
    }, [services, isClient]);

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingService, setEditingService] = React.useState<Service | undefined>(undefined);
    
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
    const [deletingServiceId, setDeletingServiceId] = React.useState<string | null>(null);

    const handleAddService = (data: Omit<Service, 'id'>) => {
        const newService: Service = { ...data, id: crypto.randomUUID() };
        setServices(prev => [...prev, newService].sort((a, b) => a.name.localeCompare(b.name)));
        setIsFormOpen(false);
    };

    const handleUpdateService = (id: string, data: Omit<Service, 'id'>) => {
        setServices(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)).sort((a, b) => a.name.localeCompare(b.name)));
        setIsFormOpen(false);
        setEditingService(undefined);
    };
    
    const handleDeleteService = () => {
        if (!deletingServiceId) return;
        setServices(services.filter((s) => s.id !== deletingServiceId));
        setIsDeleteConfirmOpen(false);
        setDeletingServiceId(null);
    };

    const openEditForm = (service: Service) => {
        setEditingService(service);
        setIsFormOpen(true);
    };

    const openDeleteConfirm = (id: string) => {
        setDeletingServiceId(id);
        setIsDeleteConfirmOpen(true);
    };

    if (!isClient) {
        return <SplashScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold font-headline text-primary">Servicios</h1>
                    <Button onClick={() => { setEditingService(undefined); setIsFormOpen(true); }}>
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Añadir Servicio</span>
                    </Button>
                </div>
                
                {services.length > 0 ? (
                    <motion.div layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <AnimatePresence>
                        {services.map(service => (
                            <motion.div
                              key={service.id}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="origin-top"
                            >
                              <Card className="shadow-md hover:shadow-xl transition-shadow duration-300 group h-full flex flex-col">
                                  <CardHeader>
                                      <div className="flex justify-between items-start">
                                          <CardTitle className="text-xl text-accent flex items-center gap-2">
                                              <Tag className="w-5 h-5"/>
                                              {service.name}
                                          </CardTitle>
                                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditForm(service); }}>
                                                  <Edit className="w-5 h-5" />
                                              </Button>
                                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDeleteConfirm(service.id); }}>
                                                  <Trash2 className="w-5 h-5 text-destructive" />
                                              </Button>
                                          </div>
                                      </div>
                                  </CardHeader>
                                  <CardContent className="flex-grow space-y-3">
                                    <div className="p-3 bg-muted/50 rounded-md flex justify-between items-center">
                                        <p className="font-semibold text-sm flex items-center gap-2 text-primary"><Clock className="w-4 h-4" /> Duración</p>
                                        <p className="text-muted-foreground font-bold">{service.duration} min.</p>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-md flex justify-between items-center">
                                        <p className="font-semibold text-sm flex items-center gap-2 text-primary"><Euro className="w-4 h-4" /> Precio</p>
                                        <p className="text-muted-foreground font-bold">{service.price.toFixed(2)}€</p>
                                    </div>
                                  </CardContent>
                              </Card>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg mt-8">
                        <Tag className="w-16 h-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-xl font-semibold text-muted-foreground">No hay servicios definidos.</h3>
                        <p className="text-muted-foreground mt-1">Añade tu primer servicio para empezar a asignarlos a las citas.</p>
                    </div>
                )}
            </main>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingService ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}</DialogTitle>
                    </DialogHeader>
                    <ServiceForm 
                        onSubmit={editingService ? (data) => handleUpdateService(editingService.id, data) : handleAddService}
                        service={editingService}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteService} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
