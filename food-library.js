/* Chapi Fit v3.9 - local food library domain, not connected to UI or storage yet. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ChapiFoodLibrary=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FIELDS=['kcal','p','f','c'];
const CATEGORIES=['家庭料理','出来合い','外食'];
const clone=x=>JSON.parse(JSON.stringify(x));
const valid=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
function nutrition(input){if(!input||!FIELDS.every(f=>valid(input[f])))throw Error('kcal/PFCは0以上の数値で入力');return Object.fromEntries(FIELDS.map(f=>[f,input[f]]));}
function salt(input){if(input===undefined||input===null||input.status==='unknown')return {status:'unknown'};if(!valid(input.value))throw Error('食塩相当量が不正');if(!['official','estimated'].includes(input.source))throw Error('食塩相当量の根拠が不正');return {status:'known',value:input.value,source:input.source};}
function text(v,label){if(typeof v!=='string'||!v.trim())throw Error(label+'は必須');return v.trim();}
function ingredient(data){const x={id:text(data.id,'ID'),kind:'ingredient',name:text(data.name,'食材名'),categories:Array.isArray(data.categories)?data.categories.map(s=>text(s,'分類')):[],nutrition:nutrition(data.nutrition),salt:salt(data.salt)};if(data.unit!==undefined)x.unit=text(data.unit,'単位');if(data.amount!==undefined){if(!valid(data.amount)||Math.round(data.amount*10)!==data.amount*10)throw Error('分量は0.1単位');x.amount=data.amount;}if(data.provenance!==undefined)x.provenance=clone(data.provenance);return x;}
function dish(data){if(!CATEGORIES.includes(data.category))throw Error('料理カテゴリが不正');const x={id:text(data.id,'ID'),kind:'dish',name:text(data.name,'料理名'),category:data.category,nutrition:nutrition(data.nutrition),salt:salt(data.salt),ingredients:Array.isArray(data.ingredients)?clone(data.ingredients):[]};if(data.recipeServings!==undefined){if(!valid(data.recipeServings)||data.recipeServings===0)throw Error('出来上がり皿数が不正');x.recipeServings=data.recipeServings;}if(data.dishType!==undefined)x.dishType=text(data.dishType,'料理の種類');if(data.vendor!==undefined)x.vendor=text(data.vendor,'店舗・メーカー名');if(data.provenance!==undefined)x.provenance=clone(data.provenance);return x;}
function upsert(library,entry){if(!Array.isArray(library))throw Error('ライブラリが不正');const item=entry.kind==='ingredient'?ingredient(entry):entry.kind==='dish'?dish(entry):(()=>{throw Error('種類が不正');})();const out=clone(library),idx=out.findIndex(x=>x.id===item.id);if(idx>=0){if(out[idx].kind!==item.kind)throw Error('IDの種類が競合');out[idx]=item;}else out.push(item);return out;}
function search(library,{query='',kind,category}={}){const q=String(query).trim().toLocaleLowerCase();return clone(library.filter(x=>(!kind||x.kind===kind)&&(!category||(x.kind==='dish'?x.category===category:(x.categories||[]).includes(category)))&&(!q||[x.name,x.dishType,x.vendor,...(x.categories||[])].some(v=>String(v||'').toLocaleLowerCase().includes(q)))));}
function dailySnapshot(entry){if(!entry||!['ingredient','dish'].includes(entry.kind))throw Error('明細が不正');return clone(entry);}
return Object.freeze({CATEGORIES,ingredient,dish,upsert,search,dailySnapshot});
});
