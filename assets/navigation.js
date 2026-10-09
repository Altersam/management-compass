(() => {
  const titles={start:'С чего начать в рабочей ситуации?',reference:'Теория и техники',practice:'Практика без лишних шагов',journal:'Моя рабочая тетрадь',help:'Помощь и частые вопросы'};
  function navigate(){
    const hash=location.hash.slice(1);
    const view=['modules','library','favorites'].includes(hash)?'reference':['practice','cases'].includes(hash)?'practice':['diary','decisions'].includes(hash)?'journal':hash==='faq'?'help':'start';
    document.querySelectorAll('[data-screen]').forEach(section=>{
      section.hidden=section.dataset.screen!==view || (section.dataset.pane&&section.dataset.pane!==(hash==='cases'?'cases':'templates'));
    });
    document.querySelectorAll('[data-view-link]').forEach(a=>{const on=a.dataset.viewLink===view;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.querySelectorAll('.practice-tabs a').forEach(a=>{const on=a.hash===(hash==='cases'?'#cases':'#practice');a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.getElementById('viewTitle').textContent=titles[view];
    if(hash==='favorites'){const filter=document.getElementById('favoritesOnly');if(filter&&!filter.checked){filter.checked=true;filter.dispatchEvent(new Event('change'));}}
    if(hash==='decisions'){const filter=document.getElementById('diaryFilter');if(filter){if(![...filter.options].some(o=>o.value==='Решение'))filter.add(new Option('Решения','Решение'));filter.value='Решение';filter.dispatchEvent(new Event('change'));}}
    document.title=`${titles[view]} — Практика управления`;
  }
  window.addEventListener('hashchange',()=>{navigate();window.scrollTo({top:0,behavior:'instant'});});
  navigate();
})();
