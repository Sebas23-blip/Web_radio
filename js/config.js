/**
 * config.js
 * -----------------------------------------------------------------------
 * TODA la configuración específica de tu emisora vive aquí.
 * No deberías necesitar tocar player.js, metadata.js ni main.js para
 * conectar esto a tu propio servidor Icecast: solo edita este archivo.
 *
 * ⚠️  PROBLEMA DE "MIXED CONTENT" (léelo antes de desplegar)
 * -----------------------------------------------------------------------
 * Vercel sirve tu sitio por HTTPS. Si tu Icecast está en HTTP plano
 * (http://tu-dominio.com:8000/stream), el navegador bloqueará —o al
 * menos, Chrome intentará auto-reescribir a HTTPS y la conexión fallará
 * silenciosamente— la petición de audio, porque una página HTTPS no
 * puede cargar contenido activo desde HTTP ("mixed content").
 *
 * No hay ningún truco de JavaScript que resuelva esto: la solución real
 * es servir Icecast también por HTTPS. Dos caminos típicos:
 *
 *   1) Poner un reverse proxy (Nginx/Caddy) delante de Icecast con
 *      certificado de Let's Encrypt, y apuntar STREAM_URL a esa URL
 *      https://stream.tu-dominio.com/radio.mp3
 *
 *   2) Activar SSL nativo de Icecast (icecast.xml -> <ssl>) si tu
 *      versión lo soporta.
 *
 * Mientras tanto, deja aquí ambas URLs. STREAM_URL_HTTPS es la que se
 * usará siempre que exista; STREAM_URL_HTTP queda solo como referencia
 * y para pruebas en un entorno donde el propio sitio corra también en
 * HTTP (por ejemplo, en tu máquina local con `vercel dev` en http://).
 */

const RADIO_CONFIG = {
  // --------------------------------------------------------------
  // 0) Invitación a la única sala de Discord de la radio.
  //    Copia aquí el enlace que genera Discord, por ejemplo:
  //    https://discord.gg/tu-invitacion
  // --------------------------------------------------------------
  DISCORD_INVITE_URL: "https://discord.gg/6jFUDMcCe",

  // --------------------------------------------------------------
  // 1) URL del stream de audio (lo que consume el <audio>)
  //    Reemplaza por el mount point real de tu Icecast.
  // --------------------------------------------------------------
  STREAM_URL_HTTPS: "https://tu-dominio-icecast.com/stream", // ← reemplaza esto
  STREAM_URL_HTTP: "http://tu-dominio-icecast.com:8000/stream", // solo referencia / desarrollo local

  // --------------------------------------------------------------
  // 2) URL del endpoint de metadatos de Icecast (status-json.xsl)
  //    Normalmente vive en la raíz del mismo servidor Icecast.
  // --------------------------------------------------------------
  STATUS_URL_HTTPS: "https://tu-dominio-icecast.com/status-json.xsl", // ← reemplaza esto
  STATUS_URL_HTTP: "http://tu-dominio-icecast.com:8000/status-json.xsl",

  // --------------------------------------------------------------
  // 3) Nombre exacto del "mount" tal como aparece en status-json.xsl
  //    (fuente.listenurl termina en /stream, /radio.mp3, etc.)
  //    Se usa para identificar la fuente correcta si el servidor
  //    Icecast tiene varios mounts activos.
  // --------------------------------------------------------------
  MOUNT_POINT: "/stream", // ← ajusta si tu mount se llama distinto

  // --------------------------------------------------------------
  // 4) Frecuencia de sondeo de metadatos (ms). 10000 = 10 segundos,
  //    tal como pide Icecast como buena práctica para no saturarlo.
  // --------------------------------------------------------------
  METADATA_POLL_INTERVAL: 10000,

  // --------------------------------------------------------------
  // 5) Textos de respaldo cuando no hay datos todavía / hay error
  // --------------------------------------------------------------
  FALLBACK_TITLE: "Radio Universitaria — Transmisión en vivo",
  OFFLINE_TITLE: "La transmisión no está disponible en este momento",
};

/**
 * Devuelve la URL de audio que realmente se debe usar, evitando mixed
 * content: si el sitio se sirve por HTTPS, se fuerza STREAM_URL_HTTPS
 * sin importar lo que diga STREAM_URL_HTTP.
 */
function getStreamUrl() {
  const pageIsSecure = window.location.protocol === "https:";
  return pageIsSecure ? RADIO_CONFIG.STREAM_URL_HTTPS : RADIO_CONFIG.STREAM_URL_HTTP;
}

/** Misma lógica, para el endpoint de metadatos. */
function getStatusUrl() {
  const pageIsSecure = window.location.protocol === "https:";
  return pageIsSecure ? RADIO_CONFIG.STATUS_URL_HTTPS : RADIO_CONFIG.STATUS_URL_HTTP;
}
