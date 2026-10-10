/* Temporary migration boundary. Do not author new content in the legacy layers. */
import {schemaVersion} from './topic-schema.js';
const kinds=['workday','dependency','autonomy','ethics','communication','organization-map','document-flow','process','change','metrics'];

export function topicsFromLegacy({handbook,course,pedagogy}){
  return handbook.chapters.map(reference=>{
    const id=reference.id,lesson=course.modules.find(m=>m.id===id),learning=pedagogy.topics[id];
    return {
      schemaVersion,id,title:lesson.title,
      concepts:reference.terms.map(([name,meaning])=>({name,meaning})),misconceptions:[],
      scene:{title:learning.scene,lead:learning.lead},explanations:learning.blocks,
      activity:{kind:kinds[id-1]},techniques:reference.techniques,
      cases:handbook.cases.filter(c=>c.chapter===id).map(c=>({...c,options:c.options.map((text,i)=>({text,appeal:c.appeals?.[i]||'',analysis:c.feedback[i]}))})),
      questions:course.questions[id],retrievalQuestions:[],navigatorSignals:[],
      requiredBehavior:[],incentives:[],informalActors:[],functionNeeds:[],simulationHooks:[],
      references:[{page:lesson.adizes.page,title:lesson.adizes.title}],bridge:learning.bridge,
      reference,course:lesson
    };
  });
}

export function legacyViews(topics){
  return {
    chapters:topics.map(t=>({...t.reference,techniques:t.techniques})),
    modules:topics.map(t=>({...t.course,title:t.title,blockTitles:t.explanations.map(b=>b.title),next:t.bridge})),
    questions:Object.fromEntries(topics.map(t=>[t.id,t.questions])),
    topics:Object.fromEntries(topics.map(t=>[t.id,{scene:t.scene.title,lead:t.scene.lead,blocks:t.explanations,bridge:t.bridge}])),
    cases:topics.flatMap(t=>t.cases.map(c=>({...c,options:c.options.map(o=>o.text),appeals:c.options.map(o=>o.appeal),feedback:c.options.map(o=>o.analysis)})))
  };
}
