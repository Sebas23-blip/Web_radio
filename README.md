# Radio Universitaria — Frontend

Sitio estático (HTML + CSS + Vanilla JS, sin frameworks) para una radio
universitaria en línea, con Icecast2 como servidor de streaming y Mixxx
como software de emisión. Pensado para desplegarse en Vercel.

## Estructura del proyecto

```
radio-universitaria/
├── index.html            # Estructura de la página (sin <audio controls>)
├── css/
│   └── styles.css        # Estilos, mobile-first, tema oscuro
├── js/
│   ├── config.js          # ⚙️ ÚNICO archivo que normalmente debes editar
│   ├── player.js          # Lógica de Play/Pausa y manejo del búfer en vivo
│   ├── metadata.js        # Polling a /status-json.xsl cada 10s
│   └── main.js             # Inicialización
├── assets/                # Logo / favicon / imágenes (opcional)
├── vercel.json
└── README.md
```

## 1. Configura tu servidor (`js/config.js`)

Edita solo estas variables:

```js
STREAM_URL_HTTPS:  "https://stream.tu-dominio.com/stream",
STATUS_URL_HTTPS:  "https://stream.tu-dominio.com/status-json.xsl",
MOUNT_POINT:       "/stream",
```

## 2. El problema de "Mixed Content" (importante)

Vercel sirve tu sitio por **HTTPS**. Si tu Icecast solo tiene **HTTP**,
el navegador bloqueará la conexión de audio (contenido mixto) y el
reproductor no funcionará, aunque el código esté perfecto.

No existe una solución en JavaScript para esto: necesitas que Icecast
también hable HTTPS. Dos formas comunes de lograrlo:

- **Reverse proxy con Nginx o Caddy** delante de Icecast, con un
  certificado gratuito de Let's Encrypt. Es la opción más común y
  robusta (Caddy lo hace casi automático).
- **SSL nativo de Icecast** (bloque `<ssl>` en `icecast.xml`), si tu
  versión de Icecast lo soporta.

Mientras tanto, `STREAM_URL_HTTP` / `STATUS_URL_HTTP` quedan en
`config.js` solo como referencia para pruebas locales; en producción
sobre Vercel siempre se usan las variables `_HTTPS`.

## 3. Mixxx → Icecast

En Mixxx, en **Preferencias → Transmisión (Live Broadcasting)**:
- Tipo: Icecast 2
- Host / puerto / mount: los mismos que configuraste en Icecast.
- Activa el envío de metadatos ("Enable metadata") para que el título
  de la canción llegue a `status-json.xsl` y el sitio lo muestre.

## 4. Desplegar en Vercel

```bash
npm i -g vercel   # si no lo tienes
cd radio-universitaria
vercel             # sigue las instrucciones, o conecta el repo desde el dashboard
```

Al ser un sitio 100% estático, no necesita build step ni configuración
adicional en Vercel más allá de apuntar el proyecto a esta carpeta.

## Notas de implementación

- **No se usa `<audio controls>`**: el `<audio>` está oculto y todo el
  control pasa por el botón circular ("dial"), ver `js/player.js`.
- **Sincronía en vivo**: cada vez que el usuario da Play, se reasigna
  `audio.src` (con un parámetro anti-caché) y se llama a `audio.load()`
  antes de `audio.play()`, para evitar que el oyente escuche audio
  cacheado y quede desincronizado del directo. Al pausar, se limpia el
  `src` por completo para cortar la conexión con Icecast.
- **Metadatos**: `js/metadata.js` hace `fetch` a `status-json.xsl` cada
  10 segundos (pausa el sondeo si la pestaña pierde el foco, para no
  gastar datos/batería sin necesidad).
#Web_radio
