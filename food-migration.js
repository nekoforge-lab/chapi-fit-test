/* Non-destructive food migration draft. No storage writes or UI changes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFoodMigration=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEYS=['breakfast','lunch','dinner','snack'];
const NAMES={breakfast:'朝食',lunch:'昼食',dinner:'夕食',snack:'間食'};
const FIELDS=['kcal','p','f','c'];
const copy=x=>JSON.parse(JSON.stringify(x));
const valid=x=>x!==''&&x!==null&&x!==undefined&&Number.isFinite(Number(x))&&Number(x)>=0;
function convertMeal(legacy){
 if(!legacy||typeof legacy!=='object'||Array.isArray(legacy))throw Error('旧食事レコードが不正');
 // Preserve the original record verbatim. Never infer missing PFC as zero.
 const manualTotal=Object.fromEntries(FIELDS.map(k=>[k,valid(legacy[k])?Number(legacy[k]):null]));
 return {format:'chapi-food-record-2-draft',legacy:copy(legacy),skipped:legacy.skipped===true,
   totalMode:'legacy',manualTotal,entries:[]};
}
function convertDay(day){
 if(!day||typeof day!=='object'||Array.isArray(day))throw Error('日別レコードが不正');
 const out=copy(day);if(out.foodV2!==undefined)return out; // idempotent, no overwrite
 const slots=[];const old=day.meals||{};
 if(typeof old!=='object'||Array.isArray(old))throw Error('旧食事記録が不正');
 for(const [index,key] of KEYS.entries()){
  if(!Object.prototype.hasOwnProperty.call(old,key))continue;
  slots.push({slotId:key,slotName:NAMES[key],slotOrder:index,meal:convertMeal(old[key])});
 }
 out.foodV2={format:'chapi-food-day-2-draft',slots};
 return out;
}
function convertStore(store){
 if(!store||typeof store!=='object'||Array.isArray(store)||!store.days||typeof store.days!=='object'||Array.isArray(store.days))throw Error('保存データが不正');
 const out=copy(store);
 for(const [date,day] of Object.entries(store.days)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('日付が不正');
  out.days[date]=convertDay(day);
 }
 return out;
}
function audit(store,converted){
 const issues=[];
 for(const [date,day] of Object.entries(store.days)){
  const after=converted.days[date];
  if(JSON.stringify(day.meals)!==JSON.stringify(after.meals))issues.push(date+':旧食事記録が変化');
  for(const key of KEYS){
   if(!Object.prototype.hasOwnProperty.call(day.meals||{},key))continue;
   const record=after.foodV2?.slots.find(s=>s.slotId===key);
   if(!record||JSON.stringify(record.meal.legacy)!==JSON.stringify(day.meals[key]))issues.push(date+':'+key+'の原本不一致');
  }
 }
 return {ok:issues.length===0,issues};
}
return Object.freeze({convertMeal,convertDay,convertStore,audit});
});
