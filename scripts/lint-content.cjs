// Content integrity: topics, help answers and game catalog reference each other correctly.
(async()=>{
  const root=require('node:path').resolve(__dirname,'..');
  const {topics}=await import(root+'/content/topics.js');
  const {help}=await import(root+'/content/help.js');
  const {games}=await import(root+'/content/games.js');
  const problems=[];const kinds=new Set(['compare','flow','ladder','cards','matrix','table']);
  if(topics.length!==10)problems.push('Нужно 10 тем');
  for(const t of topics){
    if(t.ideas.length!==4)problems.push(`Тема ${t.id}: должно быть 4 идеи`);
    t.ideas.forEach((x,i)=>{
      if(!kinds.has(x.vis.type))problems.push(`Тема ${t.id}.${i}: неизвестная схема ${x.vis.type}`);
      if(!(x.quiz.ok>=0&&x.quiz.ok<x.quiz.opts.length))problems.push(`Тема ${t.id}.${i}: неверный ответ в проверке`);
      if(x.say.length>260)problems.push(`Тема ${t.id}.${i}: объяснение длиннее 260 символов`);
    });
    for(const g of t.games)if(!games.some(x=>x.id===g))problems.push(`Тема ${t.id}: нет игры ${g}`);
    for(const h of t.help)if(!help.some(x=>x.id===h))problems.push(`Тема ${t.id}: нет ответа ${h}`);
  }
  for(const h of help){
    if(!topics.some(t=>t.id===h.topic))problems.push(`${h.id}: нет темы`);
    if(!games.some(g=>g.id===h.game))problems.push(`${h.id}: нет игры ${h.game}`);
    const t=topics.find(t=>t.id===h.idea[0]);if(!t||!t.ideas[h.idea[1]])problems.push(`${h.id}: нет идеи ${h.idea}`);
    if(h.steps.length<2||h.steps.length>5)problems.push(`${h.id}: шагов должно быть 2–5`);
  }
  if(new Set(help.map(h=>h.id)).size!==help.length)problems.push('Повторяются id ответов');
  if(problems.length){console.error(problems.join('\n'));process.exit(1);}
  console.log(`Content validation passed: ${topics.length} тем, ${help.length} ответов, ${games.length} игр.`);
})();
