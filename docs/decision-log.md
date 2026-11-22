# Decision log

Formato: fecha · decisión · motivo · alternativas descartadas.

## V1 (22/11/2026)

### 1. Recomendación por reglas, no con un LLM
- **Decisión:** motor de reglas determinista (`RuleBasedRecommender`) con puntaje ponderado: formalidad 25 %, abrigo 25 %, lluvia 15 %, colores 20 %, repetición 15 %, y −15 puntos por regla rota.
- **Motivo:** la consigna pide no usar APIs pagas en V1. Además, las reglas son explicables (cada motivo sale de una regla concreta), testeables, gratis, funcionan sin conexión y no mandan datos a terceros.
- **Preparado para V2:** la UI depende solo de la interfaz `OutfitRecommender` (asíncrona). Un `LlmRecommender` va a implementar la misma interfaz y caer al motor de reglas si falla, tarda o devuelve algo inválido. El cambio se hace en un solo lugar: `getRecommender()`.
- **Descartado:** LLM en V1 (costo, latencia, explicaciones no verificables).

### 2. Datos solo en el navegador
- **Decisión:** metadatos en `localStorage`, fotos en IndexedDB (`idb-keyval`). Sin cuentas, base de datos ni servidor con datos personales.
- **Motivo:** privacidad por diseño. Fotos de ropa y hábitos de vestimenta son datos personales, y en algunos casos pueden revelar datos sensibles (religión, salud). Como el prototipo no los recolecta ni los guarda en servidores propios, reduce al mínimo las obligaciones que la Ley 18.331 (Uruguay) y la Ley 25.326 (Argentina) imponen a quien mantiene bases de datos personales (registro, consentimiento informado, derechos de acceso/rectificación/supresión, medidas de seguridad). Esto es una lectura del equipo, no un dictamen legal: si V2 suma cuentas o sincronización, hay que revisarlo con asesoría. El usuario puede borrar todo desde el perfil.
- **Costo aceptado:** no hay sincronización entre dispositivos y los datos se pierden si se borra el navegador (queda como "Próximamente").
- **Lo que sí sale del dispositivo:** coordenadas redondeadas (~1 km) o el nombre de la ciudad buscada, que pasan por nuestro route handler hacia Open-Meteo.
- **Fallback:** si el almacenamiento está bloqueado (modo incógnito estricto), la app funciona en memoria y lo avisa.

### 3. Open-Meteo como proveedor de clima
- **Decisión:** Open-Meteo (forecast + geocoding).
- **Motivo:** no requiere API key ni registro (sin secretos en V1), da pronóstico por hora (necesario para usar la mañana y la tarde) y probabilidad de precipitación, y el geocoding acepta `language=es`.
- **Términos revisados (22/11/2026):** uso no comercial, < 10.000 llamadas/día, 5.000/hora, 600/minuto, límite por IP; licencia CC BY 4.0 con link de atribución visible (está en el footer). Los términos advierten que en Vercel el límite puede alcanzarse antes por IPs compartidas.
- **Si el producto se vuelve comercial:** contratar el plan pago de Open-Meteo o cambiar de proveedor (el parser está aislado en `src/lib/weather/openMeteo.ts`).

### 4. Route handlers propios como proxy (`/api/weather`, `/api/geocode`)
- **Decisión:** el cliente nunca llama a Open-Meteo directamente.
- **Motivo:** un solo punto para timeout (4 s), validación de parámetros, cache y manejo de errores. También permite cambiar de proveedor o agregar una API key sin tocar el cliente.
- **Cache:** mapa en memoria por instancia (15 min clima, 24 h geocoding) + `Cache-Control: public, s-maxage=…` en respuestas exitosas, para que el CDN de Vercel también las sirva. Las coordenadas se redondean a 2 decimales (~1 km), así usuarios cercanos comparten cache y no se manda una ubicación más precisa de lo necesario. Los errores se responden con `no-store`.
- **Nota:** no pude verificar en esta sesión la documentación de Vercel sobre cómo trata `s-maxage` en funciones, porque el entorno bloqueaba vercel.com. Hay que confirmarlo mirando el header `x-vercel-cache` una vez desplegado. La cache en memoria funciona igual.

### 5. Temperatura de la mañana y de la tarde, no solo la actual
- **Decisión:** se usa la mínima entre 7 y 11 h (para decidir el abrigo) y la máxima entre 13 y 18 h (para la capa base), y la probabilidad de lluvia máxima entre 7 y 22 h.
- **Motivo:** el usuario elige la ropa a la mañana para todo el día. A las 7 puede hacer 9 °C y a las 15, 22 °C.

### 6. Fallback de clima manual
- **Decisión:** si el pronóstico falla, la app pide temperatura y lluvia a mano y sigue recomendando.
- **Motivo:** la función principal no puede depender de una API gratuita sin SLA. No se inventa una curva diaria: mañana y tarde usan el valor elegido.

### 7. Compresión de fotos en el cliente
- **Decisión:** redimensionar a 1024 px en el lado más largo y recomprimir a JPEG hasta ~400 KB con `<canvas>`, respetando la orientación EXIF.
- **Motivo:** fotos de celular de 3 a 12 MB llenarían IndexedDB y harían lenta la app. La foto nunca sale del dispositivo.

### 8. Ilustraciones SVG propias para el guardarropa de muestra
- **Decisión:** dibujos planos por tipo de prenda, coloreados según la prenda.
- **Motivo:** no usar fotos de terceros ni marcas (derechos de imagen y de marca). Se ve prolijo y la demo funciona desde el primer segundo.

### 9. Stack y UI
- **Decisión:** Next.js 16 (App Router, `create-next-app`), TypeScript estricto, Tailwind v4, componentes propios (sin shadcn/ui), íconos `lucide-react`, Vitest para la lógica.
- **Motivo:** la app necesita pocos componentes (sheet, toast, badges). Escribirlos fue más simple que sumar shadcn/ui y sus dependencias.
- **Estado:** `useSyncExternalStore` sobre stores persistentes chicos, sin librerías de estado.

### 10. Textos centralizados sin i18n
- **Decisión:** todos los textos en `src/copy/es-AR.ts`. Los motivos del recomendador son códigos estructurados que ese archivo convierte en frases.
- **Motivo:** se pueden revisar todos los textos juntos. Además, el motor queda libre de texto, lo que facilita los tests y el reemplazo por un LLM en V2.

### 11. Chat simulado por palabras clave
- **Decisión:** detección de palabras clave sin tildes, por palabra completa y con prioridad (evento formal > deporte > oficina > cena > casual).
- **Motivo:** muestra el flujo conversacional esperado sin costo de LLM. Está etiquetado como "Simulado".
