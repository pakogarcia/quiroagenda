'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Leaf, CalendarDays, Users, Calculator, Gift, Send, UserCog, Euro, History, FileText, AlertCircle, ShoppingCart, BarChart, Eye, MessageSquare, Tag, Image as ImageIcon, Globe, Clock, Cake, Bell, CheckCircle, Trash2, Edit, ShieldCheck, KeyRound, Receipt, TrendingDown, CalendarOff, Megaphone } from 'lucide-react';

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
            Tu guía completa para dominar la gestión integral de tu gabinete de masajes y bienestar.
          </p>
        </header>

        <div className="max-w-5xl mx-auto space-y-8 pb-20">
          
          {/* SECCIÓN 1: IDENTIDAD Y HORARIOS */}
          <Card className="shadow-lg border-l-4 border-l-primary overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><UserCog className="w-6 h-6"/> Perfil y Configuración</CardTitle>
              <CardDescription>Establece tu marca, tus datos del negocio y tu disponibilidad laboral.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="horarios">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><Clock className="w-4 h-4 text-primary" />Gestión Flexible de Turnos</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Configura tu jornada laboral para que la agenda solo muestre tus horas reales de trabajo:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Interruptores de Turno:</strong> Activa o desactiva de forma independiente el turno de mañana y tarde en "Quién Eres". Si una mañana no trabajas, la agenda ocultará ese bloque automáticamente.</li>
                      <li><strong>Personalización Horaria:</strong> Define las horas exactas de inicio y fin para cada turno. Tu rejilla de citas se ajustará a estos límites.</li>
                      <li><strong>Vacaciones:</strong> Añade rangos de fechas de descanso. Durante estos días, la agenda mostrará un mensaje de "Día no disponible" y bloqueará cualquier intento de cita.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="marca">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><ImageIcon className="w-4 h-4 text-primary" />Identidad Visual y Redes</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Haz que tu negocio sea reconocible y profesional:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Logotipo Personalizado:</strong> Sube tu logo en formato JPG/PNG. Se utilizará en la pantalla de carga y en la cabecera de la aplicación.</li>
                      <li><strong>Conexión Social:</strong> Enlaza tu Web, Instagram, Facebook y TikTok. Estos datos se incorporan automáticamente en las plantillas de comunicación enviadas a tus clientes.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 2: LA AGENDA (EL DIETARIO PRO) */}
          <Card className="shadow-lg border-l-4 border-l-accent overflow-hidden">
            <CardHeader className="bg-accent/5">
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><CalendarDays className="w-6 h-6"/> Agenda Profesional (El Dietario)</CardTitle>
              <CardDescription>El corazón de tu día a día, diseñado para la máxima eficiencia visual.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="rejilla">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><Eye className="w-4 h-4 text-primary" />Rejilla Fija de 15 Minutos</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>La agenda imita un dietario físico profesional para que nunca pierdas la noción del tiempo:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Espacio Físico Real:</strong> Cada cita se posiciona y escala según la duración del servicio (30 min, 60 min, etc.).</li>
                      <li><strong>Creación Instantánea:</strong> Haz clic en cualquier hueco vacío para abrir el formulario de cita con la hora ya pre-configurada.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="colores">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><BarChart className="w-4 h-4 text-primary" />Escala de Colores (Carga de Trabajo)</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>El calendario mensual te indica tu volumen de trabajo diario mediante un código de colores intuitivo:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-200"><span className="w-4 h-4 rounded-full bg-green-500"></span> <span className='text-slate-900 font-bold'>Verde:</span> 1-2 citas (Carga Baja)</div>
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-md border border-orange-200"><span className="w-4 h-4 rounded-full bg-orange-500"></span> <span className='text-slate-900 font-bold'>Naranja:</span> 3-4 citas (Carga Media)</div>
                      <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md border border-red-200"><span className="w-4 h-4 rounded-full bg-red-500"></span> <span className='text-slate-900 font-bold'>Rojo:</span> 5-6 citas (Carga Alta)</div>
                      <div className="flex items-center gap-2 p-2 bg-red-900/10 rounded-md border border-red-900"><span className="w-4 h-4 rounded-full bg-red-900"></span> <span className='text-slate-900 font-bold'>Granate:</span> 7+ citas (Máxima Capacidad)</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="acciones">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><CheckCircle className="w-4 h-4 text-primary" />Botones de Acción Rápida</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Gestiona tus sesiones con iconos de alto contraste diseñados para no fallar:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Azul (Editar):</strong> Modifica los datos o desplaza la cita de hora.</li>
                      <li><strong>Rojo (Eliminar):</strong> Cancela y borra la cita permanentemente.</li>
                      <li><strong>Ámbar (€):</strong> Finaliza y cobra la cita registrando el importe en contabilidad.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 3: CONTABILIDAD Y GASTOS */}
          <Card className="shadow-lg border-l-4 border-l-destructive overflow-hidden">
            <CardHeader className="bg-destructive/5">
              <CardTitle className="text-2xl text-destructive flex items-center gap-3"><Calculator className="w-6 h-6"/> Contabilidad, Gastos y Balances</CardTitle>
              <CardDescription>Control financiero completo con registro de ingresos, egresos y facturación.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="gastos">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold text-destructive'><Receipt className="w-4 h-4 text-destructive" />Registro de Gastos (Egresos en Rojo)</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Registra cualquier desembolso del negocio para mantener tus cuentas reales:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Botón "Registrar Gasto":</strong> Introduce el concepto (Alquiler, Luz, Materiales), el importe y la fecha del gasto.</li>
                      <li><strong>Resaltado en Rojo:</strong> Los gastos aparecen destacados en rojo con signo negativo (ej. <span className="text-destructive font-bold">-50.00€</span>) tanto en el listado de movimientos como en la tarjeta de resumen.</li>
                      <li><strong>Eliminación Fácil:</strong> Puedes borrar cualquier gasto registrado erróneamente usando el icono de papelera.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="balance">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><Euro className="w-4 h-4 text-primary" />Balance Neto e Informes Impresos</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Obtén el resultado real de tu actividad en el período seleccionado:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Beneficio Neto:</strong> La aplicación calcula automáticamente <code className="text-primary font-bold">Ingresos Totales - Gastos Totales</code>.</li>
                      <li><strong>Desglose por Métodos:</strong> Gráficos interactivos de cobros por Efectivo, Bizum y PayPal.</li>
                      <li><strong>Impresión / Exportación PDF:</strong> El botón "Imprimir" genera un informe profesional preparado para imprimir o guardar en PDF con todos tus movimientos del período.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 4: CENTRO DE COMUNICACIONES (WHATSAPP) */}
          <Card className="shadow-lg border-l-4 border-l-green-600 overflow-hidden">
            <CardHeader className="bg-green-600/5">
              <CardTitle className="text-2xl text-green-700 dark:text-green-400 flex items-center gap-3"><MessageSquare className="w-6 h-6"/> Centro de Comunicaciones WhatsApp</CardTitle>
              <CardDescription>Envío automatizado de recordatorios, promociones y notificaciones a clientes.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="plantillas">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><Send className="w-4 h-4 text-green-600" />Plantillas de WhatsApp de 1 Clic</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Dispones de 11 plantillas especializadas para automatizar la atención a tus clientes:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Recordatorios de Cita:</strong> Envía un aviso por WhatsApp a los clientes con citas futuras.</li>
                      <li><strong>Agradecer Compra de Bono:</strong> Envía automáticamente un agradecimiento y confirma las sesiones adquiridas al vender un bono.</li>
                      <li><strong>Notificar Pagos Pendientes:</strong> Contacta respetuosamente a clientes con servicios realizados aún no cobrados.</li>
                      <li><strong>Ausencias (No Show):</strong> Escribe a clientes que no acudieron a su cita para invitarles a reagendar.</li>
                      <li><strong>Anulación / Modificación por Fuerza Mayor:</strong> Avisa de forma urgente y educada sobre la necesidad de cambiar una cita por imprevistos personales.</li>
                      <li><strong>Comunicado General:</strong> Redacta y difunde avisos a todos los clientes.</li>
                      <li><strong>Campaña de Ofertas:</strong> Lanza promociones y descuentos especiales.</li>
                      <li><strong>Cumpleaños, Inactivos y Bienvenidos:</strong> Felicitaciones, recuperación de clientes antiguos y mensaje de bienvenida a nuevos registros.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 5: CLIENTES, BONOS Y RESPALDOS */}
          <Card className="shadow-lg border-l-4 border-l-primary overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Users className="w-6 h-6"/> Fichero de Clientes, Bonos y Copias de Seguridad</CardTitle>
              <CardDescription>Gestión completa de fichas, bonos de sesiones y resguardo de datos.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="bonos">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><Gift className="w-4 h-4 text-primary" />Venta y Descuento de Bonos</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Gestiona bonos de sesiones con actualización en tiempo real:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Venta de Bono:</strong> Registra la compra de un bono asignando el número de sesiones e importe.</li>
                      <li><strong>WhatsApp Automático:</strong> Al vender el bono, la app ofrece abrir la ventana emergente para enviar la confirmación por WhatsApp al cliente.</li>
                      <li><strong>Boton Notificar:</strong> En la ficha del cliente, dispones de un botón directo de WhatsApp junto a las sesiones restantes para informar del saldo de bono en cualquier momento.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="copias">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><ShieldCheck className="w-4 h-4 text-primary" />Copias de Seguridad (Exportar / Importar JSON)</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Mantén tus datos respaldados y portables entre dispositivos:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Exportar Copia de Seguridad:</strong> Desde la pestaña "Quién Eres", descarga un archivo <code>.json</code> con todos tus clientes, citas, bonos, gastos y servicios.</li>
                      <li><strong>Restaurar Datos:</strong> Selecciona un archivo <code>.json</code> previamente guardado para restaurar o trasladar tus datos a otro ordenador o dispositivo.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <footer className="text-center text-sm text-muted-foreground pt-12 border-t mt-12">
            <p>QuiroAgenda - La herramienta definitiva para profesionales del bienestar.</p>
            <p className="mt-1 font-semibold">Versión 3.0 "Gestión Integral y Comunicaciones Pro"</p>
          </footer>
        </div>
      </main>
    </div>
  );
}