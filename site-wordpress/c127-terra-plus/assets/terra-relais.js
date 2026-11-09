/* Cercle 127 — relais depuis la lecture de la main : la conversation d'une Sœur s'ouvre avec le message préparé. */
(function () {
  'use strict';
  var h = null;
  try { h = JSON.parse(sessionStorage.getItem('c127_palm_talk') || 'null'); } catch (e) {}
  if (!h || !h.to || Date.now() - (h.at || 0) > 30 * 60 * 1000) return;
  // La conversation s'initialise après le chargement et peut vider sa zone de texte : on attend, puis on vérifie.
  function tryFill(n, check) {
    var chat = document.querySelector('.oschat--' + h.to), ta = chat && chat.querySelector('textarea');
    if (!ta) { if (n < 25) setTimeout(function () { tryFill(n + 1, check); }, 200); return; }
    if (!ta.value) { ta.value = h.text || ''; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    if (!check) { setTimeout(function () { tryFill(0, true); }, 1200); }
    else { try { sessionStorage.removeItem('c127_palm_talk'); } catch (e) {} }
    var form = ta.closest('form');
    if (form && !chat.querySelector('.c127-relais')) {
      var note = document.createElement('p'); note.className = 'c127-relais';
      note.textContent = 'Tu viens de ta lecture de la main avec Terra. Ton message est prêt : complète-le, puis envoie-le.';
      form.parentNode.insertBefore(note, form);
    }
    if (check) setTimeout(function () { chat.scrollIntoView({ behavior: 'smooth', block: 'start' }); ta.focus({ preventScroll: true }); try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {} }, 200);
  }
  function start() { setTimeout(function () { tryFill(0, false); }, 600); }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
