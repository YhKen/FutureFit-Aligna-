"""Independent arithmetic, not a human validity or optimal-weight study."""
import os,subprocess,json,math,argparse
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads(subprocess.check_output([os.environ.get('NODE_BINARY','node'),str(root/'tests/algorithm-sensitivity-fixtures.mjs')],cwd=root))
checks=0
def close(a,b):
 global checks
 if a is None or b is None: assert a is None and b is None
 else: assert math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10),(a,b)
 checks+=1
def rounded(x):return math.floor(x+.5)
for case in data['jobs']:
 for scenario in case['expected']['scenarios']:
  weights=[scenario['role'] if kind=='role' else scenario['collaboration'] for kind in case['weights']]
  coverage=sum(w for w,p in zip(weights,case['present']) if p)/sum(weights)*100
  j=weights;c=[w if p else 0 for w,p in zip(weights,case['present'])]
  denominator=math.sqrt(sum(v*v for v in j))*math.sqrt(sum(v*v for v in c))
  cosine=sum(a*b for a,b in zip(j,c))/denominator if denominator else None
  close(coverage,scenario['coverage']);close(rounded(coverage),scenario['coveragePercent']);close(cosine,scenario['cosine']);close(None if cosine is None else rounded(cosine*100),scenario['cosinePercent'])
for profile in data['careerProfiles']:
 ratings={s['name']:s['value'] for s in profile['skills']};u=profile['interest'];uc=[v-sum(u)/6 for v in u];un=math.sqrt(sum(v*v for v in uc))
 for scenario in profile['expected']['scenarios']:
  expected={r['id']:r['score'] for r in scenario['ranked']}
  for job in data['careerJobs']:
   v=job['interests'];vc=[n-sum(v)/6 for n in v];vn=math.sqrt(sum(n*n for n in vc));interest=sum(a*b for a,b in zip(uc,vc))/(un*vn) if un>.01 and vn>.01 else 0
   evidence=[(rating,job['skills'][name]) for name,rating in ratings.items() if job['skills'].get(name)]
   skill=sum((rating-3)/2*weight for rating,weight in evidence)/sum(weight for _,weight in evidence) if evidence else 0
   score=interest*scenario['interest']+skill*scenario['skill'] if len(evidence)>=3 else interest
   close(score,expected[job['id']])
  # Every meaningful score separation must be in descending order. Nearly tied
  # values and locale-specific title ordering are not asserted as rank evidence.
  ranked=scenario['ranked'];assert all(a['score']+1e-10>=b['score'] for a,b in zip(ranked,ranked[1:])) if not profile['expected']['flatInterests'] else True
report={'passed':True,'numericComparisons':checks,'jobRecordPatterns':len(data['jobs']),'jobWeightPolicies':3,'occupationCount':len(data['careerJobs']),'syntheticProfiles':len(data['careerProfiles']),'careerWeightPolicies':4,'scope':'Independent Python sums, dot products and centred correlation from raw fixture inputs. Synthetic implementation check only; not human calibration. Near ties and language collation are not independent ranking evidence.','careerScenarioSummary':[{'profile':p['id'],'flat':p['expected']['flatInterests'],'scenarios':[{'policy':s['id'],'top5Overlap':s['overlap'],'jaccard':s['jaccard'],'top5':[r['id'] for r in s['top']]} for s in p['expected']['scenarios']]} for p in data['careerProfiles']]}
parser=argparse.ArgumentParser();parser.add_argument('--output');args=parser.parse_args()
if args.output:Path(args.output).write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['passed','numericComparisons','occupationCount','syntheticProfiles']}))
