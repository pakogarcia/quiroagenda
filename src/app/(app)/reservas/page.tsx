'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CalendarDays, 
  Clock, 
  HeartPulse, 
  Footprints, 
  Sparkles, 
  Sun, 
  Flame, 
  Users, 
  Flower2, 
  Activity, 
  Zap, 
  Droplets, 
  Search, 
  MessageCircle,
  Star,
  CheckCircle2,
  Euro,
  Gift,
  Instagram,
  MapPin,
  Send,
  Video
} from 'lucide-react';

type PriceTier = {
  duration: string;
  price: string;
};

type ServiceLink = {
  id: string;
  title: string;
  category: 'relax' | 'descontracturante' | 'holistico' | 'salud';
  categoryLabel: string;
  url: string;
  isWhatsApp?: boolean;
  duration: string;
  mainPrice: string;
  priceTiers?: PriceTier[];
  icon: React.ElementType;
  tagline: string;
  description: string;
  benefits: string[];
  popular?: boolean;
};

const SERVICES: ServiceLink[] = [
  {
    id: 'masaje-circulatorio',
    title: 'Masaje Circulatorio',
    category: 'salud',
    categoryLabel: 'Salud & Vigor',
    url: 'https://cal.eu/pakogarcia/masaje-circulatorio',
    duration: '60 min',
    mainPrice: '25€',
    icon: HeartPulse,
    tagline: 'Alivio de piernas pesadas y reactivación del flujo vascular',
    description: 'Técnica especializada con pases ascendentes envolventes que estimula el retorno venoso y linfático, aliviando la hinchazón y fatiga muscular acumulada.',
    benefits: ['Reactivación vascular', 'Alivio de sobrecarga', 'Oxigenación muscular']
  },
  {
    id: 'masaje-de-pies',
    title: 'Masaje de Pies (Reflexología Podal)',
    category: 'relax',
    categoryLabel: 'Relajación Podal',
    url: 'https://cal.eu/pakogarcia/masaje-de-pies',
    duration: '15 min / 30 min',
    mainPrice: 'Desde 8€',
    priceTiers: [
      { duration: '15 min', price: '8€' },
      { duration: '30 min', price: '15€' }
    ],
    icon: Footprints,
    tagline: 'Estimulación de puntos reflejos para un equilibrio completo',
    description: 'Presiones digitales en las zonas reflejas de la planta y dorso del pie. Desbloquea tensiones físicas y genera un estado orgánico de profunda calma.',
    benefits: ['Equilibrio orgánico', 'Pies ligeros', 'Descanso del sistema nervioso']
  },
  {
    id: 'alquimia-massage',
    title: 'Alquimia Massage',
    category: 'holistico',
    categoryLabel: 'Experiencia Holística',
    url: 'https://cal.eu/pakogarcia/alquimia-massage',
    duration: '75 min',
    mainPrice: '30€',
    icon: Sparkles,
    tagline: 'Crema alquímica especial que se transforma en un suntuoso aceite oriental',
    popular: true,
    description: 'Exclusiva experiencia sensorial elaborada con una crema alquímica especial que, al entrar en contacto con el calor del cuerpo, se transforma en un suntuoso aceite de fragancia oriental y tacto sedoso.',
    benefits: ['Transformación en aceite sedoso', 'Fragancia oriental envolvente', 'Nutrición y paz profunda']
  },
  {
    id: 'masaje-integral',
    title: 'Masaje Integral (Cuerpo Entero)',
    category: 'relax',
    categoryLabel: 'Bienestar Global',
    url: 'https://cal.eu/pakogarcia/masaje-integral',
    duration: '60 min',
    mainPrice: '25€',
    icon: Sun,
    tagline: 'Cuidado completo de cabeza a pies',
    popular: true,
    description: 'Masaje corporativo holístico que aborda la totalidad del cuerpo. Equilibra las áreas de mayor estrés combinando pases neurosedantes y estiramientos suaves.',
    benefits: ['Bienestar 360°', 'Reducción del estrés', 'Flexibilidad articular']
  },
  {
    id: 'vulcan-massage',
    title: 'Vulcan Massage (Piedras Calientes)',
    category: 'holistico',
    categoryLabel: 'Terapia Térmica',
    url: 'https://cal.eu/pakogarcia/vulcan-massage',
    duration: '60 min',
    mainPrice: '35€',
    icon: Flame,
    tagline: 'Calor basáltico profundo para disolver rigideces musculares',
    description: 'Terapia térmica mediante piedras volcánicas lisas impregnadas en aceite tibio. El calor penetra hasta las capas musculares más profundas sin dolor.',
    benefits: ['Descontracción profunda', 'Mejora del sueño', 'Calor reconfortante']
  },
  {
    id: 'bonos-masajes',
    title: 'Bonos de Masajes (5 o 10 Sesiones)',
    category: 'holistico',
    categoryLabel: 'Ahorro & Fidelidad',
    url: 'https://wa.me/34634432487?text=Hola%20Pako,%20quisiera%20informaci%C3%B3n%20para%20contratar%20un%20bono%20de%20masajes',
    isWhatsApp: true,
    duration: '5 o 10 Sesiones',
    mainPrice: 'Ahorro Especial',
    icon: Gift,
    tagline: 'Ahorra en tus sesiones de bienestar con bonos personalizados',
    popular: true,
    description: 'Disfruta de la máxima flexibilidad y un ahorro exclusivo adquiriendo tus bonos de 5 o 10 masajes. Ideal para tratamientos continuados de salud o regalo especial.',
    benefits: ['Descuento acumulativo por paquete', 'Sin fecha límite de caducidad', 'Sesiones 100% transferibles']
  },
  {
    id: 'masaje-pareja',
    title: 'Masaje en Pareja',
    category: 'relax',
    categoryLabel: 'Experiencias Compartidas',
    url: 'https://cal.eu/pakogarcia/masaje-pareja',
    duration: '120 min (2 horas)',
    mainPrice: '43€ (2 personas)',
    icon: Users,
    tagline: 'Reserva especial para dos personas en sesiones consecutivas de 2 horas',
    description: 'Experiencia pensada para dos personas en sesiones consecutivas de 2 horas en total (1 hora por persona), disfrutando de un ambiente relajante con un precio especial y ventajoso.',
    benefits: ['2 Horas consecutivas totales', 'Tarifa especial en pareja', 'Ambiente cálido y acogedor']
  },
  {
    id: 'candle-massage',
    title: 'Candle Massage (Velas de Karité)',
    category: 'holistico',
    categoryLabel: 'Nutritivo & Sensorial',
    url: 'https://cal.eu/pakogarcia/candle-massage',
    duration: '60 min',
    mainPrice: '35€',
    icon: Flame,
    tagline: 'Cera tibia derretida de karité rica en aceites florales',
    description: 'Suntuoso masaje con el bálsamo tibio que mana al encender velas ecológicas de manteca pura de karité y aceites esenciales aromáticos.',
    benefits: ['Piel extremadamente sedosa', 'Sensación de tibieza', 'Aroma envolvente']
  },
  {
    id: 'masaje-relax',
    title: 'Masaje Relax',
    category: 'relax',
    categoryLabel: 'Relajación Absoluta',
    url: 'https://cal.eu/pakogarcia/masaje-relax',
    duration: '30 min a 90 min',
    mainPrice: 'Desde 15€',
    priceTiers: [
      { duration: '30 min', price: '15€' },
      { duration: '60 min', price: '25€' },
      { duration: '75 min', price: '32€' },
      { duration: '90 min', price: '38€' }
    ],
    icon: Flower2,
    tagline: 'Pases suaves y envolventes para desacelerar la mente',
    popular: true,
    description: 'Tratamiento antiestrés por excelencia. Maniobras continuadas de baja intensidad que disminuyen los niveles de cortisol y reponen la energía vital.',
    benefits: ['Calma mental instintiva', 'Combate el insomnio', 'Paz interior']
  },
  {
    id: 'espalda-piernas',
    title: 'Espalda y Piernas',
    category: 'descontracturante',
    categoryLabel: 'Descontracturante Focal',
    url: 'https://cal.eu/pakogarcia/espalda-piernas',
    duration: '30 min / 60 min',
    mainPrice: 'Desde 15€',
    priceTiers: [
      { duration: '30 min', price: '15€' },
      { duration: '60 min', price: '25€' }
    ],
    icon: Activity,
    tagline: 'Descarga intensiva para el eje posterior del cuerpo',
    description: 'Tratamiento enfocado en las zonas que mayor carga soportan a diario: zona lumbar, dorsal, glúteos e isquiotibiales. Ideal para deportistas o trabajos activos.',
    benefits: ['Descarga neuromuscular', 'Alivio lumbar', 'Piernas descansadas']
  },
  {
    id: 'espalda-cuello',
    title: 'Espalda y Cuello',
    category: 'descontracturante',
    categoryLabel: 'Descontracturante Tensional',
    url: 'https://cal.eu/pakogarcia/espalda-cuello',
    duration: '30 min / 60 min',
    mainPrice: 'Desde 15€',
    priceTiers: [
      { duration: '30 min', price: '15€' },
      { duration: '60 min', price: '25€' }
    ],
    icon: Zap,
    tagline: 'Foco en cervicales, trapecios y sobrecarga postural',
    popular: true,
    description: 'Enfocado en resolver los nudos y la rigidez de hombros, escápulas y cuello derivados de posturas mantenidas en pantallas o estrés acumulado.',
    benefits: ['Liberación de cervicales', 'Alivio de cefaleas tensionales', 'Mayor movilidad']
  },
  {
    id: 'drenaje-linfatico',
    title: 'Drenaje Linfático Manual',
    category: 'salud',
    categoryLabel: 'Salud & Depuración',
    url: 'https://cal.eu/pakogarcia/drenaje-linfatico',
    duration: '45 min',
    mainPrice: '45€',
    icon: Droplets,
    tagline: 'Bombeos suaves e higiénicos para eliminar líquidos y toxinas',
    description: 'Técnica científica suave y precisa que acelera la eliminación de fluidos estancados, favoreciendo la recuperación tisular y fortaleciendo las defensas.',
    benefits: ['Depuración profunda', 'Reducción de volumen', 'Sensación de ligereza']
  }
];

