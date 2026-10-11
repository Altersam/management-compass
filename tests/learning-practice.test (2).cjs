const {test}=require('node:test'),assert=require('node:assert/strict');
const {productive,scheduleReviews,reviewFor}=require('../assets/learning-practice.js');
const {blank}=require('../assets/store.js');
test('remaining questions return at spaced dates, scheduling is idempotent and answers stay canonical',()=>{
  const data=blank();data.course={modules:{3:{answers:{'m3-q3':2}}}};
  scheduleReviews(data,3,'2026-10-10');scheduleReviews(data,3,'2026-10-10');assert.equal(data.learning.reviews.length,3);
  assert.deepEqual(data.learning.reviews.map(r=>r.due),['2026-10-11','2026-10-13','2026-10-17']);
  assert.equal(reviewFor(data,4,'2026-10-10'),null);assert.equal(reviewFor(data,5,'2026-10-11').id,'m3-q3');assert.equal(data.course.modules[3].answers['m3-q3'],2);
});
test('eight micro-exercises ask for authored responses with specific criteria',()=>{
  assert.equal(Object.keys(productive).length,8);for(const exercise of Object.values(productive)){assert.equal(exercise.criteria.length,3);assert.ok(exercise.prompt.length>20&&exercise.example.length>30);}
});
