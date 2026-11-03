'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Leaf, 
  CalendarDays, 
  Users, 
  Calculator, 
  Gift, 
  Send, 
  UserCog, 
  Euro, 
  History, 
  FileText, 
  AlertCircle, 
  ShoppingCart, 
  BarChart, 
  Eye, 
  MessageSquare, 
  Tag, 
  Image as ImageIcon, 
  Globe, 
  Clock, 
  Cake, 
  Bell, 
  CheckCircle, 
  Trash2, 
  Edit, 
  ShieldCheck, 
  KeyRound, 
  Receipt, 
  TrendingDown, 
  CalendarOff, 
  Megaphone,
  Smartphone,
  Lock,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  CalendarCheck,
  CalendarX,
  CalendarClock
} from 'lucide-react';

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
          
          {/* SECCIÓN 1: IDENTIDAD, HORARIOS Y ANTELACIÓN MÍNIMA */}
          <Card className="shadow-lg border-l-4 border-l-primary overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><UserCog className="w-6 h-6"/> Perfil, Horarios y Antelación Mínima</CardTitle>
              <CardDescription>Establece tu marca, tus turnos semanales de trabajo y el margen de aviso previo para reservas.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="antelacion-minima">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold text-primary'><Clock className="w-4 h-4 text-primary" />Antelación Mínima para Reservas Online (Margen de Preparación)</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Protege tu ritmo de trabajo evitando reservas o cancelaciones sorpresa de última hora:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Margen Configurable en Horas:</strong> En "Quién Eres", define las horas mínimas que necesitas de preaviso (por defecto <strong>6 horas</strong>, o mediante accesos rápidos de 2h, 4h, 6h, 12h y 24h).</li>
                      <li><strong>Filtrado Automático en el Calendario:</strong> Si son las 14:00h y tienes configuradas 6 horas de antelación, los clientes solo podrán reservar citas a partir de las 20:00h. Cualquier hora anterior desaparece del selector.</li>
                      <li><strong>Avance Inteligente de Día:</strong> Si para el día de hoy ya no quedan huecos libres que cumplan con la antelación exigida, el día se marca automáticamente como no disponible y el calendario sugiere directamente el siguiente día con horas libres.</li>
                      <li><strong>Protección del Servidor:</strong> Cualquier intento de reserva o cancelación fuera del margen mínimo es rechazado por el sistema con un mensaje explicativo invitando a contactar contigo directamente por WhatsApp.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="horarios">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><CalendarDays className="w-4 h-4 text-primary" />Turnos de Trabajo por Día de la Semana</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Configura tu jornada de lunes a domingo para que la web solo ofrezca tus horas reales disponibles:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Doble Turno Independiente:</strong> Activa o desactiva de forma independiente los turnos de Mañana y Tarde para cada día de la semana.</li>
                      <li><strong>Copiar Horario en 1 Clic:</strong> Puedes configurar un día y copiar su horario a toda la semana laboral (Lunes a Viernes) o a toda la semana completa.</li>
                      <li><strong>Vacaciones y Festivos / Inhábiles:</strong> Bloquea períodos completos de descanso o días festivos específicos. Esos días quedan completamente cerrados tanto en tu agenda como en el portal web. La app limpia automáticamente las fechas festivas ya pasadas.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="marca">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><ImageIcon className="w-4 h-4 text-primary" />Identidad Visual, Redes y WhatsApp Business</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Datos visibles en tu web pública, portal de clientes y recordatorios:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Logotipo y Datos:</strong> Imagen de cabecera JPG, nombre comercial, dirección física y teléfono de contacto.</li>
                      <li><strong>WhatsApp Business Oficial (+34 634 43 24 87):</strong> Centralizado en la base de datos para que todos los botones de contacto y confirmación abran chat directamente contigo.</li>
                      <li><strong>Canal de Telegram y Redes Sociales:</strong> Enlaces visibles a Instagram, Facebook, TikTok y tu canal de Telegram para que los clientes te sigan.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 2: ÁREA PRIVADA DE CLIENTES Y PIN CONFIDENCIAL */}
          <Card className="shadow-lg border-l-4 border-l-amber-600 overflow-hidden">
            <CardHeader className="bg-amber-600/5">
              <CardTitle className="text-2xl text-amber-800 dark:text-amber-400 flex items-center gap-3"><Lock className="w-6 h-6"/> Área Privada de Clientes y Sistema de PIN (/mi-cuenta)</CardTitle>
              <CardDescription>Portal de autoservicio para pacientes: consulta de bonos, próximas citas y autogestión.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="acceso-pin">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300'><KeyRound className="w-4 h-4 text-amber-600" />Acceso Blindado con Teléfono y PIN de 4 Dígitos</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Privacidad total para cada paciente sin necesidad de crear complejas cuentas de usuario:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Identificación por Móvil:</strong> El paciente accede introduciendo el número de teléfono con el que está registrado o reservó su cita.</li>
                      <li><strong>Creación de PIN (Primera Vez):</strong> Si accede por primera vez, el sistema le solicita crear un PIN confidencial de 4 números y confirmarlo.</li>
                      <li><strong>Seguridad Inmutable y Privacidad Total:</strong> Los PINs se almacenan de forma aislada y encriptada mediante algoritmo HMAC SHA-256 en la nube. Nadie, ni siquiera el administrador del gabinete, puede conocer ni ver el PIN de un cliente.</li>
                      <li><strong>Pérdida de PIN y Reseteo por el Administrador:</strong> Dado que el PIN está cifrado y nadie lo sabe, si un paciente lo olvida no es posible recuperarlo; únicamente puedes entrar a su ficha en "Clientes" y pulsar el botón <em>"Resetear PIN Web"</em> para que el sistema le pida crear uno nuevo en su siguiente acceso.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bonos-cliente">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold'><Gift className="w-4 h-4 text-amber-600" />Visualización de Bonos de Masajes Activos</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>El paciente tiene control total sobre sus sesiones contratadas:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Saldo en Tiempo Real:</strong> Muestra claramente las sesiones restantes disponibles sobre el total (ej. <em>4 de 5 sesiones disponibles</em>).</li>
                      <li><strong>Barra de Progreso Dinámica:</strong> Indica gráficamente el avance y consumo del bono con indicativo de <em>Sin Caducidad</em>.</li>
                      <li><strong>Botón Consultar Bonos:</strong> Si no dispone de bonos activos, se le ofrece un botón directo de WhatsApp para solicitar información y adquirir un bono de 5 o 10 sesiones con descuento.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="autogestion-citas">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold text-primary'><RefreshCw className="w-4 h-4 text-primary" />Autogestión de Citas: Cancelar y Reprogramar Online</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Tus clientes pueden gestionar sus propias citas sin molestarte por teléfono:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Botón "Cambiar Cita":</strong> Abre una ventana donde el paciente elige una nueva fecha y hora entre tus huecos libres reales. La cita anterior se reubica automáticamente y tú recibes una alerta inmediata en Telegram.</li>
                      <li><strong>Botón "Cancelar Cita":</strong> Permite al paciente anular su cita tras confirmar y dejar un motivo opcional. El hueco se libera al segundo en tu agenda para que otro paciente pueda reservarlo.</li>
                      <li><strong>Añadir a Google Calendar:</strong> Botón directo para que el paciente guarde la sesión en el calendario de su móvil con un solo clic.</li>
                      <li><strong>Avisar por WhatsApp:</strong> Botón secundario para escribirte directamente si necesita consultar algún detalle especial sobre su sesión.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 3: ALERTAS INSTANTÁNEAS EN TU MÓVIL (TELEGRAM) */}
          <Card className="shadow-lg border-l-4 border-l-sky-500 overflow-hidden">
            <CardHeader className="bg-sky-500/5">
              <CardTitle className="text-2xl text-sky-700 dark:text-sky-400 flex items-center gap-3"><Bell className="w-6 h-6"/> Avisos Automáticos en tu Móvil (Bot de Telegram)</CardTitle>
              <CardDescription>Notificaciones push al instante en tu smartphone cada vez que ocurra un movimiento en tu web.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="alertas-tipos">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold text-sky-700 dark:text-sky-300'><Smartphone className="w-4 h-4 text-sky-500" />¿Qué alertas recibes en tu Telegram?</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Tu bot personal <strong>@Quiroagenda_bot</strong> te avisa con sonido y vibración en los siguientes eventos:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Nueva Reserva Online:</strong> Recibes el nombre del cliente, teléfono (con enlace para llamar), masaje contratado, duración, fecha, hora, importe, notas del cliente y un enlace directo para abrir su chat de WhatsApp con el saludo pre-redactado.</li>
                      <li><strong>Cancelación de Cita:</strong> Notificación inmediata indicando qué paciente ha cancelado, día, hora, motivo indicado y confirmación de que el hueco ha quedado liberado en tu agenda.</li>
                      <li><strong>Cambio de Cita:</strong> Mensaje detallado con la comparativa de la cita anterior (fecha y hora tachadas) y la nueva fecha/hora confirmada.</li>
                      <li><strong>100% Gratuito:</strong> Funciona mediante la API oficial de Telegram, sin cuotas mensuales ni costes por mensaje.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 4: RESERVAS ONLINE Y CATÁLOGO PÚBLICO */}
          <Card className="shadow-lg border-l-4 border-l-emerald-600 overflow-hidden">
            <CardHeader className="bg-emerald-600/5">
              <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-400 flex items-center gap-3"><Globe className="w-6 h-6"/> Catálogo y Portal de Reservas Directas (/reservas)</CardTitle>
              <CardDescription>Tu recepción virtual abierta 24/7 para que los clientes elijan masaje y hora.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="motor-reservas">
                  <AccordionTrigger><div className='flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300'><Sparkles className="w-4 h-4 text-emerald-600" />Catálogo con Múltiples Duraciones y Tarifas</div></AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>Experiencia intuitiva y rápida para cualquier paciente desde su móvil:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Tarifas por Duración:</strong> Los masajes permiten elegir la duración deseada (ej. 30 min por 25€, 60 min por 45€ o 90 min por 65€). El cálculo de huecos libres se adapta a la duración exacta seleccionada.</li>
                      <li><strong>Reconocimiento de Pacientes:</strong> Si el cliente ya dispone de sesión iniciada en su móvil, el sistema autocompleta sus datos y le saluda por su nombre sin volver a preguntarle si es nuevo.</li>
                      <li><strong>Confirmación con 1 Clic por WhatsApp:</strong> Al completar la reserva, la pantalla de éxito le ofrece el botón <em>"Avisar a Pako por WhatsApp"</em> con el mensaje pre-redactado para máxima tranquilidad del cliente.</li>
                      <li><strong>Botón Flotante Permanente de WhatsApp:</strong> Disponible en todo momento en la esquina inferior derecha con tu número oficial <strong>+34 634 43 24 87</strong> para resolver dudas previas.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SECCIÓN 5: LA AGENDA (EL DIETARIO PRO) */}
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

          {/* SECCIÓN 6: CONTABILIDAD Y GASTOS */}
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

          {/* SECCIÓN 7: CENTRO DE COMUNICACIONES (WHATSAPP) */}
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

          {/* SECCIÓN 8: CLIENTES, BONOS Y RESPALDOS */}
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
            <p className="mt-1 font-semibold">Versión 4.0 "Área Privada de Clientes, Autogestión y Alertas en Tiempo Real"</p>
          </footer>
        </div>
      </main>
    </div>
  );
}