const root=globalThis;
  function shuffle(count,random=Math.random){const order=Array.from({length:count},(_,i)=>i);for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}return order;}
  function valid(order,count){return Array.isArray(order)&&order.length===count&&new Set(order).size===count&&order.every(i=>Number.isInteger(i)&&i>=0&&i<count);}
  function order(store,profile,key,count){
    const saved=store.profile(profile).data.course?.optionOrders?.[key];if(valid(saved,count))return saved;
    const random=()=>{if(root.crypto?.getRandomValues){const a=new Uint32Array(1);root.crypto.getRandomValues(a);return a[0]/4294967296;}return Math.random();};
    const values=shuffle(count,random);
    store.update(profile,d=>{if(!d.course)d.course={};if(!d.course.optionOrders)d.course.optionOrders={};d.course.optionOrders[key]=values;});return values;
  }
export {shuffle,valid,order};
