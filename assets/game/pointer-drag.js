// Explicit grip: touch scrolling elsewhere remains native. Checkbox/tap assignment stays available.
export function mountPointerDrag({container,onDrop,onPause,preview}){
  let drag=null,ghost=null,target=null;
  function cleanup(){ghost?.remove();ghost=null;target?.classList.remove('drop-target');target=null;drag=null;}
  function down(e){const grip=e.target.closest('[data-drag-person]');if(!grip||grip.disabled||e.button!==0)return;drag={id:grip.dataset.dragPerson,x:e.clientX,y:e.clientY,pointer:e.pointerId,grip,active:false};grip.setPointerCapture(e.pointerId);}
  function move(e){
    if(!drag||e.pointerId!==drag.pointer)return;
    if(!drag.active&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;
    if(!drag.active){drag.active=true;onPause();ghost=document.createElement('div');ghost.className='drag-preview';ghost.setAttribute('role','status');document.body.append(ghost);}
    e.preventDefault();target?.classList.remove('drop-target');
    target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop-task]')||null;
    target?.classList.add('drop-target');ghost.textContent=target?preview(drag.id,target.dataset.dropTask):'Перенесите человека на задачу';
    ghost.style.left=Math.min(innerWidth-260,Math.max(8,e.clientX+12))+'px';ghost.style.top=Math.max(8,Math.min(innerHeight-110,e.clientY+12))+'px';
  }
  function up(e){if(!drag||e.pointerId!==drag.pointer)return;const current=drag,task=target?.dataset.dropTask;cleanup();if(current.active){e.preventDefault();container.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();},{capture:true,once:true});if(task)onDrop(current.id,task);}}
  container.addEventListener('pointerdown',down);container.addEventListener('pointermove',move);container.addEventListener('pointerup',up);container.addEventListener('pointercancel',cleanup);
  return ()=>{cleanup();container.removeEventListener('pointerdown',down);container.removeEventListener('pointermove',move);container.removeEventListener('pointerup',up);container.removeEventListener('pointercancel',cleanup);};
}
