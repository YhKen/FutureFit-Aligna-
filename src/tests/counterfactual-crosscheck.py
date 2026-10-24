from pathlib import Path
import json,math,subprocess,os
from fractions import Fraction
root=Path(__file__).resolve().parents[1]
rows=json.loads(subprocess.check_output([os.environ.get('NODE_BINARY','node'),str(root/'tests/counterfactual-fixture.mjs')],text=True,encoding='utf-8'))
checks=0
round_js=lambda x:math.floor(x+Fraction(1,2))
for case in rows:
 data=case['rows'];total=sum(r['weight'] for r in data);matched=sum(r['weight'] for r in data if r['present'])
 if not total:continue
 before=round_js(Fraction(matched*100,total));assert before==case['before'],case['id'];checks+=1
 norm=sum(r['weight']**2 for r in data);dot=sum(r['weight']**2 for r in data if r['present']);expected=dot/math.sqrt(norm*dot) if dot else None
 assert (expected is None and case['cosine'] is None) or math.isclose(expected,case['cosine'],abs_tol=1e-12),case['id'];checks+=1
 gaps=[r for r in data if not r['present']]
 if gaps:
  options=[(round_js(Fraction((matched+r['weight'])*100,total))-before,r) for r in gaps]
  assert max(gain for gain,r in options)==case['gain'],case['id'];assert any(r['name']==case['name'] and gain==case['gain'] for gain,r in options),case['id'];assert case['after']==before+case['gain'];checks+=3
p={'occupations':len(rows),'pointChecks':checks,'failed':0,'methods':['Python Fraction exact weighted presence and half-up rounding','Independent squared-weight dot product and Euclidean norm','Enumerate every missing skill from the same frozen requirement rows'],'scope':'Synthetic current profile; arithmetic verification, not measurement or hiring validity'}
print(json.dumps(p))
