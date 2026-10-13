export const currentVersions={hybrid:3,sprint:2,meeting:2,ethics:2,change:2};
export function needsUpgrade(id,saved){return Boolean(saved&&currentVersions[id]&&saved.modelVersion!==currentVersions[id]);}
export function upgradeRecord(course,id,create){
  const old=course.arcadeGames?.[id];if(!needsUpgrade(id,old))return false;
  course.arcadeArchives??={};course.arcadeArchives[id]=[...(course.arcadeArchives[id]||[]),structuredClone(old)].slice(-10);
  course.arcadeGames[id]=create(old.seed,{modelVersion:currentVersions[id]});return true;
}
