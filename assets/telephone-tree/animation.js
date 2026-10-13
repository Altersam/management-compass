export function transmissionClock({getState,tick,pause}){
  let timer=null,disposed=false;const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  function stop(){clearTimeout(timer);timer=null;}
  function sync(){stop();const s=getState();if(disposed||!['transfer','execution'].includes(s.phase)||s.paused||document.hidden)return;timer=setTimeout(()=>{timer=null;tick();},reduced?.matches?60:s.phase==='transfer'?220:750);}
  function visibility(){if(document.hidden){stop();const s=getState();if(['transfer','execution'].includes(s.phase)&&!s.paused)pause();}}
  document.addEventListener('visibilitychange',visibility);return {sync,stop,dispose(){disposed=true;stop();document.removeEventListener('visibilitychange',visibility);}};
}
