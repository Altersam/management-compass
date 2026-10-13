import {generateScenario} from './generator.js';
import {newSeed} from '../sprint-goal/random.js';
import {movement,road,available,endorsers,decisionState} from './navigation.js';
import {score} from './scoring.js';
export function create(seed=newSeed()){
  seed=String(seed).slice(0,80);const scenario=generateScenario(seed),knownEdges=scenario.edges.filter(e=>e.known).map(e=>e.id),knownNodes=scenario.nodes.filter(n=>!n.hidden||scenario.edges.some(e=>e.known&&(e.from===n.id||e.to===n.id))).map(n=>n.id);
  return {revision:1,modelVersion:2,seed,scenarioId:scenario.id,scenario,phase:'intro',turn:0,turnsLeft:scenario.turns,markerNode:'you',selected:scenario.bridge,politicalCapital:5,noise:0,knownNodes,knownEdges,closedEdges:[],blocked:{},gates:[],profiles:['you'],carriers:{},briefed:{},consulted:[],attitudes:Object.fromEntries(scenario.nodes.map(n=>[n.id,n.attitude])),interests:Object.fromEntries(scenario.nodes.map(n=>[n.id,n.interest])),ghostAttempts:0,officialRequests:0,routeHistory:[],opponent:{alertStage:0,actionsTaken:[],neutralized:[]},eventHistory:[],eventEffect:null,decider:{state:decisionState(scenario.base),accumulatedPush:0,pressure:0,overpushPenalty:0},animation:null,paused:false,decisionSteps:[],result:null,messages:[],commands:[]};
}
const node=(s,id)=>s.scenario.nodes.find(n=>n.id===id);
function note(s,text){s.messages.push(text);}
function reveal(s,e){if(!s.knownEdges.includes(e.id))s.knownEdges.push(e.id);for(const id of [e.from,e.to])if(!s.knownNodes.includes(id))s.knownNodes.push(id);}
function discover(s,id){
  const hidden=s.scenario.edges.filter(e=>e.from===id&&!s.knownEdges.includes(e.id)&&!node(s,e.to).opponent);const move=hidden.find(movement),support=hidden.find(e=>['trust','expert'].includes(e.type));
  const facts=[move,support].filter(Boolean);facts.forEach(e=>reveal(s,e));return facts;
}
function finish(s,kind){s.result=score(s,kind);s.phase='report';s.animation=null;}
function counter(s){
  const extra=s.eventEffect?.id==='leave'&&s.eventEffect.until>=s.turn?3:0;
  for(let level=s.opponent.alertStage+1;level<=2;level++){
    if(s.noise<s.scenario.thresholds[level-1]+extra)break;s.opponent.alertStage=level;
    if(level===1){const candidates=endorsers(s).sort((a,b)=>b.push-a.push),hit=candidates[0];if(hit){s.carriers[hit.id]=false;s.opponent.neutralized.push(hit.id);s.opponent.actionsTaken.push({level,node:hit.id});note(s,s.scenario.strike+' '+hit.name+' больше не готов нести решение; дорога остаётся.');}else{s.decider.pressure+=.06;s.opponent.actionsTaken.push({level,node:null});note(s,'Оппонент заметил движение и начал проверять, кто поддерживает инициативу.');}}
    else {const e=s.scenario.edges.filter(e=>e.to===s.scenario.decider&&movement(e)&&available(s,e)).sort((a,b)=>Number(a.type==='formal')-Number(b.type==='formal')||b.strength-a.strength)[0];if(e){s.closedEdges.push(e.id);s.opponent.actionsTaken.push({level,edge:e.id});note(s,'Оппонент закрыл дорогу '+node(s,e.from).name+' → '+node(s,e.to).name+'. Она остаётся в карте как потерянная возможность.');}else{s.decider.pressure+=.1;s.opponent.actionsTaken.push({level,edge:null});note(s,'Оппонент усилил сопротивление у решающего: известной дороги для перекрытия пока нет.');}}
  }
}
function spend(s,{turns=1,capital=0,noise=0}={}){if(s.turnsLeft<turns||s.politicalCapital<capital)throw new Error('Не хватает ходов или политического капитала.');s.turn+=turns;s.turnsLeft-=turns;s.politicalCapital-=capital;s.noise=Math.max(0,s.noise+noise);}
function after(s){
  const ev=s.scenario.event;if(s.turn>=ev.turn&&!s.eventHistory.length){s.eventHistory.push({...ev,at:s.turn});s.eventEffect={id:ev.id,until:s.turn+1};if(ev.edge)s.blocked[ev.edge]=s.turn+1;note(s,ev.title+'. '+ev.text);}
  counter(s);
  if(s.phase==='motion'&&s.animation?.kind==='move'&&!available(s,s.scenario.edges.find(e=>e.id===s.animation.edge))){s.routeHistory.push({kind:'blocked',from:s.animation.from,to:s.animation.to,turn:s.turn});note(s,'Передача остановлена: дорога стала недоступна. Решение осталось у '+node(s,s.markerNode).name+'.');s.animation=null;s.phase='play';}
  if(s.phase==='play'&&s.ghostAttempts>=3)finish(s,'ghost');
  else if(s.phase==='play'&&s.turnsLeft===0){const bridge=s.closedEdges.some(id=>s.scenario.mainRoute.some((n,i)=>i&&s.scenario.edges.some(e=>e.id===id&&e.from===s.scenario.mainRoute[i-1]&&e.to===n)));finish(s,bridge?'burned':s.politicalCapital===0?'capital':'turns');}
}
function contact(s,id){return id===s.markerNode||Boolean(road(s,s.markerNode,id));}
function ghost(s,id){spend(s);s.ghostAttempts++;s.routeHistory.push({kind:'ghost',from:s.markerNode,to:id,turn:s.turn});note(s,'Призрак №'+s.ghostAttempts+': '+node(s,s.markerNode).name+' ⇢ '+node(s,id).name+'. Известной открытой дороги нет.');s.animation={kind:'ghost',from:s.markerNode,to:id,index:0,frames:4};s.phase='motion';s.paused=false;after(s);}
export function act(state,a){
  const s=structuredClone(state);if(s.phase==='ended')throw new Error('Маршрут уже разобран.');
  if(a.type==='select'){if(!s.knownNodes.includes(a.id))throw new Error('Участник пока не известен.');s.selected=a.id;}
  else if(a.type==='open'){if(s.phase!=='intro')throw new Error('Карта уже открыта.');s.phase='play';}
  else if(a.type==='pauseAnimation'||a.type==='resume'){if(!['motion','resolving'].includes(s.phase))throw new Error('Проигрывание не идёт.');s.paused=a.type==='pauseAnimation';}
  else if(a.type==='tick'){
    if(s.paused)throw new Error('Проигрывание на паузе.');
    if(s.phase==='motion'){
      s.animation.index++;if(s.animation.index===s.animation.frames){const m=s.animation;if(m.kind==='move'){s.markerNode=m.to;s.routeHistory.push({kind:'move',from:m.from,to:m.to,edge:m.edge,turn:s.turn,official:Boolean(m.official)});note(s,'▣ Решение передано: '+node(s,m.from).name+' → '+node(s,m.to).name+'.');}
        s.animation=null;s.phase=s.markerNode===s.scenario.decider?'decision':'play';after(s);}
    }else if(s.phase==='resolving'){
      const list=endorsers(s),i=s.decisionSteps.length;
      if(i<list.length){const e=list[i];s.decider.accumulatedPush+=e.push;s.decider.state=decisionState(s.scenario.base+s.decider.accumulatedPush-s.decider.pressure);s.decisionSteps.push({id:e.id,text:e.name+' '+(e.type==='expert'?'подтвердил тематическую оценку':'рекомендует решение')+'.',state:s.decider.state});}
      else {const push=s.decider.accumulatedPush;s.decider.overpushPenalty=s.scenario.overpush?Math.max(0,push-s.scenario.softLimit)*3:0;const final=s.scenario.base+push-s.decider.pressure-s.decider.overpushPenalty;s.decider.state=decisionState(final);const ready=!s.scenario.required||s.carriers[s.scenario.required],moves=s.routeHistory.filter(h=>h.kind==='move'),formal=moves.length&&moves.every(h=>!h.official&&s.scenario.orgRoute.some((id,i)=>i&&id===h.to&&s.scenario.orgRoute[i-1]===h.from));let kind=final>=.6&&list.length&&ready?'success':formal?'formal':'orphan';if(s.decider.overpushPenalty>0&&final<.6)kind='overpush';s.decisionSteps.push({id:'final',text:s.decider.overpushPenalty?'Слишком организованная кампания вызвала ощущение давления.':!ready?'Операционная сторона не подготовлена: CFO не остановит пилот без её согласия.':kind==='success'?'Решение принято.':'«Оставьте материалы, я посмотрю». Доступ не заменил рекомендации.',state:s.decider.state});finish(s,kind);}
    }else throw new Error('Проигрывание не идёт.');
  }else if(a.type==='resolve'){if(s.phase!=='decision'||s.markerNode!==s.scenario.decider)throw new Error('Сначала доставьте решение к решающему.');s.phase='resolving';s.paused=false;}
  else if(a.type==='finish'){if(s.phase!=='report')throw new Error('Сначала посмотрите итог.');s.phase='ended';}
  else {
    if(s.phase!=='play')throw new Error('Дождитесь завершения движения.');const id=a.id||s.selected,n=node(s,id);if(!n||!s.knownNodes.includes(id))throw new Error('Участник пока не известен.');
    if(a.type==='probe'){spend(s);if(!s.profiles.includes(id))s.profiles.push(id);const facts=discover(s,id);note(s,s.scenario.hooks[id]||'Уточнены роль и позиция: '+n.name+'.');if(!facts.length)note(s,'Новых исходящих дорог не найдено. Полная карта не обязательна.');}
    else if(a.type==='consult'){
      if(!contact(s,id))throw new Error('Для разговора нужна открытая дорога от текущего места решения.');if(s.consulted.includes(id))throw new Error('Позиция уже обсуждена; повтор не повышает отношение.');spend(s,{noise:.5});s.consulted.push(id);if(!s.profiles.includes(id))s.profiles.push(id);if(!n.opponent&&!n.decider)s.attitudes[id]=Math.min(1,s.attitudes[id]+.25);discover(s,id);note(s,s.scenario.hooks[id]||n.name+' объяснил свою позицию.');
    }else if(a.type==='brief'){
      if(!contact(s,id))throw new Error('Для брифинга нужна открытая дорога или решение у этого участника.');if(s.carriers[id])throw new Error('Носитель уже подготовлен.');spend(s,{noise:1});s.briefed[id]=true;if(!s.profiles.includes(id))s.profiles.push(id);s.carriers[id]=n.canCarry&&!n.decider&&!n.opponent&&s.attitudes[id]>=.5&&s.interests[id]>=.45;note(s,n.name+(s.carriers[id]?' готов понести решение дальше без вас.':' выслушал, но не готов нести решение. Поддержка и носительство — разные вещи.'));
    }else if(a.type==='gate'){if(!n.gatekeeper||!contact(s,id))throw new Error('Для открытия двери нужен контакт с гейткипером.');if(s.gates.includes(id))throw new Error('Дверь уже открыта.');spend(s);s.gates.push(id);discover(s,id);note(s,n.name+' открыл дверь. Это доступ, а не поддержка кандидатуры.');}
    else if(a.type==='move'){
      if(id===s.markerNode)throw new Error('Решение уже здесь.');const e=road(s,s.markerNode,id);if(!e){const existing=s.scenario.edges.find(e=>e.from===s.markerNode&&e.to===id&&movement(e));if(existing){spend(s);s.routeHistory.push({kind:'blocked',from:s.markerNode,to:id,turn:s.turn});note(s,'Передача не состоялась: дорога не разведана, закрыта или требует гейткипера. Маркер остался на месте.');after(s);}else ghost(s,id);}else {const source=node(s,s.markerNode);if(e.type==='access'&&source.id!=='you'&&!source.gatekeeper&&!s.carriers[source.id])throw new Error('Текущий участник ещё не готов нести решение. Проведите брифинг.');spend(s,{noise:e.noiseCost});s.animation={kind:'move',from:s.markerNode,to:id,edge:e.id,index:0,frames:6};s.phase='motion';s.paused=false;after(s);}
    }else if(a.type==='trade'){
      const e=s.scenario.edges.find(e=>e.from===s.markerNode&&e.to===id&&movement(e)&&(!s.knownEdges.includes(e.id)||s.closedEdges.includes(e.id)));spend(s,{capital:1,noise:1});if(e){reveal(s,e);s.closedEdges=s.closedEdges.filter(x=>x!==e.id);note(s,'Обмен услугой открыл существующую дорогу '+node(s,e.from).name+' → '+n.name+'.');}else note(s,'Обмен услугой не создал дорогу: прямого канала нет.');
    }else if(a.type==='hold'){spend(s,{noise:-3});s.politicalCapital=Math.min(5,s.politicalCapital+1);note(s,'Пауза: внимание снизилось, один жетон капитала восстановлен. Контратаки не отменены.');}
    else if(a.type==='official'){spend(s,{capital:1,noise:6});s.officialRequests++;note(s,'Официальный запрос: «Принято к рассмотрению». Маркер остался на месте; содержательной рекомендации нет.');}
    else if(a.type==='escalate'){
      const e=road(s,s.markerNode,s.scenario.decider);const capital=s.eventEffect?.id==='meeting'&&s.eventEffect.until>=s.turn?1:2;spend(s,{capital,noise:capital===1?8:7});if(e){s.animation={kind:'move',from:s.markerNode,to:s.scenario.decider,edge:e.id,index:0,frames:6,official:true};s.phase='motion';s.paused=false;note(s,'Вопрос вынесен по существующей дороге. Без эндорсеров получится сиротское решение.');}else{note(s,'Эскалация не создала прямую дорогу. Секретариат принял запрос, но решение ещё не доставлено.');s.officialRequests++;}
    }else throw new Error('Действие не найдено.');
    if(!['move'].includes(a.type))after(s);
  }
  s.commands.push(structuredClone(a));return s;
}
export function validate(saved){try{if(!saved||saved.revision!==1||saved.modelVersion!==2||typeof saved.seed!=='string'||!Array.isArray(saved.commands)||saved.commands.length>350)return false;let expected=create(saved.seed);for(const a of saved.commands)expected=act(expected,a);return Object.keys(expected).every(k=>JSON.stringify(expected[k])===JSON.stringify(saved[k]));}catch(_){return false;}}
