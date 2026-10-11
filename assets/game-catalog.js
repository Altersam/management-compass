import {catalog} from './arcade/catalog.js';
// Discovery metadata only; no renderer or engine is imported by the catalogue.
const categories={hybrid:'project',meeting:'people',ethics:'people',change:'people',telephone:'people',versions:'system',metrics:'system',flow:'system',sprint:'project',influence:'people'};
const featured=['project','detective','hybrid','meeting','change','metrics'];
export const gameCatalog=[
  {id:'project',title:'Проект под давлением',category:'project',href:'game.html',storage:'projectGame',time:'8–12 минут'},
  {id:'detective',title:'Найди разрыв',category:'system',href:'detective.html',storage:'detectiveGame',time:'5–8 минут'},
  ...catalog.map(meta=>({...meta,category:categories[meta.id],href:'trainer.html?game='+meta.id}))
].map(meta=>({...meta,featured:featured.includes(meta.id)}));
