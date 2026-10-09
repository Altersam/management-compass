(function(root){
  'use strict';
  const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const emptyModule=()=>({visited:[],diagnostic:null,practice:{response:'',checks:[]},transfer:{},transferEntryId:null,answers:{},attempts:[]});
  const emptyCourse=()=>({modules:{},last:null,final:{answers:{},attempts:[]}});
  function course(data){return plain(data.course)?data.course:emptyCourse();}
  function moduleState(data,id){const raw=course(data).modules?.[String(id)];return {...emptyModule(),...(plain(raw)?raw:{}),visited:Array.isArray(raw?.visited)?raw.visited:[],answers:plain(raw?.answers)?raw.answers:{},attempts:Array.isArray(raw?.attempts)?raw.attempts:[]};}
  function ensure(data,id){
    if(!plain(data.course))data.course=emptyCourse();
    if(!plain(data.course.modules))data.course.modules={};
    if(id!==undefined){data.course.modules[String(id)]=moduleState(data,id);return data.course.modules[String(id)];}
    if(!plain(data.course.final))data.course.final={answers:{},attempts:[]};
    return data.course;
  }
  function mark(data,id,step){const m=ensure(data,id);if(!m.visited.includes(step))m.visited.push(step);}
  function score(questions,answers){
    const correct=questions.filter(q=>answers[q.id]===q.answer).length;
    const wrong=questions.filter(q=>answers[q.id]!==q.answer).map(q=>q.id);
    const complete=questions.every(q=>Number.isInteger(answers[q.id])&&answers[q.id]>=0&&answers[q.id]<q.options.length);
    return {score:correct,total:questions.length,wrong,complete};
  }
  function submit(data,id,questions){
    const m=id==='final'?ensure(data).final:ensure(data,id);
    if(!plain(m.answers))m.answers={};if(!Array.isArray(m.attempts))m.attempts=[];
    const result=score(questions,m.answers);if(!result.complete)return result;
    const attempt={...result,at:new Date().toISOString(),answers:{...m.answers}};
    m.attempts.push(attempt);if(m.attempts.length>30)m.attempts.shift();
    m.submitted=true;return result;
  }
  function report(data,id,questions){
    const m=moduleState(data,id);
    const learned=[0,1,2].filter(n=>m.visited.includes(`theory-${n}`)).length;
    const checked=m.attempts.some(a=>a.score>=4&&a.total===5);
    const core=Boolean(m.diagnostic)+learned+Number(m.visited.includes('technique'))+Number(m.visited.includes('practice'))+Number(Boolean(m.transferEntryId))+Number(checked);
    const units=core+Number(m.visited.includes('connections'));
    const mastered=core===8;
    const last=m.attempts[m.attempts.length-1]||null;
    const missing=[];
    if(!m.diagnostic)missing.push('Входной кейс');
    if(learned<3)missing.push('Три учебных блока');
    if(!m.visited.includes('technique'))missing.push('Применение техники');
    if(!m.visited.includes('practice'))missing.push('Практика по критериям');
    if(!m.transferEntryId)missing.push('План в личном дневнике');
    if(!checked)missing.push('Мини-тест: не менее 4 из 5');
    return {progress:mastered?100:Math.min(99,Math.round(units/9*100)),mastered,last,missing,learned,checked,current:score(questions,m.answers)};
  }
  root.CourseModel={course,moduleState,ensure,mark,score,submit,report,emptyCourse};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.CourseModel;
})(typeof globalThis!=='undefined'?globalThis:window);
