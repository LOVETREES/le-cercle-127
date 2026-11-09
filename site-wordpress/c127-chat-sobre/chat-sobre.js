/* Hauteur progressive du champ de saisie (aucun autre comportement modifié). */
(function(){
  function fit(t){t.style.height='auto';t.style.height=Math.min(t.scrollHeight,160)+'px';}
  function init(){
    document.querySelectorAll('.oschat [data-chat-input]').forEach(function(t){
      if(t.dataset.c127Fit)return;t.dataset.c127Fit='1';
      t.addEventListener('input',function(){fit(t);});
      var f=t.form; if(f){f.addEventListener('submit',function(){setTimeout(function(){fit(t);},0);});}
      fit(t);
    });
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
})();

/* Les portes du Grimoire : chaque Sœur avec qui l'on pratique ouvre sa porte (I à VII).
   Gardé dans ce navigateur, et signalé à l'application quand la page s'y affiche. */
(function () {
  'use strict';
  var KEYS = ['oni', 'alka', 'naia', 'terra', 'ignis', 'astria', 'irma'];
  function mark(sister) {
    var k = String(sister || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
    if (KEYS.indexOf(k) < 0) return;
    try { var P = JSON.parse(localStorage.getItem('c127_portes') || '{}') || {}; P[k] = Date.now(); localStorage.setItem('c127_portes', JSON.stringify(P)); } catch (e) {}
    try { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'c127-sister', sister: k })); } catch (e) {}
  }
  window.C127Portes = { mark: mark };
  // Un message envoyé dans la conversation d'une Sœur ouvre sa porte.
  document.addEventListener('submit', function (e) {
    var chat = e.target && e.target.closest && e.target.closest('.oschat');
    if (!chat) return;
    var m = /oschat--([a-z]+)/.exec(chat.className); if (m) mark(m[1]);
  }, true);
})();
