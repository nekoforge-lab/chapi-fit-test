/* Pure v2 meal aggregation; no storage writes. Draft migrations stay on legacy totals. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFoodTotalsBridge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FIELDS=['kcal','p','f','c'];
const valid=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))&&Number(v)>=0;
const empty=()=>({kcal:0,p:0,f:0,c:0});
function nutrients(src){const out={};for(const k of FIELDS)out[k]=valid(src?.[k])?Number(src[k]):null;return out;}
function entryValues(entry){if(entry.kind==='dish'){
 if(entry.calculationMode==='ingredients'){if(entry.recipeServings!==undefined&&entry.recipeServings!==null){const v=addEntries(entry.ingredients||[]);const servings=Number(entry.recipeServings),eaten=Number(entry.quantity);if(!(servings>0)||!(eaten>=0)||entry.unit!=='皿')throw Error('皿数が不正');return Object.fromEntries(FIELDS.map(k=>[k,v[k]===null?null:Math.round(v[k]*eaten/servings*10000)/10000]));}return addEntries(entry.ingredients||[]);}
 return nutrients(entry.estimate);
 }return nutrients(entry);
}
function addEntries(entries){if(!Array.isArray(entries))throw Error('明細の形式が不正');const total=empty(),known={kcal:true,p:true,f:true,c:true};
 for(const entry of entries){if(!entry||typeof entry!=='object')throw Error('明細が不正');const v=entryValues(entry);for(const k of FIELDS){if(v[k]===null)known[k]=false;else total[k]+=v[k];}}
 return Object.fromEntries(FIELDS.map(k=>[k,known[k]&&entries.length?total[k]:null]));
}
function adopted(meal){if(!meal||typeof meal!=='object')throw Error('食事が不正');if(meal.skipped===true)return empty();
 if(meal.totalMode==='legacy')return nutrients(meal.manualTotal);
 if(meal.totalMode==='manual')return nutrients(meal.manualTotal);
 return addEntries(meal.entries||[]);
}
function totals(day){
 if(day?.foodV2?.format==='chapi-food-day-2-draft'){
  // Fixed slots with structured records use their adopted totals. Legacy-only
  // slots retain legacy values. This is read-only; never reconcile on disk.
  const slots=day.foodV2.slots;
  if(!Array.isArray(slots))throw Error('食事枠が不正');
  const total=empty(),count=empty();let hasMark=false;
  const fixed=['breakfast','lunch','dinner','snack'];
  const selected=new Map();
  for(const id of fixed){
   const m=day.meals?.[id];
   const structured=slots.find(s=>s?.slotId===id)?.meal;
   if(structured&&structured.totalMode!=='legacy')selected.set(id,adopted(structured));
   else if(m)selected.set(id,m.skipped===true?empty():nutrients(m));
   if(structured||m)hasMark=true;
  }
  for(const slot of slots){
   if(!slot||typeof slot.slotId!=='string')throw Error('食事枠IDが不正');
   if(fixed.includes(slot.slotId)||slot.meal==null)continue;
   selected.set(slot.slotId,adopted(slot.meal));hasMark=true;
  }
  for(const values of selected.values())for(const k of FIELDS){const v=values[k];if(valid(v)){total[k]+=Number(v);count[k]++;}}
  const complete=['breakfast','lunch','dinner'].every(id=>valid(selected.get(id)?.kcal));
  return {total,count,complete,hasMark};
 }
 if(day?.foodV2?.format!=='chapi-food-day-2')return null;
 const slots=day.foodV2.slots;if(!Array.isArray(slots))throw Error('食事枠が不正');const total=empty(),count=empty();const present=new Set();let hasMark=false;
 for(const slot of slots){if(!slot||typeof slot.slotId!=='string'||present.has(slot.slotId))throw Error('食事枠IDが不正');present.add(slot.slotId);
 if(slot.meal==null)continue;const m=slot.meal;const v=adopted(m);hasMark=true;
 for(const k of FIELDS)if(valid(v[k])){total[k]+=v[k];count[k]++;}
 }
 const complete=['breakfast','lunch','dinner'].every(id=>{const slot=slots.find(x=>x.slotId===id);if(!slot?.meal)return false;return slot.meal.skipped===true||valid(adopted(slot.meal).kcal);});
 return {total,count,complete,hasMark};
}
return Object.freeze({totals,adopted});
});
