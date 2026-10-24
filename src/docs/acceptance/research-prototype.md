# Research rehearsal / Prototype

This follows the user's instruction to prepare synthetic material for a prototype, not to claim that human validation has happened.

Open `research-lab.html?role=hr` or `research-lab.html?role=seeker` while signed in. The original workspace navigation and active synthetic application cards link to this page. Both parties use the same frozen job description and shared synthetic candidate. All 120 cohort people, 6 experts, item responses, ratings and task outcomes are synthetic. No copied commercial scale items, raw CV, private questionnaire or game answers are loaded.

## Delivered

- Recruitment and consent templates in Chinese, English and Malay.
- Three separate simulated choices: research statistics, model training, sharing with two assigned raters. Withdrawal excludes all three. Changing a purpose recalculates only eligible evidence.
- Expert relevance edits, missing-value preservation, I-CVI and complete-only S-CVI summary using the existing validation-statistics implementation.
- Paired synthetic ratings, per-criterion Kappa, complete-case total ICC(A,1), case-level bootstrap intervals. The actual blind-review access controls remain in the existing Firebase workflow; the rehearsal form is explicitly a coordinator's simulator, not two real blind raters.
- Person-level deterministic train/validation/test allocation. Two records from one person never cross groups. Initial eligible allocation: 61 / 25 / 21 people. These are generated counts, not sample-size recommendations.
- Fixed L2 logistic regression using synthetic skill-record coverage, sample accuracy and record completeness to predict a **synthetic task-completion outcome**. It never predicts hiring, trustworthiness or a person's employability.
- Training-only prevalence baseline, Brier, log loss, AUC and held-out calibration bins. No test-set tuning. Validation is shown but not used for model selection. Repeated reruns are deterministic, not additional independent experiments.
- Eight original toy binary items, regularised joint Rasch fit with mean-zero theta, fixed discrimination 1, and maximum-information selection from unasked items. A user-selected toy theta demonstrates selection; no online ability estimation, exposure control, validated stopping rule or production CAT is claimed.
- Language/form descriptive conditions, named-scale permission register, permanently blocked production gate, exportable JSON and authenticated Firebase persistence.

## Storage boundary

The page calls `/api/research-prototype` with the signed-in Firebase token. The backend uses the caller's ordinary permissions, never Admin SDK access. Only the parties to the same active synthetic application can access its study.

- `aligna_research_prototypes/<applicationId>` freezes synthetic materials. HR edits are whitelisted, version-checked and recorded in an append-only operation log. The linked SIM-002 skill-coverage feature comes from the application; all other outcomes remain synthetic.
- `aligna_research_prototype_consents/<applicationId>` holds the candidate's separate statistics, training and ratings choices, withdrawal and own item history. HR cannot grant these purposes for the candidate. Other virtual participant controls remain a clearly labelled coordinator rehearsal.
- `aligna_research_prototype_reports/<applicationId>--<operationId>` holds immutable, server-computed snapshots. Atomic saving is followed by read-back comparison. Both roles receive the same digest and calculations.
- Changing purposes, source versions or closing the application invalidates old current snapshots. Withdrawal closes HR access. Candidates can still revoke their own consent after application closure. Exports cannot be recalled remotely.
- Conflicting writes return HTTP 409 and reload rather than silently overwriting. Genuine permission denials stay denied. No local dataset fallback is used.

The page reuses the original Sankey, matching and learning modules. Frozen context retains its job ID so the candidate can save learning steps into their existing private plans collection. HR can view advice but cannot save the candidate's private progress. Real research data must not be imported into this synthetic workflow.

Regular user assessment/game scores, official matching weights and the disabled production-model gate are unchanged. New Firestore rules were explicitly approved and published for the three scoped collections above. Named-scale permissions, real expert validation, real predictive validity and measurement equivalence remain pending.

## Current cloud acceptance evidence

- 173 Node logic tests; 941 Firestore permission assertions: 83 new and 858 regression, including the applications suite.
- 24 actual production API/Firebase checks: paired equality, source and snapshot read-back, separate purposes, stale snapshot denial, a real 200/409 write race, eight unique items, unrelated-account denial and withdrawal on a separate temporary application. The supplied main demo application stays active.
- 110 independent Python comparisons refitting the current cloud-derived synthetic cohort. Arithmetic agreement does not establish human validity.
- Responsive, three-language browser results and deployed asset checks are recorded in the separate `research-cloud-browser-proof.json` and `research-cloud-release-proof.json` evidence files.

## Repeatable checks

```sh
npm test
npm run audit:research
npm run build
```

The audit requires Python 3 standard library only. Set `PYTHON_BINARY` if the executable is not named `python`. It starts from raw synthetic records and independently refits logistic and Rasch models, independently reconstructs groups, metrics and item information. It writes `research-prototype-proof.json` and the clearly labelled `research-prototype-SYNTHETIC.json`. Agreement establishes implementation arithmetic, not professional validity. The fixture JSON is public synthetic data suitable for source control.

## Method references

- [Stan User's Guide: regression and item-response theory models](https://mc-stan.org/docs/stan-users-guide/regression.html#item-response-models) — model formulation reference; our numerical implementation is a simple regularised rehearsal, not Stan inference.
- [scikit-learn: cross-validation and grouped observations](https://scikit-learn.org/stable/modules/cross_validation.html) — rationale for separate data groups; this prototype uses a fixed hash of person ID, not scikit-learn.
- [scikit-learn: evaluation metrics](https://scikit-learn.org/stable/modules/model_evaluation.html) — metric definitions; formulas are implemented in JavaScript and independently checked in Python.

## P2 / P3 tracking

A06–A10 have prototype workflow coverage, while actual expert reviews, human agreement, real outcomes, equivalence and rights-holder permissions remain pending. A11 has runnable synthetic training and an IRT selection rehearsal, while real-data model training and production activation remain pending. Neither the data count nor a successful audit changes those statuses.
