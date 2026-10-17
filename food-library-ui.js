/* Stage 30: opt-in library UI. Does not mutate existing daily meals. */
(()=>{'use strict';
const $=id=>document.getElementById(id), L=window.ChapiFoodLibrary, S=window.ChapiFoodLibraryStore, KEY='chapi-training-v2';
if(!L||!S||!$('libForm'))return;
const msg=s=>{$('libStatus').textContent=s;};
const get=()=>{const raw=localStorage.getItem(KEY);return {raw,data:raw?JSON.parse(raw):{}};};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('ja-JP',{maximumFractionDigits:2});
let recipeIngredients=[];
function reset(){recipeIngredients=[];drawRecipe();$('libRecipeServings').value='1';$('libRecipeSearch').value='';$('libKind').disabled=false;$('libForm').reset();$('libId').value='';kindChange();$('libEditorDetails').open=false;}
function kindChange(){const isDish=$('libKind').value==='dish';$('libIngredientFields').classList.toggle('hidden',isDish);$('libDishFields').classList.toggle('hidden',!isDish);}
function render(){try{const {data}=get(),items=S.search(data,{query:$('libSearch').value,kind:$('libKindFilter').value||undefined,category:$('libCategoryFilter').value||undefined});const box=$('libResults');box.replaceChildren();if(!items.length){box.textContent='該当する登録はありません';return;}
for(const item of items){const div=document.createElement('div');div.className='soft';div.style.margin='8px 0';const name=document.createElement('b');name.textContent=item.name;div.append(name);const sub=document.createElement('p');sub.className='hint';sub.textContent=`${item.kind==='dish'?item.category:'食材'} · ${fmt(item.nutrition.kcal)} kcal / P ${fmt(item.nutrition.p)} F ${fmt(item.nutrition.f)} C ${fmt(item.nutrition.c)} · 食塩 ${item.salt.status==='known'?fmt(item.salt.value)+'g':'不明'}`;div.append(sub);const actions=document.createElement('div');actions.className='actions';for(const [label,action] of [['編集','edit'],['削除','delete']]){const b=document.createElement('button');b.type='button';b.className='outline';b.textContent=label;b.dataset.action=action;b.dataset.id=item.id;actions.append(b);}div.append(actions);box.append(div);}}
catch(e){msg('読み込みできません: '+e.message);}}
function edit(item){$('libId').value=item.id;$('libKind').value=item.kind;$('libKind').disabled=true;kindChange();$('libName').value=item.name;$('libCategories').value=(item.categories||[]).join('/');$('libAmount').value=item.amount??'';$('libUnit').value=item.unit??'';$('libCategory').value=item.category||'家庭料理';$('libDishType').value=item.dishType||'';$('libVendor').value=item.vendor||'';for(const k of ['kcal','p','f','c'])$('lib'+k[0].toUpperCase()+k.slice(1)).value=item.nutrition[k];$('libSalt').value=item.salt.status==='known'?item.salt.value:'';$('libSaltSource').value=item.salt.source||'official';recipeIngredients=JSON.parse(JSON.stringify(item.ingredients||[]));$('libRecipeServings').value=item.recipeServings||1;drawRecipe();$('libEditorDetails').open=true;$('libEditorDetails').scrollIntoView({block:'nearest'});}
function entry(){const kind=$('libKind').value,id=$('libId').value||('lib-'+(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)));const item={id,kind,name:$('libName').value,nutrition:{kcal:Number($('libKcal').value),p:Number($('libP').value),f:Number($('libF').value),c:Number($('libC').value)},salt:$('libSalt').value===''?{status:'unknown'}:{status:'known',value:Number($('libSalt').value),source:$('libSaltSource').value}};if(kind==='dish'){item.recipeServings=Number($('libRecipeServings').value);if(!(item.recipeServings>0))throw Error('出来上がり皿数は0より大きい数値にしてください');item.ingredients=JSON.parse(JSON.stringify(recipeIngredients));item.category=$('libCategory').value;if($('libDishType').value.trim())item.dishType=$('libDishType').value;if($('libVendor').value.trim())item.vendor=$('libVendor').value;}else{item.categories=$('libCategories').value.split('/').map(x=>x.trim()).filter(Boolean);if($('libAmount').value!=='')item.amount=Number($('libAmount').value);if($('libUnit').value.trim())item.unit=$('libUnit').value;}return item;}
function drawRecipe(){
 const box=$('libRecipeIngredients');box.replaceChildren();
 recipeIngredients.forEach((ingredient,index)=>{
  const row=document.createElement('div');row.className='food-library-pick-row';
  const name=document.createElement('span');name.textContent=ingredient.name+' ('+(ingredient.unit||'')+')';row.append(name);
  const qty=document.createElement('input');qty.type='number';qty.min='0';qty.step='any';qty.inputMode='decimal';qty.setAttribute('aria-label',ingredient.name+'の使用量');qty.value=ingredient.quantity??'';qty.style.width='90px';
  qty.addEventListener('change',()=>{try{const updated=window.ChapiFoodRecipe.resizeIngredient(ingredient,qty.value);recipeIngredients[index]=updated;drawRecipe()}catch(e){msg('材料の分量を変更できません: '+e.message);qty.value=ingredient.quantity??''}});row.append(qty);
  const del=document.createElement('button');del.type='button';del.className='outline';del.textContent='削除';del.addEventListener('click',()=>{recipeIngredients.splice(index,1);drawRecipe()});row.append(del);box.append(row);
 });
}
function searchRecipe(){
 const box=$('libRecipeMatches');box.replaceChildren();const q=$('libRecipeSearch').value.trim();if(!q)return;
 try{const foods=S.search(get().data,{kind:'ingredient',query:q}).slice(0,20);for(const food of foods){const b=document.createElement('button');b.type='button';b.className='outline';b.textContent=food.name+' · '+(food.amount??'?')+(food.unit||'');b.addEventListener('click',()=>{try{recipeIngredients.push(window.ChapiFoodRecipe.ingredientFromLibrary(food));drawRecipe();$('libRecipeSearch').value='';searchRecipe()}catch(e){msg('材料を追加できません: '+e.message)}});box.append(b)}}catch(e){msg('検索できません: '+e.message)}
}
$('libRecipeSearch').addEventListener('input',searchRecipe);
function change(fn){if(typeof window.ChapiFoodLibraryCommit!=='function')throw Error('アプリの保存機能が準備できていません');window.ChapiFoodLibraryCommit(fn);}
$('libKind').addEventListener('change',kindChange);$('libReset').addEventListener('click',()=>{$('libKind').disabled=false;reset();msg('入力をクリアしました');});$('libForm').addEventListener('submit',e=>{e.preventDefault();try{change(data=>S.save(data,entry()));$('libKind').disabled=false;reset();render();msg('ライブラリに保存しました');}catch(err){msg('保存できません: '+err.message);}});
for(const id of ['libSearch','libKindFilter','libCategoryFilter'])$(id).addEventListener(id==='libSearch'?'input':'change',render);
$('libResults').addEventListener('click',e=>{const btn=e.target.closest('button[data-action]');if(!btn)return;try{const {data}=get(),item=S.snapshot(data,btn.dataset.id);if(btn.dataset.action==='edit'){edit(item);msg('編集中: '+item.name);}else if(confirm('「'+item.name+'」をライブラリから削除しますか？\n過去の食事記録は削除しません。')){change(d=>S.remove(d,item.id));render();msg('ライブラリから削除しました');}}catch(err){msg('操作できません: '+err.message);}});
const dialog=$('foodLibraryDialog');
$('foodLibraryOpen').addEventListener('click',()=>{reset();$('libSearch').value='';$('libKindFilter').value='';$('libCategoryFilter').value='';msg('');render();dialog.showModal();dialog.scrollTop=0;});
$('foodLibraryClose').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
kindChange();
})();
