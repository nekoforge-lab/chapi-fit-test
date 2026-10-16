from playwright.sync_api import sync_playwright
from browser_smoke import launch_chromium,boot
with sync_playwright() as pw:
 browser=launch_chromium(pw)
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate('''() => {const db={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.hasOwn(db,k)?db[k]:null,setItem:(k,v)=>{db[k]=String(v)},removeItem:k=>delete db[k]}})}''')
 boot(page)
 page.evaluate('''() => window.ChapiFoodLibraryCommit(data=>window.ChapiFoodLibraryStore.save(data,{id:'test-chicken',kind:'dish',name:'鶏むねソテー',category:'家庭料理',nutrition:{kcal:240,p:32,f:10,c:2},salt:{status:'unknown'},ingredients:[]}))''')
 page.locator('.meal[data-slot-id="breakfast"] > .meal-head').wait_for()
 page.locator('.meal[data-slot-id="breakfast"] > button').first.click(force=True)
 assert page.locator('#foodMealLibraryPicker').evaluate('(e)=>e.open')
 page.locator('#foodMealLibraryPicker input[type="search"]').fill('鶏むね')
 page.locator('#foodMealLibraryPicker .food-library-pick-row button').click()
 assert page.locator('#foodMealLibraryPicker').evaluate('(e)=>!e.open')
 section=page.locator('.meal[data-slot-id="breakfast"] .fixed-detail-editor')
 assert section.locator('input').filter(has=None).count()>0
 assert any(v=='鶏むねソテー' for v in section.locator('input').evaluate_all('(els)=>els.map(e=>e.value)'))
 section.locator('select').first.select_option('auto')
 assert page.locator('#food_breakfast_kcal').is_disabled()
 assert section.locator('.food-grid input').first.is_disabled()
 section.locator('select').first.select_option('manual')
 assert page.locator('#food_breakfast_kcal').is_enabled()
 # Detail save stores a snapshot, without changing library or mutating past entries.
 section.locator('button.meal-save').click()
 raw=page.evaluate("JSON.parse(localStorage.getItem('chapi-training-v2'))")
 assert len(raw['foodLibraryV39']['items'])==1
 assert not errors,errors
 print('PASS: 390px browser, library pick -> meal detail, mode disable/enable, save, no JS errors')
 browser.close()
