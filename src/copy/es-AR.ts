/**
 * Every user-facing string lives here (Spanish, Río de la Plata, voseo).
 * Code stays in English; review all copy in one place.
 */
import type { Reason, RuleViolation } from "@/types/outfit";
import type { ColorId, GarmentCategory, Occasion, Warmth } from "@/types/wardrobe";

const lcFirst = (s: string) => (s ? s[0].toLocaleLowerCase("es-AR") + s.slice(1) : s);
const days = (n: number) => (n === 1 ? "1 día" : `${n} días`);

export const occasionLabels: Record<Occasion, string> = {
  office: "Oficina",
  casual: "Casual",
  dinner: "Cena",
  sport: "Deporte",
  formal: "Evento formal",
};

/** Used inside sentences: "para la oficina". */
const occasionInSentence: Record<Occasion, string> = {
  office: "la oficina",
  casual: "un plan casual",
  dinner: "una cena",
  sport: "hacer deporte",
  formal: "un evento formal",
};

export const categoryLabels: Record<GarmentCategory, { singular: string; plural: string }> = {
  top: { singular: "Parte de arriba", plural: "Partes de arriba" },
  bottom: { singular: "Parte de abajo", plural: "Partes de abajo" },
  outerwear: { singular: "Abrigo", plural: "Abrigos" },
  footwear: { singular: "Calzado", plural: "Calzado" },
  onePiece: { singular: "Prenda entera", plural: "Prendas enteras" },
};

export const warmthLabels: Record<Warmth, string> = {
  light: "Liviano",
  medium: "Medio",
  warm: "Abrigado",
};

export const colorLabels: Record<ColorId, string> = {
  black: "Negro",
  white: "Blanco",
  gray: "Gris",
  navy: "Azul marino",
  beige: "Beige",
  camel: "Camel",
  brown: "Marrón",
  denim: "Denim",
  olive: "Verde oliva",
  red: "Rojo",
  burgundy: "Bordó",
  green: "Verde",
  lightBlue: "Celeste",
  yellow: "Amarillo",
  pink: "Rosa",
  orange: "Naranja",
  purple: "Violeta",
};

export const formalityLabels: Record<number, string> = {
  1: "Muy informal",
  2: "Informal",
  3: "Intermedia",
  4: "Formal",
  5: "Muy formal",
};

export function weatherCodeLabel(code: number | undefined): string {
  if (code === undefined) return "";
  if (code === 0) return "Despejado";
  if (code <= 2) return "Algo nublado";
  if (code === 3) return "Nublado";
  if (code === 45 || code === 48) return "Niebla";
  if (code >= 51 && code <= 57) return "Llovizna";
  if (code >= 61 && code <= 67) return "Lluvia";
  if (code >= 71 && code <= 77) return "Nieve";
  if (code >= 80 && code <= 82) return "Chaparrones";
  if (code >= 85 && code <= 86) return "Nevadas";
  if (code >= 95) return "Tormenta";
  return "";
}

export function formatReason(r: Reason): string {
  switch (r.code) {
    case "formalityMatch":
      return `Todas las prendas tienen la formalidad justa para ${occasionInSentence[r.occasion]}.`;
    case "addedOuterwearCold":
      return `Sumamos ${lcFirst(r.garment)} porque a las ${r.hour} h hacen ${r.temperature} °C.`;
    case "addedOuterwearRain":
      return `Sumamos ${lcFirst(r.garment)}: hay ${r.probability} % de probabilidad de lluvia.`;
    case "skippedOuterwearWarm":
      return `No hace falta abrigo: a la mañana ya hay ${r.temperature} °C.`;
    case "lightLayersHeat":
      return `Elegimos algo liviano: a las ${r.hour} h llega a ${r.temperature} °C.`;
    case "warmLayersCold":
      return `Priorizamos una prenda abrigada: a las ${r.hour} h hay ${r.temperature} °C.`;
    case "avoidedNonRainFootwear":
      return `Evitamos ${lcFirst(r.garment)}: hay ${r.probability} % de probabilidad de lluvia.`;
    case "rainFriendlyFootwear":
      return `${r.garment} aguanta la lluvia (${r.probability} % de probabilidad).`;
    case "neutralBase":
      return "Base de colores neutros: combina sin pensarlo.";
    case "accentOnNeutral":
      return `${r.garment} pone el color sobre una base neutra.`;
    case "sameColorFamily":
      return "Los colores son de la misma gama y van bien juntos.";
    case "goodContrast":
      return "Los colores contrastan bien entre sí.";
    case "notWornRecently":
      return "No lo guardaste en los últimos días.";
    case "freeText":
      return r.text;
  }
}

