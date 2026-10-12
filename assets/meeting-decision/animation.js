export function executionClock({getState,tick,pause}){
  let timer=null,disposed=false;const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  function stop(){clearTimeout(timer);timer=null;}
  function sync(){stop();const s=getState();if(disposed||s.phase!=='execution'||s.executionPaused||document.hidden)return;timer=setTimeout(()=>{timer=null;tick();},reduced?.matches?150:800);}
  function visibility(){if(document.hidden){stop();const s=getState();if(s.phase==='execution'&&!s.executionPaused)pause();}}
  document.addEventListener('visibilitychange',visibility);return {sync,stop,dispose(){disposed=true;stop();document.removeEventListener('visibilitychange',visibility);}};
}
