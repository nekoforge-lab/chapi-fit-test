#!/usr/bin/env python3
"""Chapi Fit offline test entrypoint: node unit suite + Chromium DOM scenarios.
Run from any working directory: python run_checks.py
"""
import os,sys,json,subprocess,datetime,traceback
from pathlib import Path
ROOT=Path(__file__).resolve().parent
ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
COMMANDS=[('node-unit',['node','--test',*sorted(p.name for p in (ROOT).glob('*.test.js'))],ROOT),('browser-smoke',[sys.executable,'browser_smoke.py'],ROOT),('browser-regression',[sys.executable,'browser_regression.py'],ROOT),('browser-extended',[sys.executable,'browser_extended.py'],ROOT),('browser-structured',[sys.executable,'browser_structured.py'],ROOT),('browser-library',[sys.executable,'browser_library.py'],ROOT)]
summary={'started_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'results':[]}
for name,cmd,cwd in COMMANDS:
 print(f'\n=== {name} ===',flush=True)
 try:
  p=subprocess.run(cmd,cwd=cwd,capture_output=True,text=True,timeout=150,env={**os.environ,'PYTHONUNBUFFERED':'1'})
  ok=p.returncode==0
  log=(p.stdout or '')+'\n--- stderr ---\n'+(p.stderr or '')
  (ART/f'{name}.log').write_text(log,encoding='utf-8')
  print((p.stdout or '')[-1500:]);print((p.stderr or '')[-500:]);print('RESULT', 'PASS' if ok else 'FAIL',flush=True)
  summary['results'].append({'name':name,'pass':ok,'returncode':p.returncode,'log':f'artifacts/{name}.log'})
 except Exception as e:
  (ART/f'{name}.log').write_text(traceback.format_exc(),encoding='utf-8')
  print('FAIL',repr(e),flush=True)
  summary['results'].append({'name':name,'pass':False,'error':repr(e),'log':f'artifacts/{name}.log'})
summary['finished_utc']=datetime.datetime.now(datetime.timezone.utc).isoformat()
summary['passed']=sum(x['pass'] for x in summary['results']);summary['total']=len(summary['results'])
(ART/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(f"\nTOTAL: {summary['passed']}/{summary['total']} suites",flush=True)
sys.exit(0 if summary['passed']==summary['total'] else 1)
