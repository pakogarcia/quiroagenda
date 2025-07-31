
'use client';

import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Leaf, CalendarDays, Users, Calculator, Gift, Send, UserCog, Bot, Lock, Euro, History, FileText, AlertCircle, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export default function ManualPage() {
  const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="text-center mb-12">
          <Leaf className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
            Bienvenido a QuiroAgenda
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            La herramienta definitiva para gestionar tu centro de masajes y estética.
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><CalendarDays /> Gestión de Agenda Inteligente</CardTitle>
              <CardDescription>Tu tiempo es valioso. Organízalo sin esfuerzo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Visualización y Navegación</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Navega por un calendario visual e intuitivo. Los días con citas se marcan con colores para que veas de un vistazo tu ocupación futura: verde (1 cita), naranja (2 citas) y rojo (3 o más).</p>
                    <p>Los días que hayas bloqueado aparecerán en gris y no permitirán nuevas citas.</p>
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-2">
                  <AccordionTrigger>Finalizar una Cita (Cobro, Ausencias y Pagos Pendientes)</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>En las citas pasadas (o el mismo día), verás un icono de Euro (€). Al pulsarlo, se abre un diálogo para finalizar la cita con varias opciones:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Registrar Pago:</strong> Anota el importe y el método de pago (Efectivo, Bizum, PayPal o Bono).</li>
                      <li><strong>Completada (Pendiente de Pago):</strong> Marca la cita como realizada pero sin cobrar. El icono del Euro (€) seguirá visible para que puedas registrar el pago más adelante.</li>
                      <li><strong>Marcar como No Presentado:</strong> Si el cliente no acude, esta opción lo registrará y la cita no contará en tu contabilidad.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Bloqueo de Días</AccordionTrigger>
                  <AccordionContent>
                    ¿Necesitas un día libre? Selecciona un día en el calendario y pulsa el botón con el icono de candado (<Lock className="inline h-4 w-4"/>). El día se marcará como no disponible y no podrás agendar citas en él. Vuelve a pulsarlo para desbloquearlo.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Confirmación por WhatsApp</AccordionTrigger>
                  <AccordionContent>
                    Al crear o modificar una cita, QuiroAgenda genera un mensaje de confirmación profesional para enviar por WhatsApp. Incluye todos los detalles: nombre del cliente, fecha, hora y la dirección de tu negocio.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Users /> Fichero de Clientes Avanzado</CardTitle>
              <CardDescription>Toda la información de tus clientes, centralizada y accesible.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger><History className="w-4 h-4 mr-2" /> Historial Detallado por Cliente</AccordionTrigger>
                  <AccordionContent>
                    <p>Haz clic en la tarjeta de cualquier cliente para acceder a su ficha completa. Aquí encontrarás:</p>
                     <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Datos y Detalles:</strong> Su información de contacto y cualquier nota importante (alergias, preferencias, etc.).</li>
                      <li><strong>Resumen Financiero:</strong> Tarjetas con el total facturado, citas completadas y ausencias.</li>
                      <li><strong>Historial Completo de Citas:</strong> Una tabla con todas sus citas (pasadas y futuras), su estado y los detalles de pago de cada una.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-2">
                    <AccordionTrigger><AlertCircle className="w-4 h-4 mr-2 text-yellow-600" /> Gestión de Pagos Pendientes</AccordionTrigger>
                    <AccordionContent>
                        <p>Las tarjetas de los clientes con citas pendientes de pago aparecen con un borde amarillo para una rápida identificación. En su historial, puedes hacer clic directamente en el estado "Pendiente de Pago" para registrar el cobro sin tener que volver a la agenda principal.</p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger><FileText className="w-4 h-4 mr-2" /> Campo de Detalles del Cliente</AccordionTrigger>
                  <AccordionContent>
                    Al crear o editar un cliente, ahora dispones de un campo de "Detalles" para anotar información crucial como alergias, condiciones médicas, preferencias o cualquier otra nota relevante para ofrecer un servicio seguro y personalizado.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Gestión de Bonos por Cliente</AccordionTrigger>
                  <AccordionContent>
                    Desde la ficha de un cliente, puedes asignarle o modificar un bono. Cuando un cliente pague con bono, se descontará una sesión automáticamente. Tras usarlo, la aplicación generará un mensaje de WhatsApp para informarle de las sesiones restantes.
                  </官Content>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Gift /> Marketing y Comunicación</CardTitle>
              <CardDescription>Fideliza a tus clientes y aumenta tus ingresos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger><Send className="w-4 h-4 mr-2" /> Recordatorios de Citas Flexibles</AccordionTrigger>
                  <AccordionContent>
                    Reduce las ausencias enviando recordatorios por WhatsApp. Puedes seleccionar cualquier cita futura pendiente de la lista y generar sus recordatorios.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger><Gift className="w-4 h-4 mr-2" /> Campañas de Ofertas</AccordionTrigger>
                  <AccordionContent>
                    Crea ofertas especiales para un período determinado. La IA redactará un mensaje persuasivo y personalizado para cada cliente, listo para enviar por WhatsApp.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Calculator /> Contabilidad Avanzada</CardTitle>
              <CardDescription>Toma el control de tus finanzas con informes claros.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Selecciona un rango de fechas y obtén un resumen financiero completo. Visualiza ingresos totales (en una tarjeta destacada), un gráfico de desglose por método de pago y tarjetas con el total de citas, bonos usados y pagos pendientes.</p>
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2"><ShoppingCart className="w-4 h-4"/> Venta de Bonos</h4>
                <p>Desde la página de Contabilidad, puedes registrar la venta de un nuevo bono a un cliente. Esta transacción se reflejará en los informes financieros y actualizará automáticamente la ficha del cliente.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-accent flex items-center gap-3"><UserCog /> Perfil de Negocio ("Quién Eres")</CardTitle>
                <CardDescription>Personaliza la aplicación para que hable por ti.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Introduce el nombre, la situación y el teléfono de tu negocio. Esta información se utilizará para personalizar automáticamente todos los mensajes de WhatsApp, añadiendo el nombre de tu negocio al final para reforzar tu marca en cada comunicación.</p>
            </CardContent>
          </Card>

          <div className="text-center pt-8">
            <Bot className="h-10 w-10 text-primary mx-auto mb-2" />
            <h3 className="text-xl font-headline text-primary">Potenciado por Inteligencia Artificial</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              QuiroAgenda utiliza IA para generar mensajes de WhatsApp naturales, profesionales y efectivos, ahorrándote tiempo y mejorando la comunicación con tus clientes.
            </p>
          </div>
          
          <footer className="text-center text-sm text-muted-foreground pt-8">
              <p>Última actualización por Pako García el {today}.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
