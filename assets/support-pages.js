import {CourseUI} from './course-ui.js';
import * as Experiments from './experiments.js';
(() => {const C=CourseUI;C.mount();const settings=document.getElementById('settingsRoot');if(settings)C.settings(settings);const experiments=document.getElementById('experimentsRoot');if(experiments)Experiments.render(experiments,C.S,C.active);document.querySelectorAll('a[href]').forEach(a=>{const url=new URL(a.href);if(url.origin===location.origin)a.href=C.link(a.getAttribute('href'));});})();
