from pathlib import Path
from fractions import Fraction
import json
source=json.loads((Path(__file__).resolve().parent/'formal-work-live-proof.json').read_text(encoding='utf-8'))
checks=[]
for row in source['rows']:
 scores=[r['score'] for r in row['ratings'] if r['score'] is not None]
 points=sum(scores);denom=len(scores)*3;fraction=Fraction(points,denom) if denom else None
 percent=(fraction*100+Fraction(1,2)).numerator//(fraction*100+Fraction(1,2)).denominator if fraction is not None else None
 actual=row['review'];assert actual['points']==points and actual['maxPoints']==denom and actual['observed']==len(scores) and actual['percent']==percent
 checks.append({'task':row['task'],'points':points,'denominator':denom,'observed':len(scores),'percent':percent,'passed':True})
out={'method':'Independent Python Fraction accumulation and exact half-up rounding','inputs':'Actual authenticated production review ratings in formal-work-live-proof.json','checks':checks,'allPassed':True,'scope':'Checks rating arithmetic only; does not validate the substance of reviewer observations'}
print(json.dumps(out))
