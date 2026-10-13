const {test}=require('node:test'),assert=require('node:assert/strict');
const {upgradeRecord,needsUpgrade}=require('../assets/arcade/upgrade.js');
test('old sprint, approach and meeting are archived once and ordinary entry gets current model',()=>{
  for(const [id,version] of [['sprint',2],['hybrid',3],['meeting',2],['ethics',2],['change',2]]){const game=require('../assets/arcade/'+id+'.js'),old=game.create('old-'+id);old.custom={keep:true};const course={arcadeGames:{[id]:old,telephone:{untouched:true}},arcadeArchives:{[id]:[]}};assert.ok(needsUpgrade(id,old));assert.ok(upgradeRecord(course,id,game.create));assert.deepEqual(course.arcadeArchives[id][0],old);assert.equal(course.arcadeGames[id].modelVersion,version);assert.ok(game.validate(course.arcadeGames[id]));assert.equal(upgradeRecord(course,id,game.create),false);assert.equal(course.arcadeArchives[id].length,1);assert.equal(course.arcadeGames.telephone.untouched,true);}
});
