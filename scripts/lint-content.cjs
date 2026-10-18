// Content integrity: course units, exercises, FAQ and simulations reference each other correctly.
(async()=>{
  const root=require('node:path').resolve(__dirname,'..');
  const {course}=await import(root+'/content/course.js');
  const {faq}=await import(root+'/content/faq.js');
  const {games}=await import(root+'/content/games.js');
  const problems=[];
  const blocks=new Set(['text','key','stat','compare','steps','cycle','ladder','cards','matrix','table','tabs','scale','check','sort','quiz','calc']);
  const types=new Set(['tf','choice','case','multi','fill','order','match','classify']);
  if(course.length!==10)problems.push('Нужно 10 тем');
  for(const u of course){
    const p=`Тема ${u.id}`;
    if(!u.title||!u.full||!u.lead)problems.push(`${p}: нет заголовка или вводного текста`);
    if(u.sections.length<3)problems.push(`${p}: меньше трёх разделов`);
    u.sections.forEach((s,i)=>{
      if(!s.title||!s.thesis||s.blocks.length<2)problems.push(`${p}.${i}: раздел без тезиса или с <2 блоками`);
      for(const b of s.blocks){
        if(!blocks.has(b.type))problems.push(`${p}.${i}: неизвестный блок ${b.type}`);
        if(b.type==='quiz'&&!(b.ok>=0&&b.ok<b.opts.length))problems.push(`${p}.${i}: неверный ответ в проверке`);
        if(b.type==='sort'&&!b.items.every(x=>x[1]>=0&&x[1]<b.bins.length))problems.push(`${p}.${i}: неверная группа в сортировке`);
        if(b.type==='matrix'&&b.cells.length!==4)problems.push(`${p}.${i}: в матрице должно быть 4 клетки`);
        if(b.type==='table'&&!b.rows.every(r=>r.length===b.head.length))problems.push(`${p}.${i}: строка таблицы не совпадает с заголовком`);
      }
    });
    if(u.lessons.length!==3)problems.push(`${p}: должно быть 3 урока`);
    u.lessons.forEach((l,i)=>{
      if(l.ex.length<5)problems.push(`${p}, урок ${i+1}: меньше 5 заданий`);
      for(const e of l.ex){
        const q=`${p}, урок ${i+1}: «${String(e.q).slice(0,40)}»`;
        if(!types.has(e.t))problems.push(`${q}: неизвестный тип ${e.t}`);
        if(['choice','case','fill'].includes(e.t)&&!(e.ok>=0&&e.ok<e.opts.length))problems.push(`${q}: неверный ответ`);
        if(e.t==='fill'&&!e.q.includes('___'))problems.push(`${q}: нет пропуска ___`);
        if(e.t==='case'&&!e.s)problems.push(`${q}: нет ситуации`);
        if(e.t==='tf'&&typeof e.ok!=='boolean')problems.push(`${q}: ok должен быть true/false`);
        if(e.t==='multi'&&!(e.ok.length>=2&&e.ok.every(i=>i<e.opts.length)))problems.push(`${q}: неверные ответы multi`);
        if(e.t==='classify'&&!e.items.every(x=>x[1]<e.bins.length))problems.push(`${q}: неверная группа`);
        if(e.t==='match'&&new Set(e.pairs.map(x=>x[1])).size!==e.pairs.length)problems.push(`${q}: повторяются пары`);
      }
    });
    for(const b of u.boss)if(b!=='exam'&&!games.some(g=>g.id===b))problems.push(`${p}: нет испытания ${b}`);
  }
  for(const g of games)if(!course.some(u=>u.boss.includes(g.id)))problems.push(`Игра ${g.id} не стоит на пути практики`);
  for(const f of faq){
    const u=course.find(u=>u.id===f.lec[0]);
    if(!u||!u.sections[f.lec[1]])problems.push(`${f.id}: нет раздела лекции ${f.lec}`);
    if(!games.some(g=>g.id===f.game))problems.push(`${f.id}: нет игры ${f.game}`);
    if(!f.a)problems.push(`${f.id}: нет короткого ответа`);
    if(f.steps.length<2||f.steps.length>5)problems.push(`${f.id}: шагов должно быть 2–5`);
  }
  if(new Set(faq.map(h=>h.id)).size!==faq.length)problems.push('Повторяются id вопросов');
  if(problems.length){console.error(problems.join('\n'));process.exit(1);}
  const ex=course.reduce((n,u)=>n+u.lessons.reduce((m,l)=>m+l.ex.length,0),0),sec=course.reduce((n,u)=>n+u.sections.length,0);
  console.log(`Content validation passed: ${course.length} тем, ${sec} разделов, ${ex} заданий, ${faq.length} вопросов, ${games.length} симуляций.`);
})();
