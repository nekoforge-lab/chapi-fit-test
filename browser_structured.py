from browser_smoke import boot,launch_chromium
from playwright.sync_api import sync_playwright
from pathlib import Path
import datetime,json,traceback
ROOT=Path(__file__).parent
OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
logs=[]
with sync_playwright() as pw:
 browser=launch_chromium(pw)
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:d.accept())
 page.evaluate('''() => {const db={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.hasOwn(db,k)?db[k]:null,setItem:(k,v)=>{db[k]=String(v)},removeItem:k=>delete db[k]}})}''')
 def saved():return json.loads(page.evaluate("localStorage.getItem('chapi-training-v2')"))
 def date(d):page.locator('#recordDate').fill(d);page.locator('#recordDate').dispatch_event('change')
 def meal():return page.locator('#foodInputs > .meal-section[data-slot-id="breakfast"]')
 try:
  boot(page)
  now=page.locator('#recordDate').input_value();prev=(datetime.date.fromisoformat(now)-datetime.timedelta(days=1)).isoformat()
  date(prev)
  meal().locator('#food_breakfast_kcal').fill('321')
  meal().locator('#food_breakfast_p').fill('25')
  meal().locator('> .meal-head > .meal-save').click()
  meal().get_by_role('button',name='料理・食材の明細を編集').click()
  detail=meal().locator('.fixed-detail-editor')
  assert not detail.is_hidden()
  detail.get_by_role('button',name='＋ 食材').click()
  line=detail.locator('.food-entry-row').first
  line.get_by_label('食材名').fill('試験用たまご')
  line.get_by_label('数量（任意）').fill('50')
  line.get_by_label('単位（任意）').fill('g')
  line.get_by_label('食塩相当量（g・任意）').fill('0.2')
  line.get_by_label('kcal').fill('80')
  detail.get_by_role('button',name='保存',exact=True).click()
  a=saved()['days'][prev];slot=next(x for x in a['foodV2']['slots'] if x['slotId']=='breakfast')
  assert slot['meal']['entries'][0]['name']=='試験用たまご',slot
  assert float(a['meals']['breakfast']['kcal'])==321
  logs.append('PASS: structured meal saved and projected to legacy total')
  date(now)
  meal().get_by_role('button',name='↩ 前日の食事をコピー').click()
  b=saved()['days'][now];copy=next(x for x in b['foodV2']['slots'] if x['slotId']=='breakfast')
  assert copy['meal']==slot['meal'],(copy,slot)
  assert b['meals']['breakfast']['kcal']==321
  logs.append('PASS: previous-day structured copy retains detail, totals, salt')
  assert saved()['days'][prev]['foodV2']['slots'][0]['meal']==slot['meal']
  boot(page)
  assert saved()['days'][now]['foodV2']['slots'][0]['meal']==slot['meal']
  logs.append('PASS: reload retains source and target independent snapshots')
  # Backup format roundtrip via the exact storage parser (in-browser)
  result=page.evaluate('''() => {const before=ChapiFit.getStore();const text=JSON.stringify({app:'chapi-training',version:2,schemaRevision:3,store:before});const after=ChapiFoodStorage.parseBackup(text,ChapiCore,ChapiFoodSlots);return {before,after}}''')
  assert result['before']['days'][now]['foodV2']==result['after']['days'][now]['foodV2']
  assert result['before']['days'][prev]['foodV2']==result['after']['days'][prev]['foodV2']
  logs.append('PASS: backup parser preserves structured meals for both days')
  # Browser UI import path with an actual JSON file payload (no external server)
  backup_bytes=json.dumps({'app':'chapi-training','version':2,'schemaRevision':3,'store':result['before']},ensure_ascii=False).encode('utf-8')
  page.locator('#importFile').set_input_files({'name':'stage24-backup.json','mimeType':'application/json','buffer':backup_bytes})
  page.wait_for_timeout(200)
  imported=saved()
  assert imported['days'][now]['foodV2']==result['before']['days'][now]['foodV2']
  assert imported['days'][prev]['foodV2']==result['before']['days'][prev]['foodV2']
  logs.append('PASS: actual browser file-input restore preserves structured data')
  assert not errors,errors
 except Exception as e:
  logs.append('FAIL: '+repr(e));page.screenshot(path=str(OUT/'stage24-failure.png'),full_page=True)
  (OUT/'stage24-traceback.txt').write_text(traceback.format_exc())
  raise
 finally:
  (OUT/'stage24-events.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2))
  print('\n'.join(logs));browser.close()
