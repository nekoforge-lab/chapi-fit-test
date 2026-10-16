from browser_smoke import boot,launch_chromium
from playwright.sync_api import sync_playwright
import json
from pathlib import Path

def main():
 with sync_playwright() as pw:
  browser=launch_chromium(pw)
  page=browser.new_page(viewport={'width':390,'height':844})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.evaluate('''() => {const db={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.hasOwn(db,k)?db[k]:null,setItem:(k,v)=>{db[k]=String(v)},removeItem:k=>delete db[k]}})}''')
  boot(page)
  def stored():
   obj=json.loads(page.evaluate("localStorage.getItem('chapi-training-v2')"));return obj['days'][next(iter(obj['days']))]
  section=page.locator('#foodInputs > .meal-section[data-slot-id="breakfast"]')
  section.locator('#food_breakfast_kcal').fill('321')
  section.locator('#food_breakfast_p').fill('25')
  section.locator('> .meal-head > .meal-save').click()
  assert float(stored()['meals']['breakfast']['kcal'])==321
  print('PASS: simple save')
  section.locator('button',has_text='料理・食材の明細を編集').click()
  detail=section.locator('.fixed-detail-editor')
  assert detail.is_visible()
  print('DETAIL INITIAL',detail.locator('input[type=number]').evaluate_all('(els)=>els.map(e=>e.value)'))
  assert detail.locator('input[type=number]').first.input_value()=='321'
  assert detail.locator('input[type=number]').nth(1).input_value()=='25'
  # Save structured manual total without altering existing 321 kcal
  detail.locator('button.meal-save').click()
  print('NOTICE DETAIL',page.locator('#notice').inner_text())
  after=stored()
  assert float(after['meals']['breakfast']['kcal'])==321
  slot=next(x for x in after['foodV2']['slots'] if x['slotId']=='breakfast')
  assert slot['meal']['format']=='chapi-food-record-2-draft'
  print('DETAIL',slot['meal']);print('PASS: structured detail save, legacy projection intact')
  # Existing quick-save path should refuse structured meals rather than overwrite them.
  section=page.locator('#foodInputs > .meal-section[data-slot-id="breakfast"]')
  section.locator('#food_breakfast_kcal').fill('450')
  section.locator('> .meal-head > .meal-save').click()
  print('AFTER QUICK',stored()['meals']['breakfast'],next(x for x in stored()['foodV2']['slots'] if x['slotId']=='breakfast')['meal'])
  assert float(stored()['meals']['breakfast']['kcal'])==321
  print('PASS: quick save cannot overwrite structured record')
  # delete through detail editor, both representations must be cleared
  section.locator('button',has_text='料理・食材の明細を編集').click()
  section.locator('button',has_text='削除して未記録に戻す').click()
  after=stored()
  assert after['meals']['breakfast']=={},after['meals']['breakfast']
  print('AFTER DELETE',next(x for x in after['foodV2']['slots'] if x['slotId']=='breakfast')['meal']);assert next(x for x in after['foodV2']['slots'] if x['slotId']=='breakfast')['meal'] is None
  print('PASS: detail delete clears both projections')
  boot(page)
  assert page.locator('#food_breakfast_kcal').input_value()==''
  assert not errors,errors
  print('PASS: restart retains deletion; no page errors')
  browser.close()
if __name__=='__main__':main()
