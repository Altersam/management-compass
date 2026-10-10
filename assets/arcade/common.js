export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function seedNumber(seed){let value=2166136261;for(const char of String(seed))value=Math.imul(value^char.charCodeAt(0),16777619);return value>>>0;}
export function random(state){state.rng=(state.rng+0x6D2B79F5)>>>0;let n=state.rng;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;}
export const clone=state=>structuredClone(state);
export const clamp=(n,low=0,high=100)=>Math.max(low,Math.min(high,n));
export function initial(seed){return {revision:1,seed:String(seed).slice(0,80),rng:seedNumber(seed),phase:'playing',turn:0,history:[],note:''};}
export function assertPlaying(state){if(state.phase!=='playing')throw new Error('Игра завершена. Можно начать новую попытку.');}
export function record(state,action,text){state.history.push({turn:state.turn,type:action.type,text});}
export const button=(type,text,extra='',disabled=false)=>`<button type="button" data-action="${type}" ${extra} ${disabled?'disabled':''}>${text}</button>`;
export function select(name,label,options,value){return `<label>${label}<select name="${name}">${options.map(([id,text])=>`<option value="${id}" ${String(value)===String(id)?'selected':''}>${text}</option>`).join('')}</select></label>`;}
export const noteField=(prompt,value='')=>`<label>${prompt}<textarea name="note" maxlength="2000">${esc(value)}</textarea></label>`;
export function summary(metrics,insights,extra={}){return {metrics,insights,...extra};}
export function basicValid(state){return state&&state.revision===1&&typeof state.seed==='string'&&Number.isInteger(state.rng)&&['playing','ended'].includes(state.phase)&&Array.isArray(state.history)&&Number.isInteger(state.turn)&&state.turn>=0;}
