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
