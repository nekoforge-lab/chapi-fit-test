/* Chapi Fit food domain foundation. Not wired into production UI/storage yet. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFoodModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FIELDS=['kcal','p','f','c'];
const isValue=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))&&Number(v)>=0;
const zero=()=>({kcal:0,p:0,f:0,c:0});
function sum(items){const out=zero();const known={kcal:0,p:0,f:0,c:0};for(const item of items||[]){for(const f of FIELDS){if(isValue(item?.[f])){out[f]+=Number(item[f]);known[f]++;}}}return {total:out,known};}
function adoptedDish(dish){if(!dish||typeof dish!=='object')throw Error('料理データが不正');const mode=dish.calculationMode||'estimate';if(mode==='ingredients')return sum(dish.ingredients||[]).total;if(mode==='estimate'&&FIELDS.every(f=>isValue(dish.estimate?.[f])))return Object.fromEntries(FIELDS.map(f=>[f,Number(dish.estimate[f])]));throw Error('採用値が不完全');}
function adoptedMeal(meal){if(!meal||typeof meal!=='object')throw Error('食事データが不正');if(meal.skipped===true)return zero();if(meal.totalMode==='manual'){if(!FIELDS.every(f=>isValue(meal.manualTotal?.[f])))throw Error('手動合計が不完全');return Object.fromEntries(FIELDS.map(f=>[f,Number(meal.manualTotal[f])]));}const entries=(meal.entries||[]).map(entry=>entry.kind==='dish'?adoptedDish(entry):Object.fromEntries(FIELDS.map(f=>[f,entry[f]])));return sum(entries).total;}
function snapshotSlot(slot,meal){if(!slot||typeof slot.id!=='string'||!slot.id||typeof slot.name!=='string'||!Number.isInteger(slot.order))throw Error('食事枠が不正');return {slotId:slot.id,slotName:slot.name,slotOrder:slot.order,meal:JSON.parse(JSON.stringify(meal??null))};}
return Object.freeze({FIELDS,isValue,sum,adoptedDish,adoptedMeal,snapshotSlot});
});
