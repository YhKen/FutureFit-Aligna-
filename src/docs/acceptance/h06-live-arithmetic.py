from pathlib import Path
from fractions import Fraction
from decimal import Decimal,ROUND_HALF_UP
from datetime import datetime,timezone,timedelta
import json,math
root=Path(__file__).resolve().parent
p=json.loads((root/'h06-production-proof.json').read_text())
v=p['match']['vectors'];a=v['jd'];b=v['candidate']
roundpct=lambda value:int((Decimal(str(value))*100).quantize(Decimal('1'),rounding=ROUND_HALF_UP))
coverage=Fraction(sum(x for x,y in zip(a,b) if y),sum(a))
cosine=sum(x*y for x,y in zip(a,b))/(math.sqrt(sum(x*x for x in a))*math.sqrt(sum(y*y for y in b)))
assert roundpct(float(coverage))==p['match']['coverage']==33
assert roundpct(cosine)==p['match']['cosinePercent']==58
times=[x for x in p['checks'] if 'proposalAt' in x]
row=times[-1];utc=datetime.fromisoformat(row['proposalAt'].replace('Z','+00:00'))
assert utc.astimezone(timezone(timedelta(hours=9))).strftime('%Y-%m-%dT%H:%M')=='2026-11-06T14:15'
for task in p['tasks']:
 r=task['humanReview'];assert r['points']==10 and r['maxPoints']==12 and r['percent']==83
proof={'checkedAt':datetime.now(timezone.utc).isoformat(),'allPassed':True,'matchMethod':'Independent Python Fraction and Euclidean dot-product calculation on saved vectors','coverageFraction':str(coverage),'coverage':33,'cosine':cosine,'cosinePercent':58,'timeMethod':'Python datetime fixed UTC offsets from the saved browser proposal','jst':'2026-11-06T14:15','utc':row['proposalAt'],'taskScores':[83,83],'scope':'Arithmetic and timestamp checks only; not validation of weights or human observations'}
print(json.dumps(proof))

