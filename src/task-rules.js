export const H03_PRACTICE_BLUEPRINTS = {
  version: 'H03-public-v1',
  tasks: [
    {
      id: 'task-budget-tradeoff',
      title: {
        zh: '预算取舍',
        en: 'Budget choices',
        ms: 'Pilihan belanjawan'
      },
      category: 'resourceManagement',
      relatedSkill: 'Management of Financial Resources',
      targetJobTitle: 'Event & Community Project Coordinator / 商业活动与社群项目协调员',
      context: {
        zh: '你负责一项社区推广计划。时间上限 240 分钟，总预算上限 RM 120，目标是模型估算至少覆盖 100 人。每项方案最多做一次，不可拆分。假定人数不重复可相加，仅用于合成演练。',
        en: 'You are coordinating a community outreach activity. Maximum time is 240 minutes, budget ceiling is RM 120, and the estimated target is to cover at least 100 people. Each option can be done at most once without splitting. Assume counts do not overlap.',
        ms: 'Anda menyelaras jangkauan komuniti. Had masa 240 minit, siling belanjawan RM 120, sasaran liputan sekurang-kurangnya 100 orang. Setiap pilihan dibuat paling banyak sekali tanpa dipecah.'
      },
      options: [
        { id: 'A', name: { zh: 'A 社群通知', en: 'A Community notice', ms: 'A Notis komuniti' }, time: 60, cost: 20, reach: 30 },
        { id: 'B', name: { zh: 'B 宣传海报', en: 'B Poster campaign', ms: 'B Poster promosi' }, time: 45, cost: 40, reach: 45 },
        { id: 'C', name: { zh: 'C 伙伴联络', en: 'C Partner outreach', ms: 'C Jangkauan rakan' }, time: 90, cost: 10, reach: 40 },
        { id: 'D', name: { zh: 'D 现场活动', en: 'D Live event', ms: 'D Acara langsung' }, time: 120, cost: 80, reach: 70 }
      ],
      constraints: {
        maxTime: 240,
        maxBudget: 120,
        minReach: 100
      },
      followUp: {
        id: 'task-budget-tradeoff-followup',
        zh: '追加追问：若突发变故，预算缩减为 RM 80，目标提高到 130 人，其他条件不变。如何调整？',
        en: 'Follow-up scenario: budget reduced to RM 80, target increased to 130 people, other options unchanged. How do you respond?',
        ms: 'Senario lanjutan: belanjawan dikurangkan kepada RM 80, sasaran dinaikkan kepada 130 orang, pilihan lain kekal. Bagaimana tindakan anda?',
        constraints: {
          maxTime: 240,
          maxBudget: 80,
          minReach: 130
        },
        maxFeasibleReach: 115,
        isInfeasible: true
      }
    },
    {
      id: 'task-delivery-handover',
      title: {
        zh: '交接记录',
        en: 'Handover records',
        ms: 'Latihan Tugas 2: Semakan Anomali Rekod Serahan'
      },
      category: 'technical',
      relatedSkill: 'Quality Control Analysis',
      targetJobTitle: 'Operations & Logistics Analyst / 运营与物流分析员',
      context: {
        zh: '系统显示当天共有 26 份配送交接记录。统计状态为：已交接 18 份、退回 4 份、待确认 7 份。请找出影响完成比例的疑点，并制定核实方案。',
        en: 'The system reports 26 delivery handover records for today. Status counts: 18 delivered, 4 returned, 7 pending confirmation. Identify discrepancies that impact completion rate and propose a verification plan.',
        ms: 'Sistem melaporkan 26 rekod serahan hari ini. Status: 18 diserahkan, 4 dikembalikan, 7 menunggu pengesahan. Kenal pasti percanggahan yang menjejaskan kadar penyiapan.'
      },
      data: {
        totalDeclared: 26,
        breakdown: { delivered: 18, returned: 4, pending: 7 }
      }
    }
  ]
};

export function budgetReference(isFollowUp=false){
 const task=H03_PRACTICE_BLUEPRINTS.tasks[0],limits=isFollowUp?task.followUp.constraints:task.constraints,combinations=[];
 for(let mask=0;mask<2**task.options.length;mask++){
  const selected=task.options.filter((_,i)=>mask&(1<<i));
  const totals=selected.reduce((s,o)=>({time:s.time+o.time,cost:s.cost+o.cost,reach:s.reach+o.reach}),{time:0,cost:0,reach:0});
  combinations.push({ids:selected.map(o=>o.id),...totals,withinResources:totals.time<=limits.maxTime&&totals.cost<=limits.maxBudget});
 }
 const resourceFeasible=combinations.filter(c=>c.withinResources);
 return {limits,feasible:resourceFeasible.filter(c=>c.reach>=limits.minReach),maxReach:Math.max(...resourceFeasible.map(c=>c.reach))};
}

// Only explicit numerical constraints are checked; reasoning requires review.
export function evaluateBudgetTask(selectedIds=[],claimedInfeasible=false,explanation='',isFollowUp=false,claimedMaximum=null){
 const task=H03_PRACTICE_BLUEPRINTS.tasks[0],reference=budgetReference(isFollowUp),ids=Array.isArray(selectedIds)?selectedIds:[];
 const validInput=Array.isArray(selectedIds)&&new Set(ids).size===ids.length&&ids.every(id=>task.options.some(o=>o.id===id));
 const metrics=task.options.filter(o=>ids.includes(o.id)).reduce((s,o)=>({time:s.time+o.time,cost:s.cost+o.cost,reach:s.reach+o.reach}),{time:0,cost:0,reach:0});
 const checks=[{key:'selection',passed:validInput},{key:'time',passed:metrics.time<=reference.limits.maxTime},{key:'budget',passed:metrics.cost<=reference.limits.maxBudget},{key:'target',passed:metrics.reach>=reference.limits.minReach}];
 const noSolution=reference.feasible.length===0;
 const numericPassed=claimedInfeasible?validInput&&noSolution&&claimedMaximum!==null&&Number(claimedMaximum)===reference.maxReach:checks.every(c=>c.passed);
 return {success:numericPassed,numericPassed,checks,metrics,reference,claimedInfeasible,reviewRequired:true,explanationRecorded:!!String(explanation).trim(),recommendedAdjustment:null,verification:'public-practice-unverified'};
}

export function evaluateHandoverTask(input={}){
 const task=H03_PRACTICE_BLUEPRINTS.tasks[1],sum=Object.values(task.data.breakdown).reduce((a,b)=>a+b,0);
 const numericPassed=typeof input==='object'&&input!==null&&input.sum!==''&&Number(input.sum)===sum&&input.mismatch===true&&sum!==task.data.totalDeclared;
 return {success:numericPassed,numericPassed,expectedSum:sum,declared:task.data.totalDeclared,reviewRequired:true,explanationRecorded:!!String(input?.explanation||'').trim(),recommendedAdjustment:null,verification:'public-practice-unverified'};
}
