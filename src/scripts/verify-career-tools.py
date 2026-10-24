"""Independent oracle: Python standard library only. Reads synthetic JS cases from stdin."""
import sys,json,math
from fractions import Fraction
from datetime import date,timedelta
fixture=json.load(sys.stdin);checks=0
for r in fixture['money']:
 o=r['option'];n=o['slots'].count('1');f=Fraction(n*52,12) if o['ratePeriod']=='hour' else 1
 assert math.floor(o['rateMinCents']*f)==r['result']['min'];assert math.ceil(o['rateMaxCents']*f)==r['result']['max'];checks+=2
for r in fixture['schedules']:
 a=r['availability'];start=date.fromisoformat(a['startDate']);free=[i for i,b in enumerate(a['blocked']) if b=='0'][:a['studyHours']];q=[t['id'] for t in r['tasks'] for _ in range(t['hours'])];expected=[]
 for d in range(7*a['weeks']):
  dt=start+timedelta(days=d)
  for h in range(24):
   if dt.weekday()*24+h in free and len(expected)<len(q):expected.append({'date':dt.isoformat(),'hour':h,'taskId':q[len(expected)]})
 assert [{k:x[k] for k in ['date','hour','taskId']} for x in r['result']['rows']]==expected
 assert r['result']['deferredHours']==len(q)-len(expected);checks+=2
for r in fixture['pairs']:
 a,b,av,c=r['a'],r['b'],r['availability'],r['settings'];A={i for i,v in enumerate(a['slots']) if v=='1'};B={i for i,v in enumerate(b['slots']) if v=='1'};blocked={i for i,v in enumerate(av['blocked']) if v=='1'};learn=set([i for i in range(168) if i not in blocked][:av['studyHours']]) if c['reserveStudy'] else set()
 ok=not((A|B)&(blocked|learn)) and len(A)+len(B)<=av['workHours'] and not(A&B)
 if a['arrangement']=='onsite' or b['arrangement']=='onsite':ok=ok and all(min((x-y)%168,(y-x)%168)>c['commuteHours'] for x in A for y in B)
 assert ok==r['result']['ok'];checks+=1
print(json.dumps({'passed':True,'incomeCases':len(fixture['money']),'scheduleCases':len(fixture['schedules']),'pairFeasibilityCases':len(fixture['pairs']),'checks':checks,'method':'Independent Python Fraction, datetime, sets and circular distance; no JS helper reuse'}))
