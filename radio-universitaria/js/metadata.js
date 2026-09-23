/**
 * metadata.js
 * -----------------------------------------------------------------------
 * Consulta periódicamente el endpoint /status-json.xsl que expone
 * Icecast2 para leer qué canción/programa está sonando (el campo
 * "title" que llega vía los metadatos de Mixxx) y lo muestra en pantalla.
 *
 * Icecast puede devolver la forma de "source" como un objeto único
 * (un solo mount activo) o como un arreglo (varios mounts). Este
 * archivo contempla ambos casos.
 */

const RadioMetadata = (() => {
  let titleEl;
  let liveBadgeEl;
  let liveBadgeTextEl;
  let pollTimer = null;

  /**
   * Recorre la respuesta de Icecast y devuelve el objeto "source"
   * correspondiente a nuestro MOUNT_POINT (definido en config.js).
   * Si solo hay un mount, se usa ese sin más.
   */
  function findSource(icecastJson) {
    const icestats = icecastJson && icecastJson.icestats;
    if (!icestats || !icestats.source) return null;

    const sources = Array.isArray(icestats.source) ? icestats.source : [icestats.source];

    if (sources.length === 1) return sources[0];

    // Con varios mounts, buscamos el que coincide con nuestro MOUNT_POINT.
    const match = sources.find((s) => (s.listenurl || "").includes(RADIO_CONFIG.MOUNT_POINT));
    return match || sources[0];
  }

  /** Actualiza el texto de "sonando ahora" en pantalla. */
  function renderTitle(text) {
    if (!titleEl) return;
    titleEl.textContent = text;
    titleEl.setAttribute("title", text); // tooltip nativo si el texto se trunca
  }

  /** Actualiza la pastilla "EN VIVO" del header según haya o no oyentes/fuente activa. */
  function renderLiveBadge(online) {
    if (!liveBadgeEl) return;
    liveBadgeEl.dataset.state = online ? "live" : "offline";
    liveBadgeTextEl.textContent = online ? "En vivo" : "Fuera de línea";
  }

  /**
   * Petición fetch al status-json.xsl de Icecast.
   * Se ejecuta cada RADIO_CONFIG.METADATA_POLL_INTERVAL ms (10s por defecto).
   */
  async function fetchMetadata() {
    try {
      const response = await fetch(getStatusUrl(), {
        // Evita que el navegador reutilice una respuesta cacheada:
        // queremos el estado real del servidor en cada sondeo.
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Icecast respondió con status ${response.status}`);
      }

      const data = await response.json();
      const source = findSource(data);

      if (!source) {
        // Icecast está arriba, pero no hay ningún mount activo
        // (el locutor todavía no conectó Mixxx).
        renderTitle(RADIO_CONFIG.OFFLINE_TITLE);
        renderLiveBadge(false);
        return;
      }

      // Icecast suele exponer el título de la canción actual en
      // "title" (a veces sólo viene "yp_currently_playing" según la
      // versión). Probamos ambos por compatibilidad.
      const nowPlaying = source.title || source.yp_currently_playing;

      renderTitle(nowPlaying && nowPlaying.trim() ? nowPlaying : RADIO_CONFIG.FALLBACK_TITLE);
      renderLiveBadge(true);
    } catch (err) {
      console.error("[RadioMetadata] Error obteniendo metadatos:", err);
      renderTitle(RADIO_CONFIG.FALLBACK_TITLE);
      renderLiveBadge(false);
    }
  }

  function startPolling() {
    // Primer sondeo inmediato, para no esperar 10s en la primera carga.
    fetchMetadata();

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(fetchMetadata, RADIO_CONFIG.METADATA_POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  function init() {
    titleEl = document.getElementById("nowPlayingTitle");
    liveBadgeEl = document.getElementById("liveBadge");
    liveBadgeTextEl = document.getElementById("liveBadgeText");

    startPolling();

    // Buena práctica: pausar el sondeo si la pestaña no está visible,
    // para no gastar batería/datos del oyente sin necesidad, y
    // reanudarlo al volver.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    });
  }

  return { init, fetchMetadata };
})();
