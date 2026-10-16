from playwright.sync_api import sync_playwright
from browser_smoke import launch_chromium,boot
with sync_playwright() as pw:
 browser=launch_chromium(pw)
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate('''() => {const db={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.hasOwn(db,k)?db[k]:null,setItem:(k,v)=>{db[k]=String(v)},removeItem:k=>delete db[k]}})}''')
 boot(page)
 page.locator('#foodLibraryDetails > summary').click()
 page.locator('#libEditorDetails > summary').click()
 page.locator('#libName').fill('テスト鶏肉')
 for k,v in [('Kcal','165'),('P','31'),('F','3.6'),('C','0')]:page.locator('#lib'+k).fill(v)
 page.locator('#libSave').click()
 assert 'テスト鶏肉' in page.locator('#libResults').inner_text()
 assert len(page.evaluate("JSON.parse(localStorage.getItem('chapi-training-v2')).foodLibraryV39.items"))==1
 page.locator('#libResults button[data-action="edit"]').click()
 page.locator('#libName').fill('テスト鶏肉改')
 page.locator('#libSave').click()
 assert 'テスト鶏肉改' in page.locator('#libResults').inner_text()
 page.locator('#libSearch').fill('見つからない')
 assert '該当する登録はありません' in page.locator('#libResults').inner_text()
 page.locator('#libSearch').fill('鶏肉')
 page.on('dialog',lambda d:d.accept())
 page.locator('#libResults button[data-action="delete"]').click()
 assert len(page.evaluate("JSON.parse(localStorage.getItem('chapi-training-v2')).foodLibraryV39.items"))==0
 assert not errors,errors
 print('PASS: library create/edit/search/delete in 390px browser, no JS errors')
 browser.close()
