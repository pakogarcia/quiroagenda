
'use client';

import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Leaf, CalendarDays, Users, Calculator, Gift, Send, UserX, UserCog, Bot, BookOpen } from 'lucide-react';

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
                    <p>Consulta un resumen de tus próximas 7 citas directamente en la página principal para anticipar tu semana.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Creación y Edición de Citas</AccordionTrigger>
                  <AccordionContent>
                    Añade nuevas citas en segundos. Rellena los datos del cliente (o selecciónalo de tu lista), elige fecha y hora, y añade notas. ¿Un cambio de planes? Edita o elimina citas con un solo clic.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                  <AccordionTrigger>Confirmación Instantánea por WhatsApp</AccordionTrigger>
                  <AccordionContent>
                    Al crear o modificar una cita, QuiroAgenda genera al instante un mensaje de confirmación profesional para enviar por WhatsApp. Incluye todos los detalles: nombre del cliente, fecha, hora y la dirección de tu negocio. ¡Cero esfuerzo, máxima profesionalidad!
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Gestión de Ausencias (No Presentados)</AccordionTrigger>
                  <AccordionContent>
                    Marca a un cliente como "No Presentado" con un botón. Esto te permite enviar un mensaje de seguimiento por WhatsApp y asegura que la cita no se cuente en tu contabilidad, manteniendo tus informes limpios y precisos.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Users /> Fichero de Clientes Centralizado</CardTitle>
              <CardDescription>Conoce a tus clientes y construye relaciones duraderas.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Base de Datos Completa</AccordionTrigger>
                  <AccordionContent>
                    Guarda y gestiona la información de tus clientes: nombre, apellidos y teléfono. La aplicación evita números de teléfono duplicados para mantener tus datos organizados y sin errores.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Autocompletado Inteligente</AccordionTrigger>
                  <AccordionContent>
                    Al crear una nueva cita, simplemente selecciona un cliente existente y sus datos se rellenarán automáticamente. ¡Menos teclear, más agilidad!
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Gift /> Marketing y Comunicación Automatizada</CardTitle>
              <CardDescription>Fideliza a tus clientes y aumenta tus ingresos sin esfuerzo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger><Send className="w-4 h-4 mr-2" /> Recordatorios de Citas</AccordionTrigger>
                  <AccordionContent>
                    Reduce las ausencias enviando recordatorios por WhatsApp para las citas del día siguiente. QuiroAgenda detecta quiénes no han recibido recordatorio y genera mensajes personalizados, listos para enviar con un clic.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger><Gift className="w-4 h-4 mr-2" /> Campañas de Ofertas</AccordionTrigger>
                  <AccordionContent>
                    Crea ofertas especiales para un período de tiempo determinado. Nuestra IA redactará un mensaje persuasivo y personalizado para cada uno de tus clientes, listo para ser enviado por WhatsApp. ¡Una potente herramienta de marketing a tu alcance!
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Calculator /> Contabilidad Simplificada</CardTitle>
              <CardDescription>Toma el control de tus finanzas con informes claros.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Selecciona un rango de fechas (pasadas) y obtén un resumen instantáneo de las citas completadas. Visualiza un listado detallado para tener un control total sobre tu facturación. Usa los filtros rápidos para ver la última semana, el último mes o todo el año.</p>
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
