/* Atomic, pure fixed-slot food operations. No storage or DOM. */
(function(root,factory){const api=factory(
 typeof module==='object'&&module.exports?require('./food-day-slots'):root.ChapiFoodDaySlots,
 typeof module==='object'&&module.exports?require('./food-fixed-slot-adapter'):root.ChapiFixedSlotAdapter
);if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFixedOperations=api;})(typeof globalThis!=='undefined'?globalThis:this,function(DS,FA){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const IDS=new Set(['breakfast','lunch','dinner','snack']);
const structured=m=>m?.format==='chapi-food-record-2-draft';
function present(day,id){const s=day?.foodV2?.slots?.find(x=>x.slotId===id);const m=s?.meal;const old=day?.meals?.[id];return !!(m||old?.skipped||String(old?.note||'').trim()||['kcal','p','f','c'].some(k=>old?.[k]!==''&&old?.[k]!==null&&old?.[k]!==undefined)||old?.aiItems?.length)}
function apply(day,existing,settings,id,replacement){
 if(!IDS.has(id))throw Error('固定食事枠が不正');
 const out=clone(day);
 const oldSlot=out.foodV2?.slots?.find(s=>s.slotId===id);
 if(oldSlot?.meal && oldSlot.meal.format!=='chapi-food-record-2-draft' && replacement?.structured)throw Error('未対応の食事形式は上書きできません');
 if(replacement===null){
  out.meals={...(out.meals||{}),[id]:{}};
  if(out.foodV2?.slots){const s=out.foodV2.slots.find(s=>s.slotId===id);if(s)s.meal=null;}
  return out;
 }
 if(replacement?.structured){
  if(!structured(replacement.structured))throw Error('食事明細の形式が不正');
  return FA.setFixedMeal(out,existing,settings,id,clone(replacement.structured));
 }
 if(!replacement||typeof replacement.legacy!=='object'||Array.isArray(replacement.legacy))throw Error('食事データが不正');
 out.meals={...(out.meals||{}),[id]:clone(replacement.legacy)};
 if(out.foodV2?.slots){const s=out.foodV2.slots.find(s=>s.slotId===id);if(s)s.meal=null;}
 return out;
}
function copy(source,target,sourceExisting,targetExisting,settings,id){
 if(!present(source,id))throw Error('コピー元は未記録');
 const sourceSlot=source?.foodV2?.slots?.find(s=>s.slotId===id);
 if(structured(sourceSlot?.meal))return apply(target,targetExisting,settings,id,{structured:sourceSlot.meal});
 return apply(target,targetExisting,settings,id,{legacy:source?.meals?.[id]||{}});
}
return Object.freeze({apply,copy,present});
});
