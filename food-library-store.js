/* Chapi Fit v3.9: opt-in food library persistence; no automatic writes/migration. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./food-library.js'):root.ChapiFoodLibrary);if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFoodLibraryStore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(lib){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const KEY='foodLibraryV39';
function read(store){if(!store||typeof store!=='object'||Array.isArray(store))throw Error('保存データが不正');const v=store[KEY];if(v===undefined)return {version:1,items:[]};if(!v||v.version!==1||!Array.isArray(v.items))throw Error('ライブラリ形式が不正');const ids=new Set();const items=v.items.map(x=>{const item=x.kind==='ingredient'?lib.ingredient(x):x.kind==='dish'?lib.dish(x):(()=>{throw Error('種類が不正')})();if(ids.has(item.id))throw Error('ライブラリID重複');ids.add(item.id);return item;});return {version:1,items};}
function save(store,entry){const before=read(store);const next=clone(store);next[KEY]={version:1,items:lib.upsert(before.items,entry)};return next;}
function remove(store,id){const before=read(store);const next=clone(store);next[KEY]={version:1,items:before.items.filter(x=>x.id!==id)};return next;}
function snapshot(store,id){const found=read(store).items.find(x=>x.id===id);if(!found)throw Error('登録項目が見つからない');return lib.dailySnapshot(found);}
function search(store,opts){return lib.search(read(store).items,opts);}
function commit(storage,key,previous,next){const current=storage.getItem(key);if(current!==JSON.stringify(previous))throw Error('保存内容が変更されたため中止');read(next);const safetyKey=key+'-before-food-library-v39';if(storage.getItem(safetyKey)===null)storage.setItem(safetyKey,current);storage.setItem(key,JSON.stringify(next));return true;}
return Object.freeze({KEY,read,save,remove,snapshot,search,commit});
});
