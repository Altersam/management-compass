// Курс: 10 тем. В каждой — лекционная выжимка по разделам исходников, 3 урока практики и испытание.
import t1 from './course/t1.js';
import t2 from './course/t2.js';
import t3 from './course/t3.js';
import t4 from './course/t4.js';
import t5 from './course/t5.js';
import t6 from './course/t6.js';
import t7 from './course/t7.js';
import t8 from './course/t8.js';
import t9 from './course/t9.js';
import t10 from './course/t10.js';

export const course = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10];
export const unitById = id => course.find(u => String(u.id) === String(id));
export const LEVELS = ['Основы', 'Применение', 'Ситуации'];
