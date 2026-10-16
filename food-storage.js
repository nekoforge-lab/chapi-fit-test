/* Food v3.9: pure, non-writing persistence preparation and validation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFoodStorage=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function assertDay(day){
 if(!day||typeof day!=='object'||Array.isArray(day))throw Error('日別記録が不正');
 if(day.foodV2===undefined)return;
 const food=day.foodV2;
 if(!food||!['chapi-food-day-2-draft','chapi-food-day-2'].includes(food.format)||!Array.isArray(food.slots))throw Error('食事データ形式が不正');
 const ids=new Set();
 for(const s of food.slots){
  if(!s||typeof s.slotId!=='string'||!s.slotId||ids.has(s.slotId)||typeof s.slotName!=='string'||!s.slotName||!Number.isInteger(s.slotOrder)||s.meal!==null&&(typeof s.meal!=='object'||Array.isArray(s.meal)))throw Error('食事枠データが不正');
  if(s.meal!==null){
   if(!['chapi-food-record-2-draft','chapi-food-record-2'].includes(s.meal.format))throw Error('食事レコード形式が不正');
   if(s.meal.entries!==undefined&&!Array.isArray(s.meal.entries))throw Error('食事明細が不正');
   if(s.meal.manualTotal!==undefined&&(s.meal.manualTotal===null||typeof s.meal.manualTotal!=='object'||Array.isArray(s.meal.manualTotal)))throw Error('食事合計が不正');
   for(const key of ['kcal','p','f','c']){const v=s.meal.manualTotal?.[key];if(v!==undefined&&v!==null&&(v===''||!Number.isFinite(Number(v))||Number(v)<0))throw Error('食事合計の数値が不正');}
  }
  ids.add(s.slotId);
 }
}
function validate(store,slots){
 if(!store||typeof store!=='object'||Array.isArray(store)||!store.days||typeof store.days!=='object'||Array.isArray(store.days)||!Array.isArray(store.templates))throw Error('保存データが不正');
 for(const [date,day] of Object.entries(store.days)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('日付が不正');
  assertDay(day);
 }
 if(store.foodSlotSettings!==undefined)slots.validate(store.foodSlotSettings);
 return true;
}
function prepare(store,slots,migration,settings){
 validate(store,slots);
 const before=clone(store);
 const next=migration.convertStore(before);
 next.foodSlotSettings=clone(settings||next.foodSlotSettings||slots.defaults());
 slots.validate(next.foodSlotSettings);
 validate(next,slots);
 const pending={...before,days:Object.fromEntries(Object.entries(before.days).filter(([,day])=>day.foodV2===undefined))};
 const report=migration.audit(pending,next);
 if(!report.ok)throw Error('旧記録の保持に失敗: '+report.issues.join(', '));
 for(const date of Object.keys(before.days)){
  const b=before.days[date],a=next.days[date];
  for(const key of Object.keys(b))if(key!=='foodV2'&&!same(b[key],a[key]))throw Error(date+' の既存情報が変更された');
 }
 return {next,original:JSON.stringify(store),changed:!same(store,next),report};
}
function commit(storage,key,plan,slots){
 if(!plan||typeof plan.original!=='string')throw Error('移行計画が不正');
 const current=storage.getItem(key);
 if(current!==plan.original)throw Error('保存内容が別の操作で更新されたため中止');
 validate(plan.next,slots);
 const safetyKey=key+'-before-food-v39';
 if(storage.getItem(safetyKey)===null)storage.setItem(safetyKey,current);
 // The caller owns the plan. No deletion of old storage or backup.
 storage.setItem(key,JSON.stringify(plan.next));
 return true;
}
function parseBackup(text,core,slots){
 const payload=JSON.parse(text);
 if(payload?.app!=='chapi-training')throw Error('Chapi Fitのバックアップではない');
 const input=payload.store||(payload.data?core.fromV1(payload.data):null);
 const restored=core.migrate(input);
 core.validateStore(restored);validate(restored,slots);
 return restored;
}
return Object.freeze({validate,prepare,commit,parseBackup});
});
