export const ethicalArchetypes=['merit_vs_fairness','rules_vs_outcome','individual_vs_team','short_term_vs_long_term','conflict_of_interest','equality_vs_equity','transparency_vs_privacy','loyalty_vs_integrity','risk_vs_speed','efficiency_vs_duty','consistency_vs_exception','authority_vs_evidence','fairness_vs_blame','fairness_vs_reputation'];
export const principles={
  fairness:{name:'Справедливость',text:'Сопоставимые участники оцениваются по сопоставимым правилам; различия имеют объяснимое основание.'},
  utility:{name:'Польза',text:'Какой вариант даст организации или людям реальный результат, а не только удобный показатель.'},
  rules:{name:'Правила',text:'Соблюдены ли процедура, полномочия и заранее объявленные критерии.'},
  care:{name:'Люди',text:'Как решение повлияет на конкретных людей, доверие и рабочие отношения.'},
  safety:{name:'Риск',text:'Какой ущерб возникнет, если существенное предположение окажется ошибочным.'},
  sustainability:{name:'Устойчивость',text:'Продолжит ли решение работать после изменения условий и появления новой информации.'}
};
// Profiles are competing emphases, never a moral ordering or a single best choice.
export const decisionProfiles=[
  {utility:9,fairness:4,rules:5,care:4,safety:3,sustainability:4},
  {utility:6,fairness:8,rules:6,care:8,safety:6,sustainability:7},
  {utility:4,fairness:7,rules:9,care:5,safety:8,sustainability:6},
  {utility:7,fairness:6,rules:7,care:6,safety:8,sustainability:8}
];
