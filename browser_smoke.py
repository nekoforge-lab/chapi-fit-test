from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json,os
ROOT=Path(__file__).parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
SCRIPTS=re.findall(r'<script defer src="\./([^"?]+)',HTML)
def launch_chromium(pw):
    """Prefer explicit executable; fall back to Playwright-managed Chromium in CI."""
    binary=os.environ.get('CHAPI_CHROMIUM_EXECUTABLE')
    if not binary and Path('/usr/bin/chromium').is_file():binary='/usr/bin/chromium'
    kwargs={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    if binary:kwargs['executable_path']=binary
    return pw.chromium.launch(**kwargs)

def boot(page):
    page.set_content(HTML,wait_until='domcontentloaded')
    for f in SCRIPTS:page.add_script_tag(content=(ROOT/f).read_text(encoding='utf-8'))
def main():
 with sync_playwright() as pw:
  browser=launch_chromium(pw)
  page=browser.new_page(viewport={'width':390,'height':844})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.evaluate('''() => {const db={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.hasOwn(db,k)?db[k]:null,setItem:(k,v)=>{db[k]=String(v)},removeItem:k=>delete db[k]}})}''')
  boot(page)
  print('COUNT',page.locator('#foodInputs > .meal-section').count(),'ERRORS',errors,'TEXT',page.locator('#foodInputs').inner_text()[:200]);assert page.locator('#foodInputs > .meal-section').count()==4
  page.locator('#food_breakfast_kcal').fill('321')
  page.locator('#food_breakfast_p').fill('25')
  page.locator('#foodInputs .meal-section[data-slot-id="breakfast"] > .meal-head > .meal-save').click()
  raw=page.evaluate("localStorage.getItem('chapi-training-v2')")
  assert raw,'save did not write storage'
  obj=json.loads(raw);day=obj['days'][next(iter(obj['days']))]
  print('SAVE',day['meals']['breakfast'])
  assert float(day['meals']['breakfast']['kcal'])==321
  boot(page)
  print('RELOAD',page.locator('#food_breakfast_kcal').input_value())
  assert float(page.locator('#food_breakfast_kcal').input_value())==321
  assert not errors,errors
  print('PASS: actual Chromium DOM, click, localStorage and app restart')
  browser.close()
if __name__=='__main__':main()
