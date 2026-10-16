/* Fixed-slot structured meal bridge. No DOM/storage side effects. */
(function(root,factory){const api=factory(
 typeof module==='object'&&module.exports?require('./food-day-slots'):root.ChapiFoodDaySlots,
 typeof module==='object'&&module.exports?require('./food-totals-bridge'):root.ChapiFoodTotalsBridge
);if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFixedSlotAdapter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(DS,TB){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const IDS=new Set(['breakfast','lunch','dinner','snack']);
const FIELDS=['kcal','p','f','c'];
const valid=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0;
function setFixedMeal(day,existingDay,settings,id,structured){
 if(!IDS.has(id))throw Error('固定食事枠のIDが不正');
 if(!structured||!['manual','auto','legacy'].includes(structured.totalMode)||!Array.isArray(structured.entries||[]))throw Error('食事明細の形式が不正');
 const totals=TB.adopted(structured);
 // Legacy consumers cannot represent an unknown value as a numeric zero.
 const nextLegacy={...(day.meals?.[id]||{})};
 for(const key of FIELDS)nextLegacy[key]=valid(totals[key])?Number(totals[key]):'';
 nextLegacy.skipped=structured.skipped===true;
 nextLegacy.note=structured.note??nextLegacy.note??'';
 const out=DS.withMeal(day,existingDay,settings,id,structured);
 out.meals={...(out.meals||{}),[id]:nextLegacy};
 return out;
}
return Object.freeze({setFixedMeal});
});
