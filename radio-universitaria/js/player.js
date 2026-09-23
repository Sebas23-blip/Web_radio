/**
 * player.js
 * -----------------------------------------------------------------------
 * Controla el elemento <audio> oculto a través del botón "dial" grande.
 * No usamos <audio controls>: toda la UI (play/pause/loading, animación
 * de "en vivo") la dibuja el CSS reaccionando a atributos data-* que
 * este archivo va cambiando.
 */

const RadioPlayer = (() => {
  // Referencias al DOM. Se resuelven en init() para asegurar que el
  // documento ya está cargado cuando este módulo se usa.
  let audioEl;
  let dialButton;
  let hintEl;

  let isPlaying = false;
  let isLoading = false;

  /**
   * Pinta el estado actual (playing / loading / idle) en el DOM.
   * El CSS hace el resto (colores, animaciones) leyendo estos atributos.
   */
  function render() {
    dialButton.dataset.playing = String(isPlaying);
    dialButton.dataset.state = isLoading ? "loading" : "idle";
    dialButton.setAttribute("aria-pressed", String(isPlaying));
    dialButton.setAttribute(
      "aria-label",
      isPlaying ? "Pausar transmisión en vivo" : "Reproducir transmisión en vivo"
    );

    if (isLoading) {
      hintEl.textContent = "Conectando con la transmisión…";
    } else if (isPlaying) {
      hintEl.textContent = "En vivo — toca para pausar";
    } else {
      hintEl.textContent = "Toca para escuchar en vivo";
    }

    // El mini-ecualizador de "now playing" también reacciona a isPlaying.
    const nowPlayingEl = document.getElementById("nowPlaying");
    if (nowPlayingEl) {
      nowPlayingEl.dataset.playing = String(isPlaying);
    }
  }

  /**
   * Punto clave del reproductor: cómo iniciar la reproducción.
   *
   * IMPORTANTE — manejo del búfer en vivo:
   * Un stream de Icecast es una conexión continua. Si el usuario pausa
   * y el navegador simplemente "resume" el mismo <audio>, en muchos
   * navegadores el audio queda apuntando al punto donde se quedó el
   * búfer (no al instante actual de la transmisión), o directamente el
   * audio queda "congelado" y no vuelve a sonar bien.
   *
   * La solución estándar para radios en vivo es, en cada Play:
   *   1) Reasignar audio.src (aunque sea al mismo valor) para forzar
   *      al navegador a abrir una conexión NUEVA con el servidor.
   *   2) Llamar a audio.load() para descartar cualquier búfer previo.
   *   3) Recién ahí, audio.play().
   * Así el oyente siempre engancha el audio en vivo real, no un
   * fragmento cacheado.
   */
  async function play() {
    if (isLoading || isPlaying) return;

    isLoading = true;
    render();

    try {
      // 1) Recarga forzada de la fuente para evitar caché / desincronía.
      //    Usamos un parámetro anti-caché (_=timestamp) para asegurar
      //    que ni siquiera un proxy intermedio nos sirva un chunk viejo.
      const freshUrl = buildFreshStreamUrl();
      audioEl.src = freshUrl;

      // 2) Descarta cualquier búfer previo del elemento <audio>.
      audioEl.load();

      // 3) Reproduce. play() devuelve una Promise que puede rechazar
      //    (autoplay bloqueado, red caída, formato no soportado, etc.).
      await audioEl.play();

      isPlaying = true;
    } catch (err) {
      console.error("[RadioPlayer] No se pudo iniciar la reproducción:", err);
      isPlaying = false;
      hintEl.textContent = "No se pudo conectar. Intenta de nuevo.";
    } finally {
      isLoading = false;
      render();
    }
  }

  /**
   * Pausar es más delicado de lo que parece en un stream en vivo: no
   * basta con audio.pause(). Si dejamos el <audio> con el mismo src,
   * el navegador sigue el buffering en segundo plano y, al reanudar,
   * el oyente escucharía el punto exacto donde pausó (audio "cacheado"),
   * no el presente real de la transmisión.
   *
   * Por eso, al pausar:
   *   1) audio.pause()
   *   2) Vaciamos el src (audio.removeAttribute('src') + load()) para
   *      cortar la conexión con Icecast del todo. La próxima vez que
   *      el usuario dé Play, play() de arriba abre una conexión 100%
   *      nueva y por lo tanto sincronizada con el presente.
   */
  function pause() {
    if (!isPlaying) return;

    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load(); // limpia el búfer interno del navegador

    isPlaying = false;
    isLoading = false;
    render();
  }

  /**
   * Construye la URL del stream añadiendo un parámetro que cambia en
   * cada intento de reproducción, para evitar que algún caché (CDN,
   * navegador, proxy corporativo) devuelva un fragmento de audio ya
   * usado en vez de conectar en vivo con Icecast.
   */
  function buildFreshStreamUrl() {
    const base = getStreamUrl(); // definido en config.js
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}_=${Date.now()}`;
  }

  function toggle() {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }

  /**
   * Si la conexión de streaming se corta sola (error de red, el
   * servidor reinicia el mount, etc.), el navegador dispara "error" o
   * "stalled" en el <audio>. Ante eso, volvemos al estado "pausado"
   * en vez de dejar un botón de Play que en realidad no está sonando,
   * para no confundir al oyente.
   */
  function handleStreamDrop() {
    if (!isPlaying) return;
    console.warn("[RadioPlayer] La transmisión se interrumpió.");
    pause();
    hintEl.textContent = "Se perdió la conexión. Toca para reintentar.";
  }

  function init() {
    audioEl = document.getElementById("audioPlayer");
    dialButton = document.getElementById("playButton");
    hintEl = document.getElementById("playHint");

    dialButton.addEventListener("click", toggle);

    // Errores de red / stream caído.
    audioEl.addEventListener("error", handleStreamDrop);
    audioEl.addEventListener("stalled", handleStreamDrop);

    render();
  }

  // API pública del módulo
  return {
    init,
    play,
    pause,
    toggle,
    isPlaying: () => isPlaying,
  };
})();
