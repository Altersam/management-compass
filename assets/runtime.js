import {createStore,WorkspaceUI} from './store.js';
import * as CourseModel from './course-model.js';

let adapter;
try{adapter=globalThis.localStorage;}catch(_){adapter=null;}
if(!adapter)adapter={getItem(){throw new Error('Unavailable');},setItem(){throw new Error('Unavailable');}};
const Workspace=createStore(adapter);

// Compatibility names for legacy renderers and existing browser integrations.
// Pure storage/progress modules themselves never register globals.
if(typeof window!=='undefined')Object.assign(window,{Workspace,WorkspaceUI,CourseModel});
export {Workspace,WorkspaceUI};
