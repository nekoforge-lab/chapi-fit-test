const test=require('node:test');
const assert=require('node:assert/strict');
const SL=require('./food-slots.js');
const DS=require('./food-day-slots.js');
const FS=require('./food-storage.js');
const FM=require('./food-migration.js');
const C=require('./core.js');
const clone=x=>JSON.parse(JSON.stringify(x));
const base=()=>({days:{'2026-10-10':{meals:{breakfast:{kcal:400,p:20,f:10,c:50},snack:{kcal:120,p:'',f:'',c:''}}}},templates:[]});
function memory(initial){const m=new Map(Object.entries(initial));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),raw:m};}
test('旧日付の記録は移行後も原本と栄養集計が一致する',()=>{const old=base(),before=C.foodTotals(old.days['2026-10-10']);const plan=FS.prepare(old,SL,FM,SL.defaults());const after=C.foodTotals(plan.next.days['2026-10-10']);assert.deepEqual(after,before);assert.deepEqual(plan.next.days['2026-10-10'].meals,old.days['2026-10-10'].meals);assert.equal(plan.next.days['2026-10-10'].foodV2.slots.length,2);});
test('保存とJSON再読込で過去の枠名・食事・未入力PFCを維持',()=>{const old=base(),plan=FS.prepare(old,SL,FM,SL.defaults());const storage=memory({'chapi-training-v2':JSON.stringify(old)});FS.commit(storage,'chapi-training-v2',plan,SL);const restored=JSON.parse(storage.getItem('chapi-training-v2'));assert.equal(restored.days['2026-10-10'].foodV2.slots[1].slotName,'間食');assert.equal(restored.days['2026-10-10'].foodV2.slots[1].meal.manualTotal.p,null);assert.equal(storage.getItem('chapi-training-v2-before-food-v39'),JSON.stringify(old));assert.deepEqual(C.foodTotals(restored.days['2026-10-10']),C.foodTotals(old.days['2026-10-10']));});
test('保存中の競合更新は拒否し元データも保全',()=>{const old=base(),plan=FS.prepare(old,SL,FM,SL.defaults());const storage=memory({'chapi-training-v2':JSON.stringify(old)});const changed=clone(old);changed.days['2026-10-10'].note='other tab';storage.setItem('chapi-training-v2',JSON.stringify(changed));assert.throws(()=>FS.commit(storage,'chapi-training-v2',plan,SL),/更新/);assert.deepEqual(JSON.parse(storage.getItem('chapi-training-v2')),changed);});
test('新しい間食枠は過去日には増えず、新規日には増える',()=>{const settings=SL.change(SL.defaults(),{type:'add',id:'snack-stage11',name:'夜食'});const old=base();const migrated=FS.prepare(old,SL,FM,settings).next;assert.equal(DS.snapshot(migrated.days['2026-10-10'],true,settings).length,2);assert.equal(DS.snapshot({},false,settings).length,5);});
test('設定の改名・並び替えで既存日付のスナップショットは不変',()=>{const old=base(),migrated=FS.prepare(old,SL,FM,SL.defaults()).next;const original=clone(migrated.days['2026-10-10'].foodV2.slots);const changed=SL.change(SL.defaults(),{type:'rename',id:'snack',name:'おやつ'});assert.deepEqual(DS.snapshot(migrated.days['2026-10-10'],true,changed),original);});
