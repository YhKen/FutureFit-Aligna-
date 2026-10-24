"""Independent stdlib refit from raw synthetic rows, not JS formula imports."""
import sys,json,math
d=json.load(sys.stdin);data=d['data'];report=d['report'];count=0
def near(a,b):
 global count
 assert math.isfinite(a) and math.isfinite(b) and abs(a-b)<1e-9,(a,b)
 count+=1
def sig(x):return 1/(1+math.exp(-x))
def bucket(s):
 h=2166136261
 for c in s:h=((h^ord(c))*16777619)&0xffffffff
 return h%10
allowed={p['personId'] for p in data['people'] if p['trainingConsent'] and not p['withdrawn'] and p['synthetic']}
groups={k:[] for k in ['train','validation','test']}
for r in data['records']:
 if r['personId'] in allowed:
  b=bucket(r['personId']);groups['train' if b<6 else 'validation' if b<8 else 'test'].append(r)
for k,rows in groups.items():
 assert len(rows)==report['groups'][k]['rows']
 assert len({r['personId'] for r in rows})==report['groups'][k]['people']
w=[0.]*4;train=groups['train']
for _ in range(1500):
 g=[0.]*4
 for r in train:
  x=[1]+r['x'];err=sig(sum(a*b for a,b in zip(w,x)))-r['y']
  for j in range(4):g[j]+=err*x[j]/len(train)
 w=[v-.4*(g[j]+(.02*v if j else 0)) for j,v in enumerate(w)]
for a,b in zip(w,report['model']['w']):near(a,b)
base=sum(r['y'] for r in train)/len(train)
def scores(rows,ps):
 ps=[max(1e-12,min(1-1e-12,p)) for p in ps]
 brier=sum((p-r['y'])**2 for r,p in zip(rows,ps))/len(rows)
 loss=-sum(r['y']*math.log(p)+(1-r['y'])*math.log(1-p) for r,p in zip(rows,ps))/len(rows)
 pos=[p for r,p in zip(rows,ps) if r['y']==1];neg=[p for r,p in zip(rows,ps) if r['y']==0]
 auc=sum(1 if a>b else .5 if a==b else 0 for a in pos for b in neg)/(len(pos)*len(neg))
 return brier,loss,auc
for k,rows in groups.items():
 ps=[sig(sum(a*b for a,b in zip(w,[1]+r['x']))) for r in rows]
 for name,values in [('model',ps),('baseline',[base]*len(rows))]:
  for key,v in zip(['brier','logLoss','auc'],scores(rows,values)):near(v,report['evaluation'][k][name][key])
 for b in report['evaluation'][k]['model']['bins']:
  ix=[i for i,p in enumerate(ps) if min(4,int(p*5))==int(b['range'][0]*5+.01)]
  assert len(ix)==b['n']
  if ix:
   near(sum(ps[i] for i in ix)/len(ix),b['predicted']);near(sum(rows[i]['y'] for i in ix)/len(ix),b['observed'])
binary=[r for r in data['binary'] if r['personId'] in allowed and bucket(r['personId'])<6]
theta=[0.]*len(binary);diff=[0.]*8
for _ in range(1200):
 gt=[.03*x for x in theta];gb=[.03*x for x in diff]
 for i,r in enumerate(binary):
  for j,y in enumerate(r['answers']):
   err=sig(theta[i]-diff[j])-y;gt[i]+=err/8;gb[j]-=err/len(binary)
 theta=[v-.5*g for v,g in zip(theta,gt)];diff=[v-.5*g for v,g in zip(diff,gb)]
 centre=sum(theta)/len(theta);theta=[v-centre for v in theta]
for a,b in zip(theta,report['rasch']['theta']):near(a,b)
for a,b in zip(diff,report['rasch']['difficulty']):near(a,b)
infos=[sig(-v)*(1-sig(-v)) for v in diff];best=max(range(8),key=lambda i:infos[i])
assert best==report['rasch']['next']['item'];near(infos[best],report['rasch']['next']['information'])
print(json.dumps({'passed':True,'comparisons':count,'scope':'Independent Python refit of synthetic logistic/Rasch and evaluation arithmetic only; no real validity certification.'}))