export default function OnlineBookingPage() {
  const [activeCategory, setActiveCategory] = React.useState<string>('todos');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedIframeUrl, setSelectedIframeUrl] = React.useState<string | null>(null);
  const [selectedServiceTitle, setSelectedServiceTitle] = React.useState<string>('');

  const filteredServices = React.useMemo(() => {
    return SERVICES.filter((service) => {
      const matchesCategory = activeCategory === 'todos' || service.category === activeCategory;
      const matchesSearch = 
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleOpenBooking = (service: ServiceLink) => {
    if (service.isWhatsApp) {
      window.open(service.url, '_blank');
      return;
    }
    setSelectedServiceTitle(service.title);
    setSelectedIframeUrl(service.url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbf7] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-body">

      {/* HERO SECTION CON COLORES CÁLIDOS Y ELEGANTE LOGOTIPO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-rose-500/5 to-[#fdfbf7] dark:to-slate-950 py-12 md:py-16 border-b border-amber-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-2 mb-6 bg-gradient-to-tr from-amber-400 via-rose-400 to-amber-200 rounded-full shadow-xl ring-4 ring-amber-300/30">
            <Image 
              src="/logo-quiro.jpg" 
              alt="QuiroAgenda Logo" 
              width={110} 
              height={110} 
              className="rounded-full object-cover shadow-inner"
              priority
            />
          </div>

          <Badge variant="outline" className="mb-3 px-4 py-1 border-amber-500/30 bg-amber-100/50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 font-semibold tracking-wide uppercase text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600 inline" />
            Pako García Quiromasajes · Portal de Citas
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold font-headline bg-gradient-to-r from-amber-900 via-rose-900 to-amber-700 dark:from-amber-200 dark:via-rose-200 dark:to-amber-100 bg-clip-text text-transparent mb-4">
            Tu Momento de Bienestar y Calma
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Elige el masaje o tratamiento holístico que tu cuerpo necesita y agenda tu cita al instante en nuestro calendario en tiempo real.
          </p>

          {/* BUSCADOR RÁPIDO */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-amber-700/60" />
            <Input 
              type="text"
              placeholder="Buscar masaje (ej. Relajante, Bonos, Cuello...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white/90 dark:bg-slate-900/90 border-amber-300/40 shadow-md rounded-full focus-visible:ring-amber-500"
            />
          </div>
        </div>
      </section>

      {/* FILTROS POR CATEGORÍA */}
      <nav className="max-w-6xl mx-auto px-4 pt-8 pb-4 w-full">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center">
          <Button 
            variant={activeCategory === 'todos' ? 'default' : 'outline'}
            onClick={() => setActiveCategory('todos')}
            className={`rounded-full px-5 h-10 shadow-sm transition-all ${
              activeCategory === 'todos' 
                ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-700/20' 
                : 'border-amber-200 hover:border-amber-400 bg-white dark:bg-slate-900'
            }`}
          >
            Todos los Tratamientos ({SERVICES.length})
          </Button>

          <Button 
            variant={activeCategory === 'relax' ? 'default' : 'outline'}
            onClick={() => setActiveCategory('relax')}
            className={`rounded-full px-5 h-10 shadow-sm transition-all ${
              activeCategory === 'relax' 
                ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-700/20' 
                : 'border-amber-200 hover:border-amber-400 bg-white dark:bg-slate-900'
            }`}
          >
            <Flower2 className="w-4 h-4 mr-1.5 text-rose-500" />
            Relajantes
          </Button>

          <Button 
            variant={activeCategory === 'descontracturante' ? 'default' : 'outline'}
            onClick={() => setActiveCategory('descontracturante')}
            className={`rounded-full px-5 h-10 shadow-sm transition-all ${
              activeCategory === 'descontracturante' 
                ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-700/20' 
                : 'border-amber-200 hover:border-amber-400 bg-white dark:bg-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 mr-1.5 text-amber-500" />
            Descontracturantes
          </Button>

          <Button 
            variant={activeCategory === 'holistico' ? 'default' : 'outline'}
            onClick={() => setActiveCategory('holistico')}
            className={`rounded-full px-5 h-10 shadow-sm transition-all ${
              activeCategory === 'holistico' 
                ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-700/20' 
                : 'border-amber-200 hover:border-amber-400 bg-white dark:bg-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 mr-1.5 text-amber-600" />
            Térmicos, Holísticos & Bonos
          </Button>

          <Button 
            variant={activeCategory === 'salud' ? 'default' : 'outline'}
            onClick={() => setActiveCategory('salud')}
            className={`rounded-full px-5 h-10 shadow-sm transition-all ${
              activeCategory === 'salud' 
                ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-700/20' 
                : 'border-amber-200 hover:border-amber-400 bg-white dark:bg-slate-900'
            }`}
          >
            <HeartPulse className="w-4 h-4 mr-1.5 text-rose-600" />
            Salud & Circulatorio
          </Button>
        </div>
      </nav>

      {/* GRID DE SERVICIOS DE MASAJE */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        {filteredServices.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50/30">
            <p className="text-slate-600 text-lg font-medium">No se han encontrado tratamientos que coincidan con tu búsqueda.</p>
            <Button variant="outline" className="mt-4 border-amber-400 text-amber-900" onClick={() => { setSearchQuery(''); setActiveCategory('todos'); }}>
              Ver todos los masajes
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
            {filteredServices.map((service) => {
              const Icon = service.icon;
              return (
                <Card 
                  key={service.id} 
                  className={`group relative flex flex-col justify-between overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    service.isWhatsApp
                      ? 'border-emerald-400/60 bg-gradient-to-b from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 shadow-md ring-2 ring-emerald-500/20'
                      : service.popular 
                        ? 'border-amber-400/60 bg-gradient-to-b from-amber-500/5 via-white to-white dark:from-amber-900/20 dark:via-slate-900 dark:to-slate-900 shadow-md' 
                        : 'border-amber-200/60 bg-white dark:bg-slate-900 shadow-sm'
                  }`}
                >
                  {service.popular && (
                    <div className={`absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider uppercase flex items-center gap-1 shadow-sm ${
                      service.isWhatsApp ? 'bg-gradient-to-l from-emerald-600 to-green-600' : 'bg-gradient-to-l from-amber-600 to-rose-600'
                    }`}>
                      <Star className="w-3 h-3 fill-white" />
                      {service.isWhatsApp ? 'Destacado' : 'Popular'}
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className={`p-3 rounded-2xl shadow-inner group-hover:scale-110 transition-transform ${
                        service.isWhatsApp
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : 'bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <Badge variant="outline" className="bg-amber-50 dark:bg-slate-800 border-amber-300/40 text-amber-900 dark:text-amber-300 flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {service.duration}
                        </Badge>
                        <Badge className={`font-bold px-2.5 py-0.5 shadow-sm text-white ${
                          service.isWhatsApp ? 'bg-emerald-700' : 'bg-amber-700'
                        }`}>
                          <Euro className="w-3 h-3 mr-0.5" />
                          {service.mainPrice}
                        </Badge>
                      </div>
                    </div>

                    <CardTitle className="text-xl font-bold font-headline text-slate-900 dark:text-white group-hover:text-amber-700 transition-colors">
                      {service.title}
                    </CardTitle>
                    
                    <p className={`text-xs font-semibold italic ${
                      service.isWhatsApp ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                    }`}>
                      {service.tagline}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1">
                    <CardDescription className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {service.description}
                    </CardDescription>

                    {/* TARIFAS DE PRECIO SEGÚN DURACIÓN */}
                    {service.priceTiers && (
                      <div className="bg-amber-50/70 dark:bg-slate-800/60 p-2.5 rounded-xl border border-amber-200/50 dark:border-slate-700 space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                          Opciones de Duración & Precio:
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {service.priceTiers.map((tier, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-amber-200/40 text-xs">
                              <span className="text-slate-600 dark:text-slate-400">{tier.duration}</span>
                              <span className="font-bold text-amber-800 dark:text-amber-300">{tier.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 pt-2 border-t border-amber-100 dark:border-slate-800">
                      {service.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <CheckCircle2 className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${
                            service.isWhatsApp ? 'text-emerald-600' : 'text-amber-600'
                          }`} />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 border-t border-amber-100 dark:border-slate-800/80 bg-amber-50/30 dark:bg-slate-900/50">
                    <Button 
                      onClick={() => handleOpenBooking(service)}
                      className={`w-full font-bold h-11 rounded-xl shadow-md hover:shadow-lg transition-all text-white ${
                        service.isWhatsApp
                          ? 'bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800'
                          : 'bg-gradient-to-r from-amber-700 via-amber-800 to-rose-800 hover:from-amber-800 hover:to-rose-900'
                      }`}
                    >
                      {service.isWhatsApp ? (
                        <>
                          <MessageCircle className="w-4 h-4 mr-2 fill-white" />
                          Consultar / Contratar Bono
                        </>
                      ) : (
                        <>
                          <CalendarDays className="w-4 h-4 mr-2" />
                          Pedir Cita Online
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* SECCIÓN DISCRETA Y ELEGANTE DE REDES SOCIALES Y UBICACIÓN */}
      <section className="bg-gradient-to-b from-amber-50/40 to-amber-100/30 dark:from-slate-900/60 dark:to-slate-950 py-8 border-t border-amber-200/40">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900/70 dark:text-amber-300/70 mb-4">
            Encuéntrame en Redes Sociales & Ubicación
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* UBICACIÓN */}
            <a 
              href="https://maps.app.goo.gl/jjvfQfMha33JFKVB9" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-full border border-amber-200/80 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-100/50 hover:border-amber-400 hover:scale-105 transition-all"
              title="Ver ubicación en Google Maps"
            >
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Ubicación</span>
            </a>

            {/* WHATSAPP */}
            <a 
              href="https://wa.me/34634432487?text=Hola%20Pako,%20quisiera%20consultar%20sobre%20tus%20masajes%20y%20citas" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-full border border-amber-200/80 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:border-emerald-400 hover:scale-105 transition-all"
              title="Escribir por WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>WhatsApp</span>
            </a>

            {/* INSTAGRAM */}
            <a 
              href="https://www.instagram.com/pako_garcia_quiromasajes" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-full border border-amber-200/80 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-pink-50 hover:border-pink-400 hover:scale-105 transition-all"
              title="Ver Instagram"
            >
              <Instagram className="w-4 h-4 text-pink-600" />
              <span>Instagram</span>
            </a>

            {/* TIKTOK */}
            <a 
              href="https://www.tiktok.com/@pako.garcia.quiro" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-full border border-amber-200/80 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:border-slate-400 hover:scale-105 transition-all"
              title="Ver TikTok"
            >
              <Video className="w-4 h-4 text-slate-800 dark:text-slate-200" />
              <span>TikTok</span>
            </a>

            {/* TELEGRAM */}
            <a 
              href="https://t.me/quiromasajescordoba" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-full border border-amber-200/80 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-50 hover:border-sky-400 hover:scale-105 transition-all"
              title="Ver Telegram"
            >
              <Send className="w-4 h-4 text-sky-500" />
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </section>

      {/* DIÁLOGO MODAL FLOTANTE CON LA AGENDA INTERACTIVA DE CAL.COM */}
      <Dialog open={!!selectedIframeUrl} onOpenChange={() => setSelectedIframeUrl(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden rounded-2xl border-amber-300/40">
          <DialogHeader className="p-4 bg-gradient-to-r from-amber-800 to-rose-900 text-white flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <DialogTitle className="text-lg font-bold font-headline text-white">
                Reserva Online: {selectedServiceTitle}
              </DialogTitle>
            </div>
          </DialogHeader>
          {selectedIframeUrl && (
            <div className="w-full h-full bg-white relative">
              <iframe 
                src={selectedIframeUrl}
                className="w-full h-full border-none"
                title={`Reserva de ${selectedServiceTitle}`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* BOTÓN FLOTANTE DE CONTACTO DIRECTO POR WHATSAPP */}
      <a
        href="https://wa.me/34634432487?text=Hola%20Pako,%20quisiera%20consultar%20sobre%20tus%20masajes%20y%20citas"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white p-3.5 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center gap-2 font-bold text-sm"
        title="Consultar por WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
        <span className="hidden sm:inline">¿Dudas? Escríbeme al WhatsApp</span>
      </a>

      {/* FOOTER CÁLIDO */}
      <footer className="bg-amber-950 text-amber-100 py-6 border-t border-amber-900 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-1.5">
          <p className="font-headline text-base font-bold text-amber-200">Pako García Quiromasajes · Gabinete de Bienestar</p>
          <p className="text-xs text-amber-300/70">Todas las reservas se confirman al instante y quedan agendadas en tiempo real.</p>
        </div>
      </footer>
    </div>
  );
}
