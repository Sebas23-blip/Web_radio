/**
 * main.js
 * -----------------------------------------------------------------------
 * Punto de entrada: espera a que el DOM esté listo y arranca los dos
 * módulos independientes (reproductor y metadatos).
 */

document.addEventListener("DOMContentLoaded", () => {
  RadioPlayer.init();
  RadioMetadata.init();
  initDiscordInvite();

  // Año dinámico en el footer.
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

function initDiscordInvite() {
  const linkEl = document.getElementById("discordLink");
  const descriptionEl = document.getElementById("discordDescription");
  if (!linkEl || !descriptionEl) return;

  const inviteUrl = RADIO_CONFIG.DISCORD_INVITE_URL.trim();
  if (inviteUrl) {
    linkEl.href = inviteUrl;
    return;
  }

  linkEl.removeAttribute("href");
  linkEl.setAttribute("aria-disabled", "true");
  linkEl.tabIndex = -1;
  linkEl.textContent = "Sala no configurada";
  descriptionEl.textContent = "Añade el enlace de invitación de Discord en js/config.js para habilitar la sala.";
}
