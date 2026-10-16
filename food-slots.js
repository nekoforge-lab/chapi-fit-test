/* Draft pure food slot management. Does not write storage or mutate inputs. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFoodSlots=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const FIXED=['breakfast','lunch','dinner'];
const DEFAULTS=[{id:'breakfast',name:'朝食',order:0,active:true},{id:'lunch',name:'昼食',order:1,active:true},{id:'dinner',name:'夕食',order:2,active:true},{id:'snack',name:'間食',order:3,active:true}];
function validate(settings){
 if(!Array.isArray(settings)||settings.length<4)throw Error('食事枠設定が不正');
 const ids=new Set(),orders=new Set();
 for(const s of settings){
  if(!s||typeof s.id!=='string'||!s.id||ids.has(s.id)||typeof s.name!=='string'||!s.name.trim()||!Number.isInteger(s.order)||orders.has(s.order)||typeof s.active!=='boolean')throw Error('食事枠ID・名前・順序・状態が不正');
  ids.add(s.id);orders.add(s.order);
 }
 for(const [i,id] of [...FIXED,'snack'].entries()){
  const s=settings.find(x=>x.id===id);
  if(!s||!s.active||(i<3&&s.name!==DEFAULTS[i].name))throw Error('固定食事枠の変更は禁止');
 }
 const sorted=settings.slice().sort((a,b)=>a.order-b.order);
 if(FIXED.map(id=>sorted.findIndex(s=>s.id===id)).some((v,i,a)=>i>0&&v<=a[i-1]))throw Error('朝昼夕の相対順序が不正');
 return true;
}
function defaults(){return clone(DEFAULTS)}
function change(settings,operation){
 validate(settings);const next=clone(settings);
 if(!operation||typeof operation!=='object')throw Error('操作が不正');
 const item=next.find(s=>s.id===operation.id);
 if(operation.type==='add'){
  if(typeof operation.id!=='string'||!/^snack-[a-zA-Z0-9_-]{6,}$/.test(operation.id)||next.some(s=>s.id===operation.id))throw Error('追加枠IDが不正');
  next.push({id:operation.id,name:String(operation.name||'').trim(),order:next.length,active:true});
 }else if(operation.type!=='reorder'&&!item)throw Error('食事枠が存在しない');
 else if(operation.type==='rename'){
  if(FIXED.includes(item.id))throw Error('朝昼夕は名称変更不可');
  item.name=String(operation.name||'').trim();
 }else if(operation.type==='hide'){
  if([...FIXED,'snack'].includes(item.id))throw Error('標準枠は削除不可');
  item.active=false;
 }else if(operation.type==='show')item.active=true;
 else if(operation.type==='reorder'){
  if(!Array.isArray(operation.ids)||operation.ids.length!==next.length||new Set(operation.ids).size!==next.length||operation.ids.some(id=>!next.some(s=>s.id===id)))throw Error('並び順が不正');
  operation.ids.forEach((id,index)=>{next.find(s=>s.id===id).order=index});
 }else throw Error('操作が不正');
 validate(next);return next;
}
function daySnapshot(settings,previous){
 validate(settings);
 if(previous!==undefined&&previous!==null){if(!Array.isArray(previous))throw Error('日別枠が不正');return clone(previous)}
 return settings.filter(s=>s.active).sort((a,b)=>a.order-b.order).map(s=>({slotId:s.id,slotName:s.name,slotOrder:s.order,meal:null}));
}
function planStoreUpdate(store,settings,options={}){
 if(!store||typeof store!=='object'||Array.isArray(store)||!store.days||typeof store.days!=='object'||Array.isArray(store.days))throw Error('保存データが不正');
 validate(settings);const next=clone(store);
 // Only settings change. Never rewrite day snapshots or legacy meals.
 next.foodSlotSettings=clone(settings);
 if(options.expectedOriginal&&JSON.stringify(store)!==options.expectedOriginal)throw Error('保存データが更新されました');
 return {next,original:JSON.stringify(store),changed:JSON.stringify(store)!==JSON.stringify(next)};
}
return Object.freeze({defaults,validate,change,daySnapshot,planStoreUpdate});
});
