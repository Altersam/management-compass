export function consequenceClock({getState,tick,pause}){
  let timer=null,disposed=false;const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  function stop(){clearTimeout(timer);timer=null;}
  function sync(){stop();const s=getState();if(disposed||s.phase!=='consequences'||s.paused||document.hidden)return;timer=setTimeout(()=>{timer=null;tick();},reduced?.matches?150:750);}
  function visibility(){if(document.hidden){stop();const s=getState();if(s.phase==='consequences'&&!s.paused)pause();}}
  document.addEventListener('visibilitychange',visibility);return {sync,stop,dispose(){disposed=true;stop();document.removeEventListener('visibilitychange',visibility);}};
}
