export function animationController({getState,tick,pause}){
  let timer=null,disposed=false;
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  function stop(){clearTimeout(timer);timer=null;}
  function sync(){stop();const s=getState();if(disposed||s.phase!=='running'||s.paused||document.hidden)return;timer=setTimeout(()=>{timer=null;tick();},Math.max(40,(reduced?.matches?120:700)/s.speed));}
  function visibility(){if(document.hidden){stop();const s=getState();if(s.phase==='running'&&!s.paused)pause();}}
  document.addEventListener('visibilitychange',visibility);
  return {sync,stop,dispose(){disposed=true;stop();document.removeEventListener('visibilitychange',visibility);}};
}
