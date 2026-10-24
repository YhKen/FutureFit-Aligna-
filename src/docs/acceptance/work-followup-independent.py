from pathlib import Path
from fractions import Fraction
import json
root=Path(__file__).resolve().parent;p=json.loads((root/'work-followup-live-proof.json').read_text(encoding='utf-8'));n=p['numbers']
def percent(values):
 v=[x for x in values if x is not None]
 return None if not v else int(Fraction(sum(v)*100,len(v)*3)+Fraction(1,2))
def compare(a,b):
 pairs=[(x,y) for x,y in zip(a,b) if x is not None and y is not None]
 return {'paired':len(pairs),'exact':sum(x==y for x,y in pairs),'agreementPercent':None if not pairs else int(Fraction(sum(x==y for x,y in pairs)*100,len(pairs))+Fraction(1,2)),'meanAbsoluteDifference':None if not pairs else float(sum(Fraction(abs(x-y)) for x,y in pairs)/len(pairs))}
for key in ['first','current','second']:assert percent(n[key])==n[key+'Summary']['percent']
for key,a in [('originalComparison','first'),('currentComparison','current')]:
 c=compare(n[a],n['second']);assert all(n[key][k]==v for k,v in c.items())
assert compare([None]*4,[1,2,3,None])['agreementPercent'] is None
out={'method':'Independent Python Fraction exact arithmetic, half-up positive integer rounding','source':'work-followup-live-proof.json saved production numeric ratings only','originalPercent':percent(n['first']),'currentPercent':percent(n['current']),'secondPercent':percent(n['second']),'comparison':compare(n['first'],n['second']),'nullOnlyNotComputed':True,'allPassed':True,'scope':'Arithmetic only, not independent human judgement or population reliability'}
print(json.dumps(out))
