export const channels={
  talk:{name:'Устно',cost:0,description:'Быстро, можно передать цель и контекст; точные условия уязвимы.',noise:{goal:.1,deadline:.28,owner:.25,criteria:.31,constraint:.29,priority:.16,context:.11}},
  email:{name:'Письмо',cost:1,description:'Письменный след защищает критерий и ограничение; контекст могут сократить.',noise:{goal:.18,deadline:.07,owner:.14,criteria:.1,constraint:.08,priority:.16,context:.25}},
  tracker:{name:'Задача / трекер',cost:0,description:'Срок и владелец в полях; сложный контекст и границы могут сжаться.',noise:{goal:.26,deadline:.04,owner:.04,criteria:.17,constraint:.25,priority:.08,context:.35}},
  sync:{name:'Разбор + фиксация',cost:2,description:'Разговор и резюме хорошо защищают цель; расход ресурса выше.',noise:{goal:.06,deadline:.08,owner:.08,criteria:.08,constraint:.1,priority:.1,context:.07}}
};
export const roleFilters={
  head:{name:'Руководитель',bias:{goal:.03,deadline:0,owner:0,criteria:.08,constraint:.02,priority:0,context:.1}},
  coordinator:{name:'Координатор',bias:{goal:.09,deadline:0,owner:0,criteria:.04,constraint:.08,priority:.03,context:.12}},
  executor:{name:'Исполнитель',bias:{goal:.01,deadline:.03,owner:.1,criteria:.02,constraint:.02,priority:.09,context:.09}},
  contractor:{name:'Подрядчик',bias:{goal:.05,deadline:.01,owner:.03,criteria:.1,constraint:.1,priority:.02,context:.12}},
  recipient:{name:'Получатель',bias:{goal:.02,deadline:.03,owner:.05,criteria:.05,constraint:.05,priority:.07,context:.08}}
};
