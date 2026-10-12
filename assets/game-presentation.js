import {setTheme} from './shell.js';
if(typeof document!=='undefined'){const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=new URL('./game-themes.css',import.meta.url);document.head.append(stylesheet);}
export function seedIdentifier(seed){let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(16).toUpperCase().padStart(8,'0').slice(-4);}
export const newGameSeed=()=>globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+String(globalThis.performance?.now?.()||0);
export function seedForDomain(domain,domainOf,base=newGameSeed()){
  if(!domain||!domainOf)return base;
  for(let i=0;i<400;i++){const seed=base+'-'+i;if(domainOf(seed)===domain)return seed;}
  throw new Error('Не удалось подобрать случай выбранной области.');
}
export function mountGamePresentation({seed,onRestart,domains=[],domainOf,random=true,newOptions={},repeatOptions={},note=''}={}){
  document.body.dataset.gameUi='';
  const header=document.querySelector('.product-header');
  let button=document.getElementById('gameThemeToggle');
  if(!button){button=document.createElement('button');button.type='button';button.id='gameThemeToggle';button.className='game-theme-toggle';header?.append(button);}
  function update(){const dark=document.documentElement.dataset.theme==='dark';button.textContent=dark?'Светлая тема':'Тёмная тема';button.setAttribute('aria-label',dark?'Включить светлую игровую тему':'Включить тёмную игровую тему');button.setAttribute('aria-pressed',String(dark));}
  button.onclick=()=>{setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');update();};
  const observer=new MutationObserver(update);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});update();
  let picker=null;
  if(seed!==undefined&&onRestart){
    picker=document.createElement('details');picker.className='game-case-browser';
    const summary=document.createElement('summary');summary.textContent='Дело #'+seedIdentifier(seed)+' · выбор случая';picker.append(summary);
    const panel=document.createElement('div');panel.className='game-case-options';
    const description=document.createElement('p');description.textContent=note||(random?'Повтор сохраняет исходные условия. Новый случай получает новый seed.':'Авторский кейс: содержание фиксировано; повтор позволяет испытать другую стратегию.');panel.append(description);
    let select=null;
    if(domains.length){const label=document.createElement('label');label.textContent='Область нового случая';select=document.createElement('select');select.id='gameCaseDomain';const any=document.createElement('option');any.value='';any.textContent='Случайная область';select.append(any);for(const d of domains){const option=document.createElement('option');option.value=d.id;option.textContent=d.name;select.append(option);}label.append(select);panel.append(label);}
    const actions=document.createElement('div');actions.className='game-case-actions';
    const repeat=document.createElement('button');repeat.type='button';repeat.dataset.caseAction='repeat';repeat.textContent='Повторить этот случай';repeat.onclick=()=>onRestart(seed,repeatOptions);actions.append(repeat);
    if(random){const next=document.createElement('button');next.type='button';next.dataset.caseAction='new';next.textContent='Новый случай';next.onclick=()=>onRestart(seedForDomain(select?.value,domainOf),newOptions);actions.append(next);}
    panel.append(actions);picker.append(panel);header?.after(picker);
  }
  return ()=>{observer.disconnect();picker?.remove();button.remove();};
}
