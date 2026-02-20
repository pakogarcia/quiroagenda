'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Leaf, CalendarDays, Users, Calculator, Gift, Send, UserCog, Euro, History, FileText, AlertCircle, ShoppingCart, BarChart, Eye, MessageSquare, Tag, Image as ImageIcon, Globe, ShieldCheck, Download, Upload, KeyRound, Clock, Cake, Bell, Edit2, CheckCircle, Trash2, Edit } from 'lucide-react';

export default function ManualPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="text-center mb-12">
          <Leaf className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
            Manual Maestro de QuiroAgenda
          </h1>
          <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
            Tu guía completa para dominar la gestión de tu gabinete de masajes y estética.
          </p>
        </header>

        <div className="max-w-5xl mx-auto space-y-8 pb-12">
          
          {/* SECCIÓN 1: IDENTIDAD Y HORARIOS */}
          <Card className="shadow-lg border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><UserCog className="w-6 h-6"/> Perfil y Configuración ("Quién Eres")</CardTitle>
              <CardDescription>Establece tu marca y tu disponibilidad laboral.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="horarios">
                  <AccordionTrigger><div className='flex items-center gap-2'><Clock className="w-4 h-4 text-primary" />Gestión Flexible de Turnos</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Configura tu jornada laboral con total precisión:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Interruptores de Turno:</strong> Activa o desactiva de forma independiente el turno de mañana y tarde. Si no trabajas una mañana, la agenda ocultará esas horas automáticamente.</li>
                      <li><strong>Horas de Inicio/Fin:</strong> Define exactamente cuándo empieza y termina cada bloque para que la rejilla de la agenda sea única para ti.</li>
                      <li><strong>Vacaciones:</strong> Añade rangos de fechas. Durante estos días, la agenda se bloqueará por completo para evitar citas accidentales.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="marca">
                  <AccordionTrigger><div className='flex items-center gap-2'><ImageIcon className="w-4 h-4 text-primary" />Identidad Visual y Redes Sociales</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Haz que tu negocio sea reconocible:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Logotipo:</strong> Sube tu logo en formato JPG. Aparecerá en la pantalla de carga y en la cabecera de la app.</li>
                      <li><strong>Conexión Social:</strong> Enlaza tu Web, Instagram, Facebook y TikTok. Estos enlaces se pueden incluir opcionalmente en los mensajes de confirmación de cita para tus clientes.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 2: LA AGENDA (DIETARIO) */}
          <Card className="shadow-lg border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><CalendarDays className="w-6 h-6"/> Agenda Inteligente (El Dietario)</CardTitle>
              <CardDescription>El corazón de tu día a día, diseñado para la eficiencia.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="rejilla">
                  <AccordionTrigger><div className='flex items-center gap-2'><Eye className="w-4 h-4 text-primary" />Rejilla Fija de 15 Minutos</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>La agenda funciona como un dietario físico profesional:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Espacio Físico Real:</strong> Cada hora tiene su lugar exacto. Las citas se posicionan y escalan según su duración real (por ejemplo, una cita de 60 min ocupa 4 bloques).</li>
                      <li><strong>Creación Rápida:</strong> Haz clic en cualquier hueco vacío para abrir el formulario de cita ya pre-configurado a esa hora.</li>
                      <li><strong>Control de Solapamientos:</strong> El sistema te avisará si intentas agendar una cita que choca con otra existente.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="colores">
                  <AccordionTrigger><div className='flex items-center gap-2'><BarChart className="w-4 h-4 text-primary" />Escala de Colores (Volumen de Citas)</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>El calendario mensual te indica tu carga de trabajo de un vistazo:</p>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-green-500"></span> <strong>Verde:</strong> 1-2 citas (Carga Baja)</div>
                      <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-orange-500"></span> <strong>Naranja:</strong> 3-4 citas (Carga Media)</div>
                      <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-red-500"></span> <strong>Rojo:</strong> 5-6 citas (Carga Alta)</div>
                      <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-red-900"></span> <strong>Granate:</strong> 7+ citas (Máxima Capacidad)</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="acciones">
                  <AccordionTrigger><div className='flex items-center gap-2'><CheckCircle className="w-4 h-4 text-primary" />Acciones Rápidas en Citas</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Gestiona cada sesión sin salir de la agenda principal mediante los botones de alto contraste:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong><Edit className="inline h-3 w-3 text-blue-600" /> Editar:</strong> Cambia fecha, hora o servicio en segundos.</li>
                      <li><strong><Trash2 className="inline h-3 w-3 text-red-600" /> Eliminar:</strong> Borra citas si hay cancelaciones.</li>
                      <li><strong><Euro className="inline h-3 w-3 text-amber-500" /> Registrar Pago:</strong> Finaliza la cita, marca el estado como pagado y envía el registro directamente a tu contabilidad.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 3: CLIENTES Y SERVICIOS */}
          <Card className="shadow-lg border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Users className="w-6 h-6"/> Fichero de Clientes y Servicios</CardTitle>
              <CardDescription>Control total sobre tu cartera y tu catálogo de precios.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="ficha">
                  <AccordionTrigger><div className='flex items-center gap-2'><History className="w-4 h-4 text-primary" />Ficha Detallada del Cliente</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Accede a la radiografía completa de cada cliente:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Historial:</strong> Todas las citas pasadas, cancelaciones y compras de bonos organizadas por meses.</li>
                      <li><strong>Estadísticas:</strong> Total invertido en tu negocio y cuáles son sus servicios favoritos.</li>
                      <li><strong>Notas y Detalles:</strong> Espacio para alergias, preferencias o patologías importantes.</li>
                      <li><strong>Cumpleaños:</strong> La app te avisa de quién cumple años para que puedas enviarle una felicitación.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="servicios">
                  <AccordionTrigger><div className='flex items-center gap-2'><Tag className="w-4 h-4 text-primary" />Catálogo de Servicios</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Define tus tratamientos:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Personalización:</strong> Crea servicios con nombre, duración exacta (para la agenda) y precio base.</li>
                      <li><strong>Flexibilidad:</strong> Al agendar una cita, puedes elegir cualquier servicio y el sistema ajustará automáticamente el hueco necesario en el dietario.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 4: CONTABILIDAD Y BONOS */}
          <Card className="shadow-lg border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Calculator className="w-6 h-6"/> Contabilidad y Gestión de Bonos</CardTitle>
              <CardDescription>Tus finanzas y herramientas de fidelización bajo control.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="contabilidad">
                  <AccordionTrigger><div className='flex items-center gap-2'><BarChart className="w-4 h-4 text-primary" />Resumen Financiero e Impresión</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Analiza la salud de tu negocio:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Filtros por Fecha:</strong> Visualiza ingresos de hoy, de la semana, del mes o de cualquier período personalizado.</li>
                      <li><strong>Gráficos Visuales:</strong> Mira qué servicios te generan más beneficio y qué métodos de pago (Efectivo, Bizum, PayPal) usan más tus clientes.</li>
                      <li><strong>Impresión:</strong> Genera un reporte limpio para tu gestoría o para tu control personal con un solo clic.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="bonos">
                  <AccordionTrigger><div className='flex items-center gap-2'><Gift className="w-4 h-4 text-primary" />Gestión Inteligente de Bonos</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Fideliza con bonos de sesiones:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Venta de Bonos:</strong> Registra la venta de un bono desde la ficha del cliente o contabilidad.</li>
                      <li><strong>Consumo Automático:</strong> Al pagar una cita con el método "Bono", el sistema descuenta automáticamente una sesión y te avisa de cuántas le quedan al cliente.</li>
                      <li><strong>Notificaciones:</strong> Envía un mensaje de WhatsApp informando al cliente de sus sesiones restantes tras su visita.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 5: COMUNICACIONES Y SEGURIDAD */}
          <Card className="shadow-lg border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Send className="w-6 h-6"/> Comunicaciones y Seguridad de Datos</CardTitle>
              <CardDescription>Plantillas de WhatsApp y protección de tu información.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="comunicaciones">
                  <AccordionTrigger><div className='flex items-center gap-2'><MessageSquare className="w-4 h-4 text-primary" />Centro de Comunicaciones WhatsApp</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Ahorra horas de redacción con plantillas profesionales:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Recordatorios:</strong> Envía recordatorios masivos de las citas de mañana. La app detecta quién no lo ha recibido aún.</li>
                      <li><strong>Citas y Bienvenida:</strong> Confirmaciones automáticas al agendar y mensajes de bienvenida para nuevos contactos.</li>
                      <li><strong>Recuperación:</strong> Mensajes para clientes inactivos, felicitaciones de cumpleaños y notificaciones de pagos pendientes.</li>
                      <li><strong>Control Total:</strong> Todos los mensajes se pueden editar antes de enviarlos por WhatsApp.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="seguridad">
                  <AccordionTrigger><div className='flex items-center gap-2'><ShieldCheck className="w-4 h-4 text-primary" />Seguridad y Copias</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Tus datos son tuyos y están protegidos:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Contraseña Local:</strong> Tu app está protegida por una contraseña que tú eliges. Nadie más puede entrar desde ese navegador.</li>
                      <li><strong>Backups:</strong> Exporta toda tu base de datos a un archivo JSON en cualquier momento. Puedes restaurar tus datos en otro dispositivo importando ese archivo.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <footer className="text-center text-sm text-muted-foreground pt-12 border-t mt-12">
            <p>QuiroAgenda - La herramienta definitiva para profesionales del bienestar.</p>
            <p className="mt-1 font-semibold">Versión 2.5 "Dietario Pro"</p>
          </footer>
        </div>
      </main>
    </div>
  );
}