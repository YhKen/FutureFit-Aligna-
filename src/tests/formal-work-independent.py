from pathlib import Path
import json,sqlite3,subprocess,os,argparse
parser=argparse.ArgumentParser();parser.add_argument('--output');args=parser.parse_args()
repo=Path(__file__).resolve().parents[1]
source="import {formalTask} from './formal-work-data.js'; import {formalReference} from './lib/formal-work-keys.js'; console.log(JSON.stringify(['resource-plan','record-audit'].flatMap(id=>['A','B'].map(v=>({task:formalTask(id,v),reference:formalReference(id,v)})))));"
rows=json.loads(subprocess.check_output([os.environ.get('NODE_BINARY','node'),'--input-type=module','-e',source],cwd=repo))
proof=[]
for x in rows:
 t,r=x['task'],x['reference'];m=t['materials']
 if t['id']=='resource-plan':
  # Independent dynamic programming over cost/time/safeguards, not JS subset enumeration.
  states={(0,0,0):(0,[()])}
  for o in m['options']:
   next_states={k:(v[0],list(v[1])) for k,v in states.items()}
   for (cost,minutes,safe),(reach,choices) in states.items():
    key=(cost+o['cost'],minutes+o['minutes'],min(1,safe+int(o['safeguard'])))
    if key[0]>m['budget'] or key[1]>m['timeLimit']:continue
    value=reach+o['reach'];comb=[c+(o['id'],) for c in choices];old=next_states.get(key)
    if old is None or value>old[0]:next_states[key]=(value,comb)
    elif value==old[0]:next_states[key]=(value,old[1]+comb)
   states=next_states
  maximum=max(v[0] for k,v in states.items() if k[2]>=m['safeguardsRequired'])
  choices=sorted({tuple(c) for k,v in states.items() if k[2]>=m['safeguardsRequired'] and v[0]==maximum for c in v[1]})
  assert maximum==r['maximum'];assert choices==sorted(tuple(o['selected']) for o in r['optimal'])
  proof.append({'task':t['id'],'variant':t['variant'],'independentMethod':'Python dynamic programming over resource states','mainMethod':r['method'],'maximum':maximum,'optimal':[list(c) for c in choices],'passed':True})
 else:
  c=sqlite3.connect(':memory:');c.execute('CREATE TABLE events (eventId TEXT,deliveryId TEXT,stamp TEXT,status TEXT)')
  c.executemany('INSERT INTO events VALUES (?,?,?,?)',[(e['eventId'],e['deliveryId'],e['time'],e['status']) for e in m['events']])
  result=c.execute('''WITH dedup AS (SELECT DISTINCT * FROM events), latest AS (SELECT deliveryId,MAX(stamp) stamp FROM dedup GROUP BY deliveryId)
    SELECT d.deliveryId,CASE WHEN COUNT(DISTINCT d.status)>1 THEN 'conflict' ELSE MIN(d.status) END
    FROM dedup d JOIN latest l ON d.deliveryId=l.deliveryId AND d.stamp=l.stamp GROUP BY d.deliveryId ORDER BY d.deliveryId''').fetchall()
  completed=sum(status=='delivered' for _,status in result);exceptions=[id for id,status in result if status!='delivered'];conflicts=[id for id,status in result if status=='conflict']
  assert len(result)==r['uniqueCount'];assert completed==r['completedCount'];assert exceptions==r['exceptions'];assert conflicts==r['conflicts']
  assert len(m['events'])-c.execute('SELECT COUNT(*) FROM (SELECT DISTINCT * FROM events)').fetchone()[0]==r['duplicateRows']
  proof.append({'task':t['id'],'variant':t['variant'],'independentMethod':'SQLite DISTINCT, latest-time join and GROUP BY','mainMethod':r['method'],'uniqueCount':len(result),'completedCount':completed,'exceptions':exceptions,'conflicts':conflicts,'passed':True});c.close()
out={'forms':proof,'allPassed':True,'scope':'Independent numerical reference checks only; human reasoning anchors require human judgement; no psychometric validity claim'}
if args.output:Path(args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(out,ensure_ascii=False))
