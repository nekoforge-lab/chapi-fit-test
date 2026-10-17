/* Read-only discrepancy detection for fixed meal slots; never reconciles stored data. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFoodConsistencyDiagnostic=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const fields=['kcal','p','f','c'];
function inspect(day,bridge){
 const out=[];
 if(day?.foodV2?.format!=='chapi-food-day-2-draft'||!Array.isArray(day.foodV2.slots))return out;
 for(const slot of day.foodV2.slots){
  if(!['breakfast','lunch','dinner','snack'].includes(slot?.slotId)||!slot.meal||slot.meal.totalMode==='legacy')continue;
  const legacy=day.meals?.[slot.slotId];if(!legacy)continue;
  let adopted;try{adopted=bridge.adopted(slot.meal);}catch(e){out.push({slotId:slot.slotId,field:'invalid',reason:String(e.message)});continue;}
  for(const field of fields){const a=adopted[field],b=legacy[field];
   if(a===null||a===undefined||b===null||b===undefined||b==='')continue;
   if(!Number.isFinite(Number(a))||!Number.isFinite(Number(b)))continue;
   if(Math.abs(Number(a)-Number(b))>0.01)out.push({slotId:slot.slotId,field,legacy:Number(b),detail:Number(a)});
  }
 }
 return out;
}
return Object.freeze({inspect});
});
