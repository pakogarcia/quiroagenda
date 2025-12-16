
'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Leaf, CalendarDays, Users, Calculator, Gift, Send, UserCog, Bot, Lock, Euro, History, FileText, AlertCircle, ShoppingCart, BarChart, Eye, MessageSquare, Tag, Image as ImageIcon, Link as LinkIcon, Instagram, Facebook, Youtube, ShieldCheck, Database, KeyRound, Edit, UserX, CalendarOff, Megaphone, Clock, Cake, Bell } from 'lucide-react';


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
                    <CardTitle className="text-2xl text-accent flex items-center gap-3"><UserCog /> Perfil de Negocio ("Quién Eres")</CardTitle>
                    <CardDescription>Personaliza la aplicación para que hable por ti y refleje tu marca.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger><div className='flex items-center gap-2'><FileText className="w-4 h-4" />Datos Básicos</div></AccordionTrigger>
                            <AccordionContent>
                                <p>Introduce el nombre, la situación y el teléfono de tu negocio. Esta información se utilizará para personalizar automáticamente todos los mensajes de WhatsApp, añadiendo el nombre de tu negocio al final para reforzar tu marca en cada comunicación.</p>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-2">
                            <AccordionTrigger><div className='flex items-center gap-2'><ImageIcon className="w-4 h-4" />Logotipo y Redes Sociales</div></AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <p><strong>Sube tu logotipo:</strong> Añade tu logotipo en formato JPG. Se mostrará en la cabecera de la aplicación, reemplazando el icono por defecto para una personalización completa.</p>
                                <p><strong>Conecta tus redes:</strong> Introduce los enlaces a tus perfiles de Instagram, Facebook, TikTok y YouTube. Estos enlaces se podrán añadir opcionalmente en tus comunicaciones por WhatsApp.</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><CalendarDays /> Gestión de Agenda Inteligente</CardTitle>
              <CardDescription>Tu tiempo es valioso. Organízalo sin esfuerzo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger><div className='flex items-center gap-2'><Eye className="w-4 h-4" />Visualización y Navegación</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Navega por un calendario visual e intuitivo. Los días con citas se marcan con colores para que veas de un vistazo tu ocupación futura: verde (1 cita), naranja (2 citas) y rojo (3 o más).</p>
                    <p>Los días que hayas bloqueado aparecerán en gris y no permitirán nuevas citas.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger><div className='flex items-center gap-2'><Tag className="w-4 h-4" />Asignar Servicios a Citas</div></AccordionTrigger>
                  <AccordionContent>
                    <p>Al crear o editar una cita, ahora puedes seleccionar un servicio específico de tu catálogo. Esto no solo agiliza el proceso, sino que también enriquece tus registros y estadísticas.</p>
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                  <AccordionTrigger><div className='flex items-center gap-2'><Euro className="w-4 h-4" />Finalizar una Cita (Cobro, Ausencias y Pagos Pendientes)</div></AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>En las citas pasadas (o el mismo día), verás un icono de Euro (€). Al pulsarlo, se abre un diálogo para finalizar la cita con varias opciones:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Registrar Pago:</strong> Anota el importe y el método de pago (Efectivo, Bizum, PayPal o Bono).</li>
                      <li><strong>Completada (Pendiente de Pago):</strong> Marca la cita como realizada pero sin cobrar. El icono del Euro (€) seguirá visible para que puedas registrar el pago más adelante.</li>
                      <li><strong>Marcar como No Presentado:</strong> Si el cliente no acude, esta opción lo registrará y la cita no contará en tu contabilidad.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Bloqueo de Días</span>
                        </div>
                    </AccordionTrigger>
                  <AccordionContent>
                    ¿Necesitas un día libre? Selecciona un día en el calendario y pulsa el botón con el icono de candado (<Lock className="inline h-4 w-4"/>). El día se marcará como no disponible y no podrás agendar citas en él. Vuelve a pulsarlo para desbloquearlo.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger><div className='flex items-center gap-2'><MessageSquare className="w-4 h-4" />Confirmación por WhatsApp</div></AccordionTrigger>
                  <AccordionContent>
                    Al crear o modificar una cita, QuiroAgenda genera un mensaje de confirmación profesional para enviar por WhatsApp. Puedes elegir qué redes sociales adjuntar al mensaje para una personalización completa.
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
                  <AccordionTrigger><div className='flex items-center gap-2'><History className="w-4 h-4" /> Historial Detallado por Cliente</div></AccordionTrigger>
                  <AccordionContent>
                    <p>Haz clic en la tarjeta de cualquier cliente para acceder a su ficha completa. Aquí encontrarás:</p>
                     <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Datos y Detalles:</strong> Su información de contacto, fecha de nacimiento y cualquier nota importante (alergias, preferencias, etc.).</li>
                      <li><strong>Resumen Financiero y de Servicios:</strong> Tarjetas con el total facturado, citas completadas, ausencias y sus servicios más frecuentes.</li>
                      <li><strong>Historial Completo:</strong> Una tabla con todas sus citas y compras de bonos, agrupadas por mes.</li>
                      <li><strong>Edición de Pagos:</strong> ¿Te equivocaste al registrar un pago? Haz clic en el icono de editar (<Edit className="inline h-4 w-4" />) junto a una cita completada o una compra de bono para corregir el importe o el método de pago.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-2">
                    <AccordionTrigger><div className='flex items-center gap-2'><AlertCircle className="w-4 h-4 text-yellow-600" /> Gestión de Pagos Pendientes</div></AccordionTrigger>
                    <AccordionContent>
                        <p>Las tarjetas de los clientes con citas pendientes de pago aparecen con un borde amarillo para una rápida identificación. En su historial, puedes hacer clic directamente en el estado "Pendiente de Pago" para registrar el cobro sin tener que volver a la agenda principal.</p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger><div className='flex items-center gap-2'><FileText className="w-4 h-4" /> Campo de Detalles del Cliente</div></AccordionTrigger>
                  <AccordionContent>
                    Al crear o editar un cliente, ahora dispones de un campo de "Detalles" para anotar información crucial como alergias, condiciones médicas, preferencias o cualquier otra nota relevante para ofrecer un servicio seguro y personalizado.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger><div className='flex items-center gap-2'><Gift className="w-4 h-4"/> Gestión de Bonos por Cliente</div></AccordionTrigger>
                  <AccordionContent>
                    Desde la ficha de un cliente, puedes asignarle o modificar un bono. Cuando un cliente pague con bono, se descontará una sesión automáticamente. Tras usarlo, la aplicación generará un mensaje de WhatsApp para informarle de las sesiones restantes.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Tag /> Gestión de Servicios y Precios</CardTitle>
              <CardDescription>Define tu catálogo de tratamientos para agilizar la creación de citas y obtener mejores estadísticas.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger><div className='flex items-center gap-2'><Tag className="w-4 h-4" />Define tu catálogo de servicios</div></AccordionTrigger>
                  <AccordionContent>
                    <p>En la nueva sección "Servicios", puedes crear, editar o eliminar cada uno de los tratamientos que ofreces. Asigna a cada uno:</p>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>Nombre del Servicio:</strong> El nombre claro y descriptivo de tu tratamiento (ej. "Masaje Relajante").</li>
                        <li><strong>Duración:</strong> El tiempo en minutos que dura el servicio.</li>
                        <li><strong>Precio:</strong> El coste del servicio para el cliente.</li>
                      </ul>
                      <p className='mt-2'>Esta información se usará en la agenda para agilizar la creación de citas y en la contabilidad para darte estadísticas detalladas.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Send /> Centro de Comunicaciones</CardTitle>
              <CardDescription>Fideliza a tus clientes y aumenta tus ingresos con campañas de mensajería inteligentes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger><div className='flex items-center gap-2'><Bell className="w-4 h-4" /> Recordatorios de Citas</div></AccordionTrigger>
                  <AccordionContent>
                    Reduce las ausencias enviando recordatorios por WhatsApp. La IA solo te mostrará los clientes con una cita próxima para evitar duplicados.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-2">
                  <AccordionTrigger><div className='flex items-center gap-2'><AlertCircle className="w-4 h-4" /> Pagos Pendientes</div></AccordionTrigger>
                  <AccordionContent>
                    Envía un amable recordatorio a los clientes que tienen citas completadas pero cuyo pago aún no has registrado.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                  <AccordionTrigger><div className='flex items-center gap-2'><UserX className="w-4 h-4" /> Contactar por Ausencia (No Show)</div></AccordionTrigger>
                  <AccordionContent>
                    Comunícate con los clientes que no se presentaron a su última cita para entender el motivo y recordarles la política de cancelación si es necesario.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-4">
                  <AccordionTrigger><div className='flex items-center gap-2'><CalendarOff className="w-4 h-4" /> Anulación/Modificación de Cita</div></AccordionTrigger>
                  <AccordionContent>
                    Si te surge un imprevisto, informa rápidamente a los clientes afectados. Podrás proponer una nueva fecha y hora directamente en el mensaje.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-5">
                  <AccordionTrigger><div className='flex items-center gap-2'><Gift className="w-4 h-4" /> Notificar Sesiones de Bono</div></AccordionTrigger>
                  <AccordionContent>
                    Mantén informados a tus clientes sobre cuántas sesiones les quedan en su bono. Perfecto para cuando acaban de usar una o simplemente para que no se olviden de volver.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-6">
                  <AccordionTrigger><div className='flex items-center gap-2'><Cake className="w-4 h-4" /> Felicitaciones de Cumpleaños</div></AccordionTrigger>
                  <AccordionContent>
                    ¡Fideliza con un detalle! La aplicación te mostrará los clientes cuyos cumpleaños fueron en la última semana o serán en las próximas dos, para que no se te pase ninguno.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-7">
                  <AccordionTrigger><div className='flex items-center gap-2'><Clock className="w-4 h-4" /> Clientes Inactivos</div></AccordionTrigger>
                  <AccordionContent>
                    Recupera a esos clientes que hace tiempo que no te visitan. Puedes configurar el número de días de inactividad para que la IA te sugiera a quién contactar con un mensaje cercano.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-8">
                  <AccordionTrigger><div className='flex items-center gap-2'><Users className="w-4 h-4" /> Bienvenida a Nuevos Clientes</div></AccordionTrigger>
                  <AccordionContent>
                    ¿Alguien pide información? Envíale un mensaje de bienvenida profesional con tus datos de contacto, dirección y, lo más importante, tu lista de servicios con precios.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-9">
                  <AccordionTrigger><div className='flex items-center gap-2'><Gift className="w-4 h-4" /> Campaña de Oferta</div></AccordionTrigger>
                  <AccordionContent>
                    Crea ofertas especiales y promociónalas entre los clientes que elijas. La IA redactará un mensaje persuasivo y personalizado para cada uno.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-10">
                  <AccordionTrigger><div className='flex items-center gap-2'><Megaphone className="w-4 h-4" /> Comunicado General</div></AccordionTrigger>
                  <AccordionContent>
                    La herramienta definitiva para la flexibilidad. Anuncia vacaciones, cambios de horario o cualquier otra noticia. Escribe un mensaje totalmente libre y envíalo a los clientes que selecciones.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-11">
                  <AccordionTrigger><div className='flex items-center gap-2 text-primary'><Edit className="w-4 h-4" /> Nota Personalizada</div></AccordionTrigger>
                  <AccordionContent>
                    En la mayoría de las campañas, al seleccionar un cliente, aparecerá un campo de texto para que añadas una nota opcional (ej. "¡Espero que te recuperes pronto!" o "Recuerda que la puntualidad es importante"). Este texto se integrará de forma natural en el mensaje final, dándote el poder de personalizar la comunicación masiva.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Calculator /> Contabilidad Avanzada</CardTitle>
              <CardDescription>Transforma tus números en decisiones inteligentes.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger><div className='flex items-center gap-2'><BarChart className="w-4 h-4" />Gráficos Interactivos</div></AccordionTrigger>
                        <AccordionContent>
                        Visualiza al instante de dónde provienen tus ganancias. Dos gráficos de tarta desglosan tus ingresos: uno por <strong>método de pago</strong> (Efectivo, Bizum, PayPal) y otro por <strong>servicio</strong>, mostrándote qué tratamientos son los más rentables.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger><div className='flex items-center gap-2'><FileText className="w-4 h-4" />Resúmenes Clave</div></AccordionTrigger>
                        <AccordionContent>
                        Tarjetas destacadas te muestran la información más relevante de un vistazo: los <strong>Ingresos Totales</strong> (resaltada para máxima visibilidad), el número de <strong>Citas Completadas</strong>, los <strong>Bonos Usados</strong> y, muy importante, los <strong>Pagos Pendientes</strong>.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-3">
                        <AccordionTrigger><div className='flex items-center gap-2'><History className="w-4 h-4" />Informes Detallados e Imprimibles</div></AccordionTrigger>
                        <AccordionContent>
                        La tabla de movimientos te ofrece un desglose de cada transacción (citas por servicio y ventas de bonos) en el período seleccionado. Además, puedes imprimir estos informes para tus registros o para una gestión más tradicional.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-4">
                        <AccordionTrigger><div className='flex items-center gap-2'><ShoppingCart className="w-4 h-4" />Venta Directa de Bonos</div></AccordionTrigger>
                        <AccordionContent>
                        No esperes a que un cliente esté en una cita. Desde la página de Contabilidad, puedes registrar la venta de un nuevo bono directamente, agilizando el proceso y manteniendo tus registros financieros y de clientes siempre sincronizados.
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            </CardContent>
          </Card>

           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><ShieldCheck /> Seguridad y Datos</CardTitle>
              <CardDescription>Gestiona el acceso a tu aplicación y tus datos.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger><div className='flex items-center gap-2'><KeyRound className="w-4 h-4" />Contraseña de Acceso Local</div></AccordionTrigger>
                        <AccordionContent>
                        <p>Para proteger el acceso a la aplicación en un dispositivo, QuiroAgenda te pedirá que establezcas una contraseña la primera vez que la uses. Esta contraseña se guarda de forma segura en el navegador de ese dispositivo específico.</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                          <li><strong>¿Tengo que usar la misma contraseña en todos los dispositivos?</strong> No. Puedes (y deberías) establecer una contraseña diferente para cada navegador/dispositivo desde el que accedas.</li>
                          <li><strong>¿Cómo cambio mi contraseña?</strong> En la sección "Quién Eres" > "Gestión de Datos", encontrarás un botón para cambiar tu contraseña local. Deberás introducir tu contraseña actual para poder establecer una nueva.</li>
                          <li><strong>¿Qué pasa si olvido la contraseña?</strong> Dado que la contraseña es local y está encriptada, no se puede recuperar. La única solución es borrar los datos de navegación de ese navegador (cookies y datos de sitios). Al hacerlo, se eliminará la contraseña olvidada y podrás establecer una nueva la próxima vez que abras la aplicación.</li>
                        </ul>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger><div className='flex items-center gap-2'><Database className="w-4 h-4" />Copias de Seguridad</div></AccordionTrigger>
                        <AccordionContent>
                        <p>Toda tu información (clientes, citas, servicios, etc.) se guarda localmente en tu navegador. Tú tienes el control total de tus datos. En la sección <strong>"Quién Eres" &gt; "Gestión de Datos"</strong>, puedes:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                          <li><strong>Exportar Copia:</strong> Descarga un archivo JSON con todos los datos de tu aplicación. Es muy recomendable hacer copias de seguridad periódicas. <strong>¡Atención!</strong> Esta acción está protegida por tu contraseña local y el archivo contiene datos sensibles. Guárdalo en un lugar seguro y privado.</li>
                          <li><strong>Importar Copia:</strong> Restaura toda tu aplicación a partir de un archivo de copia de seguridad. <strong>Importante:</strong> Al importar, se borrarán todos los datos actuales y se reemplazarán por los del archivo.</li>
                        </ul>
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
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
              <p>Manual de ayuda de QuiroAgenda.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
