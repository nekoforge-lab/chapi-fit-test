/* Day-specific slot snapshots. Pure: no storage or DOM. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFoodDaySlots=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const BASE=[{id:'breakfast',name:'朝食',order:0,active:true},{id:'lunch',name:'昼食',order:1,active:true},{id:'dinner',name:'夕食',order:2,active:true},{id:'snack',name:'間食',order:3,active:true}];
function snapshot(day,existingDay,settings){
 if(Array.isArray(day?.foodV2?.slots)&&day.foodV2.slots.length)return clone(day.foodV2.slots);
 // An empty slots array may be produced by a migrated/auto-saved blank day.
 // Restore only the four historical fixed slots, never later custom slots.
 if(Array.isArray(day?.foodV2?.slots)&&day.foodV2.slots.length===0)return BASE.map(s=>({slotId:s.id,slotName:s.name,slotOrder:s.order,meal:null}));
 // A previously saved day must never acquire slots created after that date.
 const source=existingDay?BASE:(settings||BASE);
 return source.filter(s=>s.active).sort((a,b)=>a.order-b.order).map(s=>({slotId:s.id,slotName:s.name,slotOrder:s.order,meal:null}));
}
function withMeal(day,existingDay,settings,id,meal){
 const out=clone(day),slots=snapshot(day,existingDay,settings);
 const target=slots.find(s=>s.slotId===id);if(!target)throw Error('この日には食事枠がありません');
 target.meal=meal===null?null:clone(meal);
 out.foodV2={format:'chapi-food-day-2-draft',slots};return out;
}
return Object.freeze({snapshot,withMeal});
});
