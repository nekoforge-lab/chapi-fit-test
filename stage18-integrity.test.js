const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const FO=require('./food-fixed-operations');
const slots=['breakfast','lunch','dinner','snack'].map((id,i)=>({id,name:['朝食','昼食','夕食','間食'][i],order:i,active:true}));
const record={format:'chapi-food-record-2-draft',totalMode:'manual',manualTotal:{kcal:333,p:12,f:8,c:50},entries:[{kind:'ingredient',name:'米',kcal:300,p:6,f:1,c:65}],note:'original'};
function fixture(){return {meals:{breakfast:{kcal:333,p:12,f:8,c:50,note:'original'},lunch:{kcal:450,p:20,f:10,c:70}},foodV2:{format:'chapi-food-day-2-draft',slots:slots.map(x=>({slotId:x.id,slotName:x.name,slotOrder:x.order,meal:x.id==='breakfast'?structuredClone(record):null}))},unknownField:{keep:true}}}
test('structured copy survives JSON roundtrip and retains target day snapshot',()=>{
 const src=fixture(),dst=fixture();dst.foodV2.slots[0].slotName='朝ごはん（当日）';
 const out=FO.copy(src,dst,true,true,slots,'breakfast'),round=JSON.parse(JSON.stringify(out));
 assert.equal(round.foodV2.slots[0].slotName,'朝ごはん（当日）');
 assert.deepEqual(round.foodV2.slots[0].meal,record);
 assert.equal(round.meals.breakfast.kcal,333);
 assert.equal(round.meals.lunch.kcal,450);
 assert.deepEqual(round.unknownField,{keep:true});
 assert.deepEqual(src.foodV2.slots[0].meal,record);
});
test('delete after structured copy does not delete other meals or fields',()=>{
 const src=fixture(),out=FO.apply(src,true,slots,'breakfast',null);
 assert.equal(out.foodV2.slots[0].meal,null);
 assert.deepEqual(out.meals.breakfast,{});
 assert.deepEqual(out.meals.lunch,src.meals.lunch);
 assert.deepEqual(out.unknownField,src.unknownField);
 assert.equal(src.meals.breakfast.kcal,333);
});
test('AI legacy replacement after structured meal does not leave hidden details',()=>{
 const src=fixture(),out=FO.apply(src,true,slots,'breakfast',{legacy:{kcal:210,p:10,f:5,c:30,aiItems:[{name:'食品'}]}});
 assert.equal(out.foodV2.slots[0].meal,null);
 assert.equal(out.meals.breakfast.kcal,210);
 assert.equal(out.meals.lunch.kcal,450);
});
test('failed invalid replacement leaves original byte-for-byte intact',()=>{
 const src=fixture(),before=JSON.stringify(src);
 assert.throws(()=>FO.apply(src,true,slots,'breakfast',{structured:{format:'bad'}}));
 assert.equal(JSON.stringify(src),before);
});
test('existing release assertions require a label not present in development build',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/<small class="build-label">v3\.9 Stage 32<\/small>/);
 assert.doesNotMatch(html,/v3\.9 正規版/);
});