export function formatViolation(v: RuleViolation): string {
  switch (v.rule) {
    case "formality":
      return `${v.garment} no tiene la formalidad ideal para ${occasionInSentence[v.occasion]}.`;
    case "warmth":
      return v.direction === "tooWarm"
        ? `${v.garment} puede darte calor: a las ${v.hour} h hay ${v.temperature} °C.`
        : `${v.garment} puede quedarte liviano: a las ${v.hour} h hay ${v.temperature} °C.`;
    case "outerwear":
      return v.needed === "any"
        ? "Hoy conviene llevar abrigo y no encontramos uno apto para esta ocasión."
        : `Tu abrigo más adecuado puede quedarse corto: a las ${v.hour} h hay ${v.temperature} °C.`;
    case "rain":
      return `${v.garment} no es ideal con ${v.probability} % de probabilidad de lluvia, pero no encontramos otro calzado apto.`;
    case "color":
      return v.kind === "clash"
        ? "Los colores compiten un poco entre sí."
        : "Junta muchos colores a la vez.";
    case "repetition":
      return v.daysAgo === 0
        ? "Ya guardaste este conjunto hoy."
        : `Ya guardaste este conjunto hace ${days(v.daysAgo)}.`;
  }
}

export const copy = {
  appName: "Smart Closet AI",
  tagline: "Tu asistente de estilo para salir a tiempo.",

  nav: {
    studio: "Estudio",
    wardrobe: "Guardarropa",
    saved: "Guardados",
    shopping: "Compras",
  },

  status: {
    working: "Funciona",
    simulated: "Simulado",
    comingSoon: "Próximamente",
  },

  common: {
    cancel: "Cancelar",
    save: "Guardar",
    delete: "Borrar",
    edit: "Editar",
    close: "Cerrar",
    retry: "Reintentar",
    loading: "Cargando…",
  },

  storage: {
    unavailable:
      "Tu navegador no nos deja guardar datos (¿modo incógnito?). Podés usar la app, pero lo que cargues se pierde al cerrar la pestaña.",
    photosUnavailable:
      "No podemos guardar fotos en este navegador. Las vas a ver solo durante esta visita.",
  },

  weather: {
    title: "El clima de hoy",
    loading: "Buscando el clima…",
    now: "Ahora",
    minMax: (min: number, max: number) => `Mín. ${min}° · Máx. ${max}°`,
    rain: (p: number) => `${p} % lluvia`,
    morningAfternoon: (mh: number, mt: number, ah: number, at: number) =>
      `${mh} h: ${mt}° · ${ah} h: ${at}°`,
    currentLocation: "Tu ubicación",
    defaultLocationNote: "Usamos Buenos Aires porque no pudimos acceder a tu ubicación.",
    changeCity: "Cambiar ciudad",
    useMyLocation: "Usar mi ubicación",
    searchPlaceholder: "Buscá tu ciudad",
    searchButton: "Buscar",
    searching: "Buscando…",
    tooShort: "Escribí al menos 2 letras.",
    cityNotFound: (q: string) => `No encontramos "${q}". Probá con otro nombre o sumá el país (por ejemplo, "Rosario, Argentina").`,
    searchFailed: "No pudimos buscar ciudades ahora. Probá de nuevo en un rato.",
    errorTitle: "No pudimos traer el clima",
    errorBody: "Contanos cómo está el día y seguimos igual.",
    manualTitle: "Clima manual",
    manualTemperature: "Temperatura",
    manualRain: "¿Llueve o puede llover?",
    yes: "Sí",
    no: "No",
    manualActive: "Estás usando un clima cargado a mano.",
    backToLive: "Volver al pronóstico",
    setManually: "Cargarlo a mano",
    attribution: "Datos del clima: Open-Meteo.com",
  },

  studio: {
    eyebrow: "Estudio",
    title: "¿Qué me pongo hoy?",
    subtitle: "Elegí la ocasión y armamos un conjunto con tu ropa y el clima del día.",
    occasionLabel: "¿A dónde vas?",
    generate: "Armame un conjunto",
    tryAnother: "Probá otra",
    save: "Guardar conjunto",
    saved: "¡Guardado!",
    savedToast: "Guardamos el conjunto en Guardados.",
    share: "Compartir",
    whyTitle: "Por qué este conjunto",
    match: (score: number) => `${score} % de coincidencia`,
    bestEffortTitle: "Ningún conjunto cumple todas las reglas",
    bestEffortBody: "Este es el mejor posible con lo que tenés. Lo que no se cumple:",
    allShown: "Ya viste todas las opciones. Volvemos a la primera.",
    staleHint: "Cambiaste el clima o tu ropa. Tocá \"Armame un conjunto\" para actualizar.",
    optionCounter: (n: number, total: number) => `Opción ${n} de ${total}`,
    usingSample: "Estás usando el guardarropa de muestra.",
    usingMine: "Estás usando tu ropa.",
    switchWardrobe: "Cambiar",
    pieceLabels: {
      top: "Arriba",
      bottom: "Abajo",
      onePiece: "Prenda entera",
      outerwear: "Abrigo",
      footwear: "Calzado",
    },
    chat: {
      label: "Contame a dónde vas hoy",
      placeholder: "Contame a dónde vas hoy…",
      send: "Entendido",
      detected: (occasion: string, keyword: string) =>
        `Entendimos "${keyword}": elegimos ${occasion}.`,
      notDetected:
        "No te entendimos. Por ahora solo reconocemos palabras como oficina, cena, gym o casamiento. Elegí la ocasión abajo.",
      notice:
        "Por ahora solo detectamos palabras clave. El asistente conversacional con IA llega pronto.",
    },
  },

  coldStart: {
    title: "Te faltan prendas para armar un conjunto",
    body: (occasion: string) => `Para ${occasion} necesitamos al menos:`,
    missingItem: (category: string) => `${category} apta para esta ocasión`,
    missingFootwear: "Calzado apto para esta ocasión",
    hint: "También podés tener una prenda entera (como un vestido) en lugar de arriba y abajo.",
    useSample: "Usar el guardarropa de muestra",
    addGarment: "Agregar prendas",
  },

  wardrobe: {
    eyebrow: "Guardarropa",
    title: "Tu ropa",
    sourceSample: "De muestra",
    sourceMine: "Mi ropa",
    sampleNote: "Un guardarropa de ejemplo para probar la app. Las ilustraciones no son fotos reales.",
    all: "Todo",
    add: "Agregar prenda",
    empty: "Todavía no cargaste prendas.",
    emptyHint: "Agregá al menos una parte de arriba, una de abajo y un calzado para recibir conjuntos.",
    emptyFiltered: "No hay prendas en esta categoría.",
    count: (n: number) => (n === 1 ? "1 prenda" : `${n} prendas`),
    sampleReadOnly: "Las prendas de muestra no se pueden editar. Pasá a \"Mi ropa\" para cargar las tuyas.",
    deleteConfirm: (name: string) => `¿Borrar "${name}"? No se puede deshacer.`,
    deleted: "Prenda borrada.",
    rainFriendly: "Apta para lluvia",
    notRainFriendly: "No apta para lluvia",
  },

  garmentForm: {
    addTitle: "Agregar prenda",
    editTitle: "Editar prenda",
    photo: "Foto",
    takePhoto: "Sacar o elegir foto",
    changePhoto: "Cambiar foto",
    removePhoto: "Quitar foto",
    processing: "Optimizando la foto…",
    photoCompressed: (kb: number) => `Foto optimizada (${kb} KB).`,
    photoNotImage: "Ese archivo no es una imagen. Probá con una foto JPG o PNG.",
    photoUnreadable: "No pudimos leer esa foto. Probá con otra (JPG o PNG).",
    aiButton: "Catalogar con IA",
    aiNote: "En la próxima versión, la IA va a completar estos datos a partir de la foto.",
    name: "Nombre",
    namePlaceholder: "Ej.: Camisa blanca de lino",
    nameRequired: "Poné un nombre para reconocerla.",
    category: "Categoría",
    color: "Color principal",
    warmth: "Abrigo",
    formality: "Formalidad",
    occasions: "Ocasiones aptas",
    occasionsRequired: "Elegí al menos una ocasión.",
    rainFriendly: "¿Apta para lluvia?",
    rainHint: "Por ejemplo: cuero, botas de lluvia o campera impermeable.",
    yes: "Sí",
    no: "No",
    save: "Guardar prenda",
    saved: "Prenda guardada.",
    updated: "Cambios guardados.",
  },

  saved: {
    eyebrow: "Guardados",
    title: "Tus conjuntos",
    empty: "Todavía no guardaste conjuntos.",
    emptyHint: "Armá uno en el Estudio y tocá \"Guardar conjunto\".",
    goToStudio: "Ir al Estudio",
    manualWeather: "clima manual",
    deleted: "Conjunto borrado.",
    deleteLabel: "Borrar conjunto",
  },

  shopping: {
    eyebrow: "Compras",
    title: "Asistente de compras por talle, color y presupuesto",
    lines: [
      "Contanos tu talle, los colores que te quedan bien y cuánto querés gastar.",
      "Te vamos a sugerir prendas que combinen con lo que ya tenés, para comprar menos y mejor.",
    ],
    notify: "Avisame cuando esté",
    notifyToast: "¡Gracias! Esta función todavía no existe; tu interés no se guarda en ningún lado.",
  },

  profile: {
    open: "Perfil y cuenta",
    title: "Tu perfil",
    login: "Iniciar sesión",
    sync: "Sincronizar entre dispositivos",
    avatar: "Avatar con tus medidas",
    avatarNote: "Cargá tus medidas y mirá cómo te quedan los conjuntos.",
    loginNote: "Hoy todo queda guardado solo en este navegador.",
    about: "Sobre este prototipo",
    clearData: "Borrar mis datos de este navegador",
    clearConfirm: "¿Borrar todas tus prendas, fotos y conjuntos guardados de este navegador?",
    cleared: "Borramos tus datos de este navegador.",
  },

  share: {
    toast: "Compartir conjuntos llega en una próxima versión.",
  },

  about: {
    eyebrow: "Sobre este prototipo",
    title: "Qué funciona, qué está simulado y qué viene",
    intro:
      "Smart Closet AI V1 es un prototipo de un proyecto de MBA (Product, Technology & Operations 4.0, UCEMA). Cada función está etiquetada con su estado.",
    legendTitle: "Cómo leer las etiquetas",
    legend: {
      working: "Funciona de verdad con tus datos.",
      simulated: "Se ve como la versión final, pero por dentro es una versión simple.",
      comingSoon: "Es una idea visible para mostrar hacia dónde va el producto. No hace nada todavía.",
    },
    privacyTitle: "Tus datos",
    privacy:
      "No hay cuentas ni servidores con tus datos: tus prendas, fotos y conjuntos quedan solo en este navegador. Para el clima enviamos tu ubicación aproximada (redondeada a ~1 km) a Open-Meteo a través de nuestro servidor.",
    back: "Volver",
    capabilities: [
      { status: "working", name: "Clima del día", detail: "Pronóstico de Open-Meteo según tu ubicación o la ciudad que elijas, con cache de 15 minutos." },
      { status: "working", name: "Buscador de ciudades", detail: "Geocoding de Open-Meteo. Si no damos con tu ubicación, usamos Buenos Aires." },
      { status: "working", name: "Clima manual", detail: "Si el pronóstico falla, cargás temperatura y lluvia a mano y la recomendación sigue andando." },
      { status: "working", name: "Armame un conjunto", detail: "Motor de reglas: formalidad, abrigo según la mañana y la tarde, lluvia, colores y no repetir lo que guardaste esta semana." },
      { status: "working", name: "Explicación del conjunto", detail: "Cada sugerencia dice por qué se eligió y qué regla no se cumplió, si hay alguna." },
      { status: "working", name: "Probá otra", detail: "Muestra la siguiente mejor opción sin repetir." },
      { status: "working", name: "Guardarropa", detail: "Guardarropa de muestra y carga de tu ropa con foto, filtros, edición y borrado." },
      { status: "working", name: "Conjuntos guardados", detail: "Con fecha, ocasión y clima del día. Se pueden borrar." },
      { status: "simulated", name: "Chat \"Contame a dónde vas\"", detail: "Solo detecta palabras clave para elegir la ocasión. No hay IA conversacional." },
      { status: "simulated", name: "Prendas de muestra", detail: "Ilustraciones generadas por tipo de prenda y color, no fotos reales." },
      { status: "comingSoon", name: "Catalogar con IA", detail: "La IA completará los datos de la prenda a partir de la foto." },
      { status: "comingSoon", name: "Recomendación con IA", detail: "Un modelo de lenguaje con respaldo en el motor de reglas actual." },
      { status: "comingSoon", name: "Asistente de compras", detail: "Sugerencias por talle, color y presupuesto." },
      { status: "comingSoon", name: "Avatar con tus medidas", detail: "Probar conjuntos sobre un avatar." },
      { status: "comingSoon", name: "Cuenta y sincronización", detail: "Iniciar sesión y tener tu ropa en todos tus dispositivos." },
      { status: "comingSoon", name: "Compartir conjunto", detail: "Mandar un conjunto por WhatsApp o redes." },
    ] as const,
  },

  footer: {
    about: "Sobre este prototipo",
    project: "Prototipo V1 · MBA UCEMA",
  },
};
