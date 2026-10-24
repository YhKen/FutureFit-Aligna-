import json,math,subprocess,os,argparse
from fractions import Fraction as F
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[1]
d=json.loads(subprocess.check_output([os.environ.get('NODE_BINARY','node'),str(root/'tests/validation-stat-fixtures.mjs')],cwd=root))
def check(a,b):
 if a is None or b is None: assert a is None and b is None,(a,b)
 else: assert abs(float(a)-b)<1e-10,(a,b)
def kappa(rows):
 n=len(rows);table=[[sum(a==i+1 and b==j+1 for a,b in rows) for j in range(3)] for i in range(3)]
 observed=sum(F(table[i][j]*abs(i-j),2*n) for i in range(3) for j in range(3))
 expected=sum(F(sum(table[i])*sum(table[z][j] for z in range(3))*abs(i-j),2*n*n) for i in range(3) for j in range(3))
 return 1-observed/expected if expected else None
# Independent covariance identity, distinct from JavaScript ANOVA sums of squares.
def icc(rows):
 n=len(rows);a,b=zip(*rows);ma,mb=F(sum(a),n),F(sum(b),n)
 va=sum((x-ma)**2 for x in a)/(n-1);vb=sum((x-mb)**2 for x in b)/(n-1);cov=sum((x-ma)*(y-mb) for x,y in rows)/(n-1)
 denom=va+vb+(ma-mb)**2-(va+vb-2*cov)/n
 return 2*cov/denom if denom else None
for f in d['fixtures']: check(kappa(f['pairs']),f['k']['kappa']);check(icc(f['totals']),f['icc']['value'])
def rng(seed):
 while True:
  seed=(seed+0x6D2B79F5)&0xffffffff;t=seed;t=((t^(t>>15))*(t|1))&0xffffffff;t=(t^((t+(((t^(t>>7))*(t|61))&0xffffffff))&0xffffffff))&0xffffffff
  yield ((t^(t>>14))&0xffffffff)/4294967296
r=rng(20261023);rows=np.array(d['rows'],dtype=float);vals=[]
for i in range(2000):
 a=rows[[math.floor(next(r)*len(rows)) for j in range(len(rows))]];v=a.var(axis=0,ddof=1);c=np.cov(a.T,ddof=1)[0,1];den=v.sum()+(a[:,0].mean()-a[:,1].mean())**2-(v.sum()-2*c)/len(a)
 if den>1e-12: vals.append(2*c/den)
check(np.quantile(vals,.025,method='linear'),d['boot']['lower']);check(np.quantile(vals,.975,method='linear'),d['boot']['upper']);assert len(vals)==d['boot']['valid']
out={'allPassed':True,'pointComparisons':320,'bootstrapReplicates':2000,'bootstrapValid':len(vals),'methods':['Fraction contingency-table weighted kappa','Fraction covariance identity for ICC(A,1)','NumPy covariance bootstrap and independent quantile'],'scope':'Synthetic numerical cross-check only; not professional or human validation'}
parser=argparse.ArgumentParser();parser.add_argument('--output');args=parser.parse_args()
if args.output: Path(args.output).write_text(json.dumps(out,indent=2))
print(json.dumps(out))
