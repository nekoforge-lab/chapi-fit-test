const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const FO=require('./food-fixed-operations');
const FA=require('./food-fixed-slot-adapter');
const SL=require('./food-slots');
const settings=SL.defaults();
const day={meals:{breakfast:{kcal:210,p:10,f:5,c:25,note:'keep'},lunch:{kcal:500,p:25,f:15,c:60}},foodV2:{format:'chapi-food-day-2-draft',slots:[{slotId:'breakfast',slotName:'朝食',slotOrder:0,meal:{format:'chapi-food-record-2-draft',totalMode:'manual',manualTotal:{kcal:210,p:10,f:5,c:25},entries:[{kind:'ingredient',name:'卵',kcal:90}]}}]}};
test('fixed-slot structured editor rejects null instead of silently deleting',()=>assert.throws(()=>FA.setFixedMeal(day,true,settings,'breakfast',null)));
test('fixed-slot deletion clears both projections, preserves unrelated meal and source',()=>{
 const before=JSON.stringify(day);
 const next=FO.apply(day,true,settings,'breakfast',null);
 assert.equal(next.foodV2.slots.find(x=>x.slotId==='breakfast').meal,null);
 assert.deepEqual(next.meals.breakfast,{});
 assert.deepEqual(next.meals.lunch,day.meals.lunch);
 assert.equal(JSON.stringify(day),before);
});
test('UI deletion now routes fixed slot through atomic operation',()=>{
 const source=fs.readFileSync('app.js','utf8');
 assert.match(source,/meal===null\?FO\.apply\(base,existing,store\.foodSlotSettings\|\|SL\.defaults\(\),id,null\)/);
});
test('fixed structured save still routes through adapter',()=>{
 const source=fs.readFileSync('app.js','utf8');
 assert.match(source,/FA\.setFixedMeal\(base,existing,store\.foodSlotSettings\|\|SL\.defaults\(\),id,meal\)/);
});
