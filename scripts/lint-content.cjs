// Content integrity: course units, exercises, FAQ and simulations reference each other correctly.
(async()=>{
  const root=require('node:path').resolve(__dirname,'..');
  const {course}=await import(root+'/content/course.js');
  const {faq}=await import(root+'/content/faq.js');
  const {games}=await import(root+'/content/games.js');
  const problems=[];
  const blocks=new Set(['text','key','stat','compare','steps','cycle','ladder','cards','matrix','table','tabs','scale','check','sort','quiz','calc']);
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
    if(!u.games.length)problems.push(`${p}: нет игр`);
    for(const b of u.games)if(!games.some(g=>g.id===b))problems.push(`${p}: нет игры ${b}`);
  }
  for(const g of games)if(!course.some(u=>u.games.includes(g.id)&&u.id===g.topic))problems.push(`Игра ${g.id} не привязана к своей теме`);
  for(const f of faq){
    const u=course.find(u=>u.id===f.lec[0]);
    if(!u||!u.sections[f.lec[1]])problems.push(`${f.id}: нет раздела лекции ${f.lec}`);
    if(!games.some(g=>g.id===f.game))problems.push(`${f.id}: нет игры ${f.game}`);
    if(!f.a)problems.push(`${f.id}: нет короткого ответа`);
    if(f.steps.length<2||f.steps.length>5)problems.push(`${f.id}: шагов должно быть 2–5`);
  }
  if(new Set(faq.map(h=>h.id)).size!==faq.length)problems.push('Повторяются id вопросов');
  if(problems.length){console.error(problems.join('\n'));process.exit(1);}
  const sec=course.reduce((n,u)=>n+u.sections.length,0);
  console.log(`Content validation passed: ${course.length} тем, ${sec} разделов, ${faq.length} вопросов, ${games.length} симуляций.`);
})();
