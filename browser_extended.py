from browser_smoke import boot,launch_chromium
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,traceback,datetime
OUT=Path(__file__).parent/'artifacts';OUT.mkdir(exist_ok=True)
def main():
 with sync_playwright() as pw:
  browser=launch_chromium(pw)
  page=browser.new_page(viewport={'width':390,'height':844})
  events=[];errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:(events.append('dialog:'+d.message[:100]),d.accept()))
  page.evaluate('''() => {const db={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.hasOwn(db,k)?db[k]:null,setItem:(k,v)=>{db[k]=String(v)},removeItem:k=>delete db[k]}})}''')
  try:
   boot(page)
   def store():return json.loads(page.evaluate("localStorage.getItem('chapi-training-v2')"))
   def date(d):page.locator('#recordDate').fill(d);page.locator('#recordDate').dispatch_event('change')
   today=page.locator('#recordDate').input_value();prev=(datetime.date.fromisoformat(today)-datetime.timedelta(days=1)).isoformat()
   date(prev)
   sec=page.locator('#foodInputs > .meal-section[data-slot-id="breakfast"]')
   sec.locator('#food_breakfast_kcal').fill('222');sec.locator('#food_breakfast_p').fill('18')
   sec.locator('> .meal-head > .meal-save').click()
   assert float(store()['days'][prev]['meals']['breakfast']['kcal'])==222
   events.append('PASS: previous date save')
   date(today)
   sec=page.locator('#foodInputs > .meal-section[data-slot-id="breakfast"]')
   events.append('TARGET BEFORE: '+str(store()['days'].get(today,{}).get('foodV2')))
   sec.locator('button.meal-copy').click()
   events.append('COPY NOTICE: '+page.locator('#notice').inner_text())
   assert float(store()['days'][today]['meals']['breakfast']['kcal'])==222
   assert float(store()['days'][prev]['meals']['breakfast']['kcal'])==222
   events.append('PASS: previous-day copy preserves source')
   page.locator('#aiFoodDetails > summary').click()
   page.locator('#aiMealSelect').select_option('breakfast')
   payload={'format':'chapi-food-v1','items':[{'name':'試験食品','amount':'100g','kcal':345,'p':20,'f':5,'c':50,'note':'test'}]}
   page.locator('#aiResult').fill(json.dumps(payload,ensure_ascii=False))
   page.locator('#aiParse').click()
   assert page.locator('#aiAccept').is_enabled()
   page.locator('#aiAccept').click()
   day=store()['days'][today]
   assert float(day['meals']['breakfast']['kcal'])==345,day['meals']['breakfast']
   assert day['meals']['breakfast']['aiItems'][0]['name']=='試験食品'
   assert float(store()['days'][prev]['meals']['breakfast']['kcal'])==222
   events.append('PASS: AI replaces target, preserves previous day')
   date(prev);assert page.locator('#food_breakfast_kcal').input_value()=='222'
   date(today);assert page.locator('#food_breakfast_kcal').input_value()=='345'
   events.append('PASS: date switch isolates records')
   boot(page)
   assert page.locator('#food_breakfast_kcal').input_value()=='345'
   assert not errors,errors
   events.append('PASS: restart retains AI replacement, no JS errors')
  except Exception as e:
   events.append('FAIL: '+repr(e));events.extend('JS ERROR: '+e for e in errors)
   page.screenshot(path=str(OUT/'failure.png'),full_page=True)
   (OUT/'traceback.txt').write_text(traceback.format_exc(),encoding='utf-8')
   raise
  finally:
   (OUT/'events.json').write_text(json.dumps(events,ensure_ascii=False,indent=2),encoding='utf-8')
   print('\n'.join(events));browser.close()
if __name__=='__main__':main()
