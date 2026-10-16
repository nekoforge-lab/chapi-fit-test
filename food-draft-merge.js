/* Merge day-wide drafts without reverting separately saved food slots. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFoodDraftMerge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const IDS=['breakfast','lunch','dinner','snack'];
function merge(draft,snapshot,latest){
 const out=clone(draft);
 const before=snapshot||{};
 const current=latest||{};
 // A changed structured slot must not be silently replaced by a stale day draft.
 const prevSlots=before.foodV2?.slots||[];
 const liveSlots=current.foodV2?.slots||[];
 const draftSlots=draft.foodV2?.slots||[];
 const ids=new Set([...prevSlots,...liveSlots,...draftSlots].map(s=>s.slotId));
 const slot=(arr,id)=>arr.find(s=>s.slotId===id);
 const changedIds=[];
 for(const id of ids){
  const prev=slot(prevSlots,id),live=slot(liveSlots,id),edited=slot(draftSlots,id);
  if(same(prev,live))continue;
  if(!same(prev,edited)&&!same(live,edited))throw Error(id+' の食事明細が別の保存操作で変更されています');
  changedIds.push(id);
 }
 // Entire snapshot including custom slot order/name is replaced only when draft
 // has not independently changed the snapshot. Otherwise refuse a risky merge.
 if(!same(before.foodV2,current.foodV2)){
  if(same(before.foodV2,draft.foodV2))out.foodV2=clone(current.foodV2);
  else if(!same(current.foodV2,draft.foodV2))throw Error('食事枠の保存状態が変更されています');
 }
 for(const id of IDS){
  const prev=before.meals?.[id],live=current.meals?.[id],edited=draft.meals?.[id];
  if(same(prev,live))continue;
  if(!same(prev,edited)&&!same(live,edited))throw Error(id+' の食事入力が別の保存操作で変更されています');
  if(same(prev,edited)){
   out.meals??={};
   out.meals[id]=clone(live??{});
  }
 }
 return out;
}
return Object.freeze({merge});
});
