import {slotLabels,stateMeta} from './semantics.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function historyView(s){
  const history=structuredClone(s.history);
  if(s.phase==='transfer'){
    const transferred=new Set(s.animation.frames.slice(0,s.animation.index).map(f=>f.slot));
    const cells=Object.fromEntries(Object.entries(s.packet).map(([id,cell])=>[id,transferred.has(id)?structuredClone(cell):{...cell,state:'pending'}]));
    history.push({label:s.scenario.roles[s.step+1].name+' · передача',cells,received:cells,step:s.step+1});
  }return history;
}
export const metaFor=cell=>cell?.state==='pending'?{symbol:'…',label:'Ещё передаётся'}:stateMeta[cell?.state||'absent'];
export function meaningTree(s){
  const history=historyView(s),keys=[...Object.keys(slotLabels),...(s.packet.phantom?['phantom']:[])],xs=[270,410,550,690,830],H=110+keys.length*62;
  let svg=`<svg class="meaning-tree" viewBox="0 0 950 ${H}" role="img" aria-labelledby="meaningTreeTitle meaningTreeDescription"><title id="meaningTreeTitle">Дерево судьбы семи веток поручения</title><desc id="meaningTreeDescription">Корень — исходное поручение. Каждая строка показывает отдельный смысл по точкам передачи. Символ и подпись обозначают сохранение, размытие, потерю, подмену или восстановление. Таблица под деревом содержит ту же историю.</desc><rect class="meaning-root" x="16" y="${H/2-32}" width="112" height="64" rx="9"/><text class="meaning-root-text" x="72" y="${H/2-6}">ИСХОДНОЕ</text><text class="meaning-root-text" x="72" y="${H/2+14}">ПОРУЧЕНИЕ</text>`;
  for(let i=0;i<5;i++)svg+=`<text class="meaning-stage" x="${xs[i]}" y="25">${esc(s.scenario.roles[i].name)}</text>`;
  for(const event of s.eventHistory){const x=(xs[event.step]+xs[event.step+1])/2;svg+=`<text class="meaning-event" x="${x}" y="48">⚡<title>${esc(event.title)}: ${esc(event.choiceLabel)}</title></text>`;}
  keys.forEach((id,ri)=>{
    const y=95+ri*62;svg+=`<path class="meaning-base" d="M128 ${H/2} C155 ${H/2} 170 ${y} 256 ${y}"/><text class="meaning-slot-label" x="246" y="${y-15}">${slotLabels[id]||'Дополнительное'}</text>`;
    history.forEach((h,i)=>{
      const cell=h.cells[id],meta=metaFor(cell),status=cell?.state||'absent',x=xs[i];
      if(i)svg+=`<path class="meaning-segment ${status}" d="M${xs[i-1]+15} ${y} L${x-15} ${y}"/>`;
      svg+=`<circle class="meaning-point ${status}" cx="${x}" cy="${y}" r="15"/><text class="meaning-symbol" x="${x}" y="${y+5}">${meta.symbol}</text><title>${slotLabels[id]||'Дополнение'} · ${esc(h.label)}: ${meta.label}; ${esc(cell?.current||'Не было в источнике')}${cell?.fromState?'; пришло '+stateMeta[cell.fromState].label:''}</title>`;
    });
  });return `<div class="meaning-tree-scroll" tabindex="0" role="region" aria-label="Дерево смысла: горизонтальная прокрутка">${svg}</svg></div>`;
}
export function historyTable(s){const history=historyView(s),keys=[...Object.keys(slotLabels),...(s.packet.phantom?['phantom']:[])];return `<div class="meaning-table-scroll" tabindex="0" role="region" aria-label="Таблица истории смысловых веток"><table class="meaning-table"><caption>Та же история, что на дереве · выберите ячейку для ветки</caption><thead><tr><th scope="col">Ветка</th>${history.map(h=>`<th scope="col">${esc(h.label)}</th>`).join('')}</tr></thead><tbody>${keys.map(id=>`<tr><th scope="row">${slotLabels[id]||'Дополнение'}</th>${history.map(h=>{const cell=h.cells[id],meta=metaFor(cell);return `<td><button type="button" data-meaning-action="select" data-id="${id}" aria-label="${slotLabels[id]||'Дополнение'} · ${esc(h.label)}: ${meta.label}${cell?.fromState?'; пришло '+stateMeta[cell.fromState].label:''}" ${!s.packet[id]||s.phase==='ended'?'disabled':''}><b>${meta.symbol}</b><small>${meta.label}</small></button></td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;}
