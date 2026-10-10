import '../content.js';
import '../knowledge.js';
import '../visuals.js';
import '../course-data.js';
import '../course-questions.js';
import '../learning-content.js';
import '../question-revision.js';
import {topicsFromLegacy} from '../../content/legacy-adapter.js';
import {mountLesson} from '../course-lesson.js';

const topics=topicsFromLegacy({handbook:window.HANDBOOK,course:window.COURSE,pedagogy:window.PEDAGOGY});
const requested=Number(new URLSearchParams(location.search).get('module'))||1;
mountLesson({topic:topics.find(t=>t.id===requested)||topics[0]});
