const {test}=require('node:test'),assert=require('node:assert/strict');
const {initialBehavior,evaluateBehavior}=require('../assets/activities/behavior-model.js');
test('promotion changes required functions without assigning a personality type',()=>{
  const s=initialBehavior(3),base=evaluateBehavior(3,s);const changed=evaluateBehavior(3,{...s,personal:false,order:'colleague',future:'colleague',integration:'colleague'});
  assert.notDeepEqual(base,changed);assert.match(changed[0],/4 из 4/);
});
test('message needs, real influence and incentives react to observed conditions',()=>{
  assert.notDeepEqual(evaluateBehavior(5,initialBehavior(5)),evaluateBehavior(5,{recipient:'facts',opening:'facts',detail:'detailed'}));
  assert.match(evaluateBehavior(6,{permission:'sponsor',information:'expert',veto:'operations',link:'coordinator'})[0],/4 из 4/);
  assert.notDeepEqual(evaluateBehavior(9,initialBehavior(9)),evaluateBehavior(9,{punish:false,rewrite:false,kpi:false,policy:'conditions'}));
});
