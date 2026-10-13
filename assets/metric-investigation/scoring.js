import {evidenceQuality} from './evidence.js';
import {diagnosisQuality} from './diagnosis.js';
import {designQuality} from './measurement.js';
import {periodStatus} from './period.js';
import {clamp} from './metric.js';
export function score(s){const evidence=evidenceQuality(s),design=designQuality(s),diagnosis=diagnosisQuality(s),status=periodStatus(s),components={investigation:30*evidence.value,diagnosis:25*diagnosis,main:25*design.main,guard:20*design.guard};let quality=Object.values(components).reduce((a,b)=>a+b,0);if(status==='lost')quality=Math.min(49,quality);if(status==='confidence')quality=Math.min(55,quality);if(!evidence.root||!evidence.independent)quality=Math.min(79,quality);quality=Math.round(clamp(quality));return {quality,grade:quality>=86?'A':quality>=72?'B':quality>=56?'C':quality>=40?'D':'F',status,components,evidence,diagnosis,design,realGain:s.rows.at(-1).real-s.rows[0].real,gamingChange:s.rows.at(-1).gaming-s.rows[0].gaming};}
