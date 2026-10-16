const {test}=require('node:test');const assert=require('node:assert/strict');const DS=require('./food-day-slots');
const settings=[{id:'breakfast',name:'朝ごはん（新名称）',order:2,active:true},{id:'extra-1',name:'追加間食',order:0,active:true}];
test('empty migrated slot array restores historical four fixed slots, not custom settings',()=>{
 const out=DS.snapshot({foodV2:{format:'chapi-food-day-2-draft',slots:[]}},true,settings);
 assert.deepEqual(out.map(x=>x.slotId),['breakfast','lunch','dinner','snack']);
 assert.equal(out[0].slotName,'朝食');
});
test('nonempty historical slot snapshots retain their original names and order',()=>{
 const slots=[{slotId:'breakfast',slotName:'以前の朝食',slotOrder:8,meal:null}];
 assert.deepEqual(DS.snapshot({foodV2:{slots}},true,settings),slots);
});
test('empty-slot day accepts fixed structured meal while preserving legacy snapshot policy',()=>{
 const out=DS.withMeal({foodV2:{format:'chapi-food-day-2-draft',slots:[]}},true,settings,'breakfast',{format:'chapi-food-record-2-draft',totalMode:'manual',entries:[]});
 assert.equal(out.foodV2.slots.length,4);assert.equal(out.foodV2.slots[0].meal.format,'chapi-food-record-2-draft');
});
