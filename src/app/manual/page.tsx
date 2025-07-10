
'use client';

import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Leaf, CalendarDays, Users, Calculator, Gift, Send, UserX, UserCog, Bot, BookOpen, Euro, Lock, Smartphone, ShoppingCart } from 'lucide-react';

export default function ManualPage() {
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
                  <AccordionTrigger>Finalizar una Cita (Cobro y Ausencias)</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>En las citas pasadas, verás un icono de Euro (€). Al pulsarlo, se abre un diálogo para finalizar la cita:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Registrar Pago:</strong> Anota el importe y el método de pago (Efectivo, Bizum, PayPal o Bono).</li>
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
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Users /> Fichero de Clientes y Bonos</CardTitle>
              <CardDescription>Conoce a tus clientes y fidelízalos con bonos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Gestión de Bonos por Cliente</AccordionTrigger>
                  <AccordionContent>
                    Desde la ficha de un cliente, puedes asignarle o modificar un bono, especificando el número de sesiones y su precio. Cuando un cliente pague con bono, se descontará una sesión automáticamente.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-2">
                  <AccordionTrigger>Notificación de Sesiones Restantes</AccordionTrigger>
                  <AccordionContent>
                    Tras pagar una cita con bono, la aplicación generará un mensaje de WhatsApp listo para enviar, informando al cliente de las sesiones que le quedan. ¡Un detalle que marca la diferencia!
                  </AccordionContent>
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
                    Reduce las ausencias enviando recordatorios por WhatsApp. Ahora puedes seleccionar cualquier cita futura pendiente de la lista y generar sus recordatorios, sin estar limitado a las del día siguiente.
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
              <p>Selecciona un rango de fechas y obtén un resumen financiero completo. Visualiza ingresos totales, un gráfico de tarta con el desglose por método de pago (Efectivo, Bizum, PayPal) y el número de bonos usados.</p>
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
        </div>
      </main>
    </div>
  );
}
