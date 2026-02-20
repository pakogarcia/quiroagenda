
'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Leaf, CalendarDays, Users, Calculator, Gift, Send, UserCog, Bot, Lock, Euro, History, FileText, AlertCircle, ShoppingCart, BarChart, Eye, MessageSquare, Tag, Image as ImageIcon, Link as LinkIcon, Instagram, Facebook, Youtube, ShieldCheck, Database, KeyRound, Edit, UserX, CalendarOff, Megaphone, Clock, Cake, Bell, Edit2, CheckCircle } from 'lucide-react';


export default function ManualPage() {

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="text-center mb-12">
          <Leaf className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
            Manual de QuiroAgenda
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Todo lo que necesitas saber para dominar tu nueva herramienta de gestión.
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-accent flex items-center gap-3"><UserCog /> Perfil y Horarios ("Quién Eres")</CardTitle>
                    <CardDescription>Configura tu identidad y tu disponibilidad laboral.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger><div className='flex items-center gap-2'><Clock className="w-4 h-4" />Gestión de Turnos (Novedad)</div></AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <p>Ahora puedes definir tu jornada con total flexibilidad:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Interruptores de Turno:</strong> Activa o desactiva de forma independiente el turno de mañana y el de tarde.</li>
                                    <li><strong>Optimización de Agenda:</strong> Si desactivas un turno, la agenda no mostrará esas horas, dejando el dietario limpio y enfocado solo en cuando trabajas.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-2">
                            <AccordionTrigger><div className='flex items-center gap-2'><ImageIcon className="w-4 h-4" />Logotipo y Redes Sociales</div></AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <p><strong>Identidad Visual:</strong> Sube tu logo en JPG para que aparezca en la cabecera y en la pantalla de carga.</p>
                                <p><strong>Conexión Social:</strong> Enlaza tus perfiles. Estos enlaces se pueden incluir automáticamente en los mensajes de confirmación de WhatsApp que envíes a tus clientes.</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><CalendarDays /> Agenda Inteligente (Dietario)</CardTitle>
              <CardDescription>Una vista profesional y organizada de tu día a día.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger><div className='flex items-center gap-2'><Eye className="w-4 h-4" />Nueva Rejilla de Tiempo Fija</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Hemos rediseñado la agenda para que sea un dietario real:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Intervalos de 15 min:</strong> Una rejilla estable donde cada hora tiene su lugar físico exacto.</li>
                        <li><strong>Posicionamiento Real:</strong> Las citas se colocan y dimensionan según su hora de inicio y duración, evitando confusiones visuales.</li>
                        <li><strong>Creación Rápida:</strong> Haz clic en cualquier hueco vacío para abrir el formulario de cita ya pre-configurado a esa hora.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger><div className='flex items-center gap-2'><BarChart className="w-4 h-4" />Escala de Colores (Volumen de Citas)</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>El calendario te indica tu carga de trabajo diaria mediante colores:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span><strong>Verde:</strong> Carga baja (1-2 citas).</li>
                      <li><span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-2"></span><strong>Naranja:</strong> Carga media (3-4 citas).</li>
                      <li><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span><strong>Rojo:</strong> Carga alta (5-6 citas).</li>
                      <li><span className="inline-block w-3 h-3 rounded-full bg-red-900 mr-2"></span><strong>Granate:</strong> Máxima capacidad (7 o más citas).</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                  <AccordionTrigger><div className='flex items-center gap-2'><Edit className="w-4 h-4 text-blue-600" />Acciones Rápidas en Citas</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Cada tarjeta de cita en la agenda incluye botones de alto contraste para gestionar tu trabajo al instante:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong><Edit className="inline h-3 w-3 text-blue-600" /> Editar:</strong> Cambia datos de la cita.</li>
                      <li><strong><AlertCircle className="inline h-3 w-3 text-red-600" /> Eliminar:</strong> Borra la cita permanentemente.</li>
                      <li><strong><Euro className="inline h-3 w-3 text-amber-500" /> Registrar Pago:</strong> Finaliza la cita, marca el estado como pagado y registra el ingreso en contabilidad.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Users /> Fichero de Clientes</CardTitle>
              <CardDescription>Gestión centralizada de tu cartera de clientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger><div className='flex items-center gap-2'><History className="w-4 h-4" /> Historial y Estadísticas</div></AccordionTrigger>
                  <AccordionContent>
                    <p>Al entrar en la ficha de un cliente verás su histórico completo de visitas, cuánto ha invertido en tu negocio y qué servicios prefiere. También podrás editar pagos de citas pasadas si hubo algún error.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger><div className='flex items-center gap-2'><Gift className="w-4 h-4"/> Gestión de Bonos</div></AccordionTrigger>
                  <AccordionContent>
                    Puedes vender bonos de sesiones desde la ficha del cliente o desde Contabilidad. El sistema descuenta automáticamente una sesión cuando el cliente paga una cita con el método "Bono".
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Send /> Comunicaciones WhatsApp</CardTitle>
              <CardDescription>Plantillas profesionales para fidelizar a tus clientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                 <AccordionItem value="item-1">
                  <AccordionTrigger><div className='flex items-center gap-2'><Bell className="w-4 h-4" /> Recordatorios Automáticos</div></AccordionTrigger>
                  <AccordionContent>
                   Accede al Centro de Comunicaciones para enviar recordatorios de las citas de mañana. La app detecta quién no tiene el recordatorio enviado y prepara el mensaje por ti.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger><div className='flex items-center gap-2 text-primary'><Edit2 className="w-4 h-4" /> Mensajes Editables</div></AccordionTrigger>
                  <AccordionContent>
                   Todas las plantillas (cumpleaños, ofertas, recordatorios) permiten editar el texto final antes de abrir WhatsApp, dándote total control sobre lo que comunicas.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <footer className="text-center text-sm text-muted-foreground pt-8">
              <p>Manual actualizado a la última versión de QuiroAgenda.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
