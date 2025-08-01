
'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Leaf, CalendarDays, Users, Calculator, Gift, Send, UserCog, Bot, Lock, Euro, History, FileText, AlertCircle, ShoppingCart, BarChart, Eye, MessageSquare, Tag, Image as ImageIcon, Link as LinkIcon, Instagram, Facebook, Youtube, ShieldCheck, Database, KeyRound } from 'lucide-react';


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
                                <p><strong>Conecta tus redes:</strong> Introduce los enlaces a tus perfiles de Instagram, Facebook, TikTok y YouTube. Aunque por ahora solo se almacenan, en el futuro nos permitirán crear campañas de marketing más potentes y automatizadas.</p>
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
                  <AccordionTrigger><div className='flex items-center gap-2'><History className="w-4 h-4" /> Historial Detallado por Cliente</div></AccordionTrigger>
                  <AccordionContent>
                    <p>Haz clic en la tarjeta de cualquier cliente para acceder a su ficha completa. Aquí encontrarás:</p>
                     <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Datos y Detalles:</strong> Su información de contacto y cualquier nota importante (alergias, preferencias, etc.).</li>
                      <li><strong>Resumen Financiero y de Servicios:</strong> Tarjetas con el total facturado, citas completadas, ausencias y sus servicios más frecuentes.</li>
                      <li><strong>Historial Completo de Citas:</strong> Una tabla con todas sus citas (pasadas y futuras), el servicio realizado, su estado y los detalles de pago de cada una.</li>
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
              <CardTitle className="text-2xl text-accent flex items-center gap-3"><Gift /> Marketing y Comunicación</CardTitle>
              <CardDescription>Fideliza a tus clientes y aumenta tus ingresos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger><div className='flex items-center gap-2'><Send className="w-4 h-4" /> Recordatorios de Citas Flexibles</div></AccordionTrigger>
                  <AccordionContent>
                    Reduce las ausencias enviando recordatorios por WhatsApp. Puedes seleccionar cualquier cita futura pendiente de la lista y generar sus recordatorios.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger><div className='flex items-center gap-2'><Gift className="w-4 h-4" /> Campañas de Ofertas</div></AccordionTrigger>
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
                        <p>Para proteger el acceso a la aplicación en un dispositivo, QuiroAgenda te pedirá que establezcas una contraseña la primera vez que la uses (después de que tu licencia sea validada). Esta contraseña se guarda de forma segura en el navegador de ese dispositivo específico.</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                          <li><strong>¿Tengo que usar la misma contraseña en todos los dispositivos?</strong> No. Puedes (y deberías) establecer una contraseña diferente para cada navegador/dispositivo desde el que accedas.</li>
                          <li><strong>¿Qué pasa si olvido la contraseña?</strong> Dado que la contraseña es local y está encriptada, no se puede recuperar. La única solución es borrar los datos de navegación de ese navegador (cookies y datos de sitios). Al hacerlo, se eliminará la contraseña olvidada y podrás establecer una nueva la próxima vez que abras la aplicación.</li>
                        </ul>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger><div className='flex items-center gap-2'><Database className="w-4 h-4" />Copias de Seguridad</div></AccordionTrigger>
                        <AccordionContent>
                        <p>Toda tu información (clientes, citas, servicios, etc.) se guarda localmente en tu navegador. Tú tienes el control total de tus datos. En la sección <strong>"Quién Eres" &gt; "Gestión de Datos"</strong>, puedes:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                          <li><strong>Exportar Copia:</strong> Descarga un archivo JSON con todos los datos de tu aplicación. Es muy recomendable hacer copias de seguridad periódicas. <strong>¡Atención!</strong> Este archivo contiene datos sensibles. Guárdalo en un lugar seguro y privado.</li>
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

    