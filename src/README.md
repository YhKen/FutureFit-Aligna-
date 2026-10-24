# Future Fit

Career exploration and a shared job seeker / hiring workspace, in Chinese, English and Malay.

Live site: https://aligna-two.vercel.app/

## Run locally

Use Node.js 24. No install step is required for this buildless HTML/CSS/ES modules app.

```sh
npm start
```

Open the URL printed by the server (normally http://127.0.0.1:4180/; it selects the next available port if occupied). Windows can use `双击启动FutureFit.cmd`; macOS can use `start-mac.command`. Firebase authentication and Firestore access require internet, the existing configured project and an authorised local domain. The local server forwards the existing news/trends endpoints and the authenticated work-samples endpoint with their permitted methods to the existing production service; it does not run a replacement Firebase or backend. Existing production authentication and reviewer permissions still apply.

```sh
npm test
npm run build
```

The build copies browser assets into `public/`. Vercel handles `api/trends.js` separately. Generated output, local credentials, test accounts, personal records and deployment credentials are excluded from Git.

## Product flow

- Job seeker: verified account → CV / career profile → 30 adaptive questions → both memory and rule-switching tasks → workspace, career comparison and learning routes.
- HR: verified account and employer profile → draft and publish a job description → consented applications → skill comparison, interview guide and in-app interview status.
- Applicants explicitly choose what profile to share. Raw questionnaire answers, game trials and private learning plans are not shared with HR. Withdrawal closes the employer's in-app application access.
- Interview invitations are in-app records. This app does not send interview emails or create calendar meetings automatically.

## One matching engine, two perspectives

`match-engine.js` is used by the seeker job board, application preview, shared application and HR candidate view. The same JD and shared application yield the same values on both sides.

1. Align canonical explicit JD skill names with the candidate's self-reported skill records. Avoid substring inference and exclude unrelated extra skills from the denominator.
2. JD role skills have weight 2, collaboration skills weight 1. **Record coverage** is matched weight / total weight.
3. **Cosine similarity** is J·C / (‖J‖‖C‖). J contains these JD weights; C contains the same value when a corresponding record exists, otherwise zero. Empty vectors remain unscored.
4. **Example coverage** is the number of recorded skills with a concrete example / number of recorded skills.
5. `jd-sankey.js` visualises those same weights. Selecting a skill shows its original JD term, shared profile record, example and individual contribution. Both views show the same topics, work samples, review criteria, courses and optional credentials from `jd-learning-data.js`.

Private pre-application estimates can differ from an application because the applicant chooses which records to share. The application on both sides uses the same shared snapshot. Job preferences are separate equally weighted explicit criteria, with unmentioned JD conditions left unconfirmed.

These are transparent, **uncalibrated** rules, not validated hiring probabilities, verified competence, lie detection or trustworthiness scores. Cosine and coverage reuse the same records and are not independent confirmation. Personality, game results, names, age and gender do not contribute to JD matching. Do not automatically accept or reject candidates from these outputs.

## Integration delivery, 21 October 2026

`skill-catalog.js` is the shared explicit-alias registry. `integration-contract.js` derives stable skill/record IDs and content references for the rule, current job and supplied records. The expanded calculation view exposes these references on both sides. Content references identify reproducible inputs; they are not signatures, verification of a claim, or a frozen historical posting. The existing 2/1 coverage and cosine formulas are unchanged. Legacy application records work without a database migration or permission expansion; client-supplied verification claims are not promoted.

`integration-fixtures.js` supplies one explicitly synthetic candidate, three real catalogue occupation IDs, and two synthetic task rubrics for team integration. They are not automatically loaded as real users. `work-task-contract.js` copies the predeclared rubric/tool conditions and detects later edits, distinguishes unobserved/self-reviewed/assisted results, and proposes only a named introductory-practice adjustment with user confirmation. **This is a tested contract, not a deployed task workflow**: authenticated reviewer enforcement, persisted attempts and reviews, HR task content approval and seeker task UI remain outstanding. Callers must enforce reviewer identity server-side; a supplied role string is not authentication. It never changes job matching, personality, or game scores.

The existing `futures.html` now reads `/api/news-feed` (the published, moderated catalogue); the local server proxies that read-only endpoint. `trend-evidence.js` shares the exact-quote grounding gate with the server news policy and checks supported impacts, approval where required, jurisdiction, dates, safe URLs and URL/skill deduplication for the future view. Article counts no longer add occupation-ranking points. Supported learning evidence can change only corresponding practice priorities; it cannot establish occupation demand or change ability. The two existing future assumptions remain explicit, uncalibrated hypotheses. A validated direction-of-demand model and full side-by-side scenario/SDG redesign are not yet implemented.

Run `npm test` for the existing and new regression checks; the integration checks cover same-input parity, version invalidation, aliases, legacy records, sensitive-field exclusion, bounded task actions and unsafe/insufficient trend evidence. Real Firebase proof outside this repository records read-only parity for the retained synthetic application; it is distinct from local synthetic task/trend tests.

## Assessment and evidence limits

The private workspace shows recorded skill sources alongside five career directions. Career search is grouped with jobs and applications in the top workspace navigation. Recommendations use the existing questionnaire ranking and show five occupations per group with usable skill reference data; explicit searches can still find the full occupation catalogue. Skill-record counts and answer averages are labelled separately from verified ability. The expanded evidence graph traces CV/profile and questionnaire sources and highlights the selected skill; it omits empty branches.

The bank currently contains 151 items and occupational reference data for 923 occupations. The adaptive question selector uses coverage and clarification rules; it is not a trained self-learning model or calibrated CAT/IRT. A 30-item mixed exploration is not equivalent to administering every complete licensed scale. Restricted formal scales require their owners' permission; the site identifies original exploratory items and limitations.

CV/profile and answered skill items can be inspected in the private workspace evidence graph. Games describe performance in this session and can guide practice pacing; they do not establish IQ, employment ability, deception or diagnosis.

Learning links are curated official resources, not a promise that any credential is mandatory or sufficient for a role. News uses publisher-linked public RSS with caching and an unavailable state. External article and qualification titles retain their source language.

## Career-change routes and coverage follow-ups

`transition.html` is the fourth workspace branch. It uses the existing occupation catalogue and source-linked, confirmed CV/self-report records. Missing records are explicitly unassessed, not established inability. Its percentage is **record coverage**, with the denominator and practice-priority formula available in the interface. It is not a hiring probability or a validated proficiency score. Three-, five-, six- and twelve-month budgets produce three phases; country links are official checking tools, not automatic qualification recognition. Stage progress is private Firestore `plans` data under the existing owner-only rules.

After the initial 30 questions, `evidence-standard.js` checks an explicit **product coverage policy**: two items per interest/personality dimension, one per work-value/readiness dimension, six skill self-reports and two situations. Mixed dimensions receive a third item where available. Unseen items from missing areas receive routing priority. Sessions can extend to 40/50/60 questions. At 60, uncertainty remains visible rather than claiming complete understanding. This is not calibrated IRT/CAT, trained machine learning, a validated reliability threshold, or lie detection. Answers record the `coverage-v1` routing version. Existing legacy sessions remain readable; the new journey gate applies to new-policy answers. Existing completed-game timestamps are preserved when supplementing a session.

The news pipeline in `api/news-sync.js` is scheduled daily by Vercel Cron. Ordinary summaries release every 72 hours; major or uncertain items remain pending until a verified allowlisted reviewer approves them in `news-review.html`. Requests are capped at 20 model attempts per UTC day, deduplicated and protected by a Firestore lease. Source failures and unavailable AI preserve the last published route. A deployment must have the server Secrets configured before the scheduler can authenticate.

**No-card / no-paid-fallback configuration:** `NEWS_AI_PROVIDER=gemini-free`, `GEMINI_FREE_TIER_CONFIRMED=true`, `GEMINI_FREE_MODEL=gemini-3.5-flash-lite` and the server-only `GEMINI_NEWS_API_KEY` use a Google AI Studio project verified to be on the Free tier without a billing account. The application does not configure billing, add cards, buy credits, invoke paid search/tools, or fall back to Vercel AI Gateway. A quota error queues the item and stops that batch. No key or Free-tier confirmation means no model request. External account owners must keep the selected project unlinked from billing; the app cannot control later account changes.

The AI receives public title/excerpt/source/date and canonical skill names only. Official training/workforce RSS is prioritised, including the U.S. Department of Labor with an explicit US jurisdiction. General news without career relevance is excluded. Each skill impact requires an exact quote and explicit skill/training evidence in the excerpt; declining-demand statements cannot increase training priority. Country-specific programmes only affect subscribers in that country. Headline-only or tentative impacts never change learning order. Published, supported impacts multiply the existing practice priority by `1 + min(0.30, 0.10 * relevant item count)`. This is an explicit uncalibrated priority policy, not a proven labour-market coefficient. It does not alter skill scores or hiring probabilities. The interface shows original and updated order, practice tasks, source evidence and official learning/qualification links.

Subscriptions require explicit consent and store only the target, country, time budget and skill snapshot. A UID-pinned isolated Firebase Auth worker can read those subscriptions, write news/review audit records and update the corresponding owner-only `trend_updates/current` while active. It cannot read raw CVs, questionnaire sessions, games or HR notes. API review checks the verified Firebase email against `NEWS_REVIEWER_EMAILS`; audit decisions are atomic. Raw records, run failures and public catalogues are separate Firestore collections. Background replanning handles up to 100 subscriptions per run; each user visit also refreshes their own published-version update.

SDG links are Aligna's suggested work/skill-purpose mappings, not UN endorsement or measured impact. The terms page identifies product scope and leaves final hiring decisions to humans. User-visible job-description labels avoid the abbreviation; interface language is restored before shared navigation renders on every page.

## Firebase and deployment

`cloud.js` contains browser Firebase configuration. A Firebase web API key identifies a project and is not an administrator credential. Security depends on authentication and Firestore rules. Never commit service-account files, private keys or user exports.

`firebase/firestore.rules` is the checked-in rules reference. Review and test rules in an emulator before deployment; this repository does not automatically publish rules or alter production permissions. Configure your own project in `cloud.js` if reusing this source. Authorise only intended domains in Firebase Authentication.

The existing Vercel project uses `npm run build` and the `public` output directory. Linking this repository to a hosting account is a separate step; do not commit `.vercel/` or authentication tokens.

## Source and licensing notes

O*NET data and interest resources: https://www.onetcenter.org/content.html . Review current attribution and licence conditions before redistribution. Instrument references and method limits are available in `research.html`, `library-data.js` and `matching-method.html`.

Bundled document readers retain their upstream headers: Mammoth and PDF.js in `vendor/`. This repository does not grant a new licence to third-party content or restricted assessment instruments. No blanket open-source licence has been assigned to the application.

## Seeker release — 22 October 2026

Private work practice and interview attempts, learning actions, route settings/progress and news receipts use owner-only subcollections under `aligna_users/{uid}`. Their reviewed rules are published to project-d32d7. Six private collection writes were read back from production and rejected for the synthetic HR account. The seeker update is deployed to https://aligna-two.vercel.app/. Browser tests cover authenticated record saving, reload recovery and language navigation; a fresh synthetic account has now completed real registration, PDF/DOCX/TXT autofill, 50 adaptive answers, both games, career/learning saves, application, HR invitation, acceptance and withdrawal, with independent production read-back.

Learning routes use dependency ordering and bounded weekly hour slots. Durations are planning estimates, not course or qualification guarantees. Completion is self-recorded. Official free-resource and optional-credential metadata lives in `resource-details.js`; unknown fees never qualify as free mandatory resources. User-confirmed news receipts gate learning reprioritisation and support undo. None of these records changes hiring scores or independently verifies a skill.


## Combined H01 acceptance 2026-10-22

`job-requirements.js` is the shared structured contract. Skill category and entry requirement are independent. Applications freeze the entire public job posting and matching basis; both platforms use that snapshot. No-op saves retain the version. The live v1 application remains at 60% coverage / 75% cosine after the current v2 posting changes to 100% coverage. These are record-comparison measures, not hiring odds or validated ability scores.

`requirements-editor.js` supports up to 30 skills, 20 outputs and 10 qualifications, preserving entered text and salary ranges. New-document creation avoids prohibited reads of absent private documents. Applications retain an explicit authenticated duplicate query and rule-enforced immutable create fields.

55 Node tests and the static build pass. 28 new H01 rule checks include duplicate write denial and maximum-capacity contracts; prior private-record rules remain in place. New rules were explicitly approved and published. The combined source and acceptance records are maintained in this repository; see docs/acceptance for this handoff.

Five real free Gemini 3.5 Flash-Lite summaries, token usage, rejection decisions and reviewer audit events were read back from Firebase. Publication, retraction, re-review and stale-browser conflict were exercised. A relevant synthetic subscriber's route version changes with the sector catalogue; an unrelated subscriber retains its version. No new article had a supported positive learning impact, so priorities were correctly retained. Positive-impact arithmetic remains covered by controlled tests rather than claimed as a real-news observation. The Department of Labor feed was unavailable and the daily model budget stopped at 20.

Formal HR task materials/scoring and domain validation of weights remain pending. Chromium responsive checks cover 320, 390, 768 and 1440 pixels; physical iOS/Android and large-scale capacity testing are separate. See docs/acceptance for the updated PDF and evidence.


## Responsive, multilingual and concurrent acceptance 2026-10-22

132 recorded Chromium viewport/language checks cover 12 seeker views, three interface languages, narrow phones, tablet and desktop. Additional HR checks cover job editing, candidates and the shared Sankey in all three languages. Official occupation/resource names and user-entered CV/job text remain in their original language. This is not a claim of physical-device certification.

The 151 question prompts, all choices and skill labels have Chinese, English and Malay entries. A synthetic account answered 20 supplementary questions through the UI in all three languages; the original 30 answers stayed unchanged and every new value, language and question text was read back from Firebase. Older records can no longer bypass coverage checks by omitting routing metadata. Browser bookmarks are scoped to the signed-in UID.

Real production concurrency uses three synthetic accounts in four independent Firebase sessions, including same-job edit races, duplicate application races, realtime HR updates, six parallel private saves, five prohibited cross-user operations and withdrawal versus invitation. Two accounts also make eight concurrent authenticated personal-news requests with no-store headers and isolated responses. This is bounded acceptance, not a capacity benchmark.

Job edit forms retain the revision actually loaded. A stale writer gets a clear localized conflict and keeps its draft. Rules remain unchanged. A real committed private write with an injected lost client acknowledgement reports failure first; retry confirms the existing immutable record without writing twice. No production database export, passwords, tokens or server Secrets belong in the repository.

## Shared application and interview acceptance follow-up

Both audiences now use identical per-skill advice and a language-independent learning reference. Structured-only job requirements receive learning routes even when legacy text fields are empty. Real production reads and actual browser comparisons confirm frozen v1 at 60% record coverage / 75% cosine, while current v2 remains 100%; every contribution is checked by an independent Python reference. Personal learning progress remains private.

`stageApplicationRecord` does not rewrite an unchanged invitation or clear accepted/declined replies. A genuine reschedule resets the reply to pending. Live Firebase tests exercised acceptance, decline, duplicate saves and injected transaction failure, then restored the original synthetic invitation fields. All 55 Node tests pass. Updated 18-page acceptance PDF and 45-page plain-language algorithm guide are in docs/acceptance. Formal task validation, physical devices, high capacity and evidence-supported real-news positive reprioritisation remain separate pending work.


## Formal work samples

An active consented application links both audiences to `formal-work.html?application=APPLICATION_ID&role=hr` (or `role=seeker`). The API derives the role from the authenticated UID and application, not that query parameter. Two original tasks, resource planning and latest-state record auditing, each have A/B forms and four predeclared three-level anchors.

HR freezes the form, tools and suggested duration. Seeker drafts remain private; explicit sharing submits an immutable response. The posting HR records criterion-specific observations and an immutable review. Both users read the same records; withdrawal closes employer access. Numerical checks and observed-criteria percentages do not alter the existing job-match scores or certify ability. Reference keys stay out of static public assets; source is public, so this is not a proctored or secret test.

55 Node tests pass. New permission checks: 154; prior rules regressions: 131. Both A forms passed the real browser journey and B forms the production API journey. Python dynamic programming, SQLite and exact Fraction arithmetic independently verify reference numbers and review totals. Current acceptance evidence and the 18-page master / 45-page beginner guide are in `docs/acceptance`. Professional validity and inter-rater reliability remain pending.


## Consented review follow-up and settings

Formal work links to work-review.html with the same application ID. Corrections append immutable versions and atomically advance a checked head; clarification pins a rating version, and a response may link only a newer correction on that task. A proposed different reviewer receives only one submitted task after the candidate approves. First ratings, CV, questionnaire, games and clarifications remain inaccessible. Revocation and application withdrawal close reviewer access. The reviewer opens a scoped request link, not a global list.

Both owners see identical descriptive criterion comparisons. Exact agreement and mean absolute ordinal difference are not population inter-rater reliability and never change the frozen job match. A separate Python Fraction script reproduces saved arithmetic. 25 production follow-up checks plus eight withdrawal denials passed; 101 new and309 prior rule checks passed. Professional human rater validation remains pending.

Settings adds an owner-only display name and compressed raster avatar, light/dark preference, terms and sign-out. Profile writes use a transaction and server readback. No paid storage or new paid service is used. See docs/acceptance/release.json for current deployment and PDFs.


## H06 integration and regression checks

The H06 package is merged into the existing app, preserving original task rubric hashes and old applications. New formal assignments use the intersection of task criteria and frozen job skills, with exact work-output links checked by both the service and Firestore. Unlinked tasks are unavailable. Numerical checks use supplied materials and reject missing or infeasible inputs.

Interview times are stored as UTC instants, with explicit MYT, SGT, JST or UTC display. Candidate alternative-time proposals remain inside the existing consented application. A content-version token rejects stale invitations; no-op saves preserve responses. Updating a public posting does not rebase an existing application. Closed postings block new invitations and pending replies but still allow completion of an existing process.

Historical H06 verification: 66 Node tests, 440 sequential Firestore rule assertions, 26 authenticated production checks, browser-created proposals and matching HR readback. These verify implementation, not professional validity or hiring probability. See docs/acceptance and the updated 20-page master PDF.

To reproduce the permission checks, install the development dependencies in firebase/tests, start the Firestore Emulator at 127.0.0.1:8180, then run npm test from firebase/tests. The eight suites use only demo projects and execute sequentially. They do not seed or modify production data. Existing credentials and production test accounts are not included.


## Expert review and independent blind-scoring studies

The validation workspace is at https://aligna-two.vercel.app/validation.html and is linked from formal assignments. Freeze the job, task form, language, conditions, fixed two-rater design and predefined study plan before collection. Experts see task materials, references and anchors; raw candidate work continues to require the existing per-task respondent consent. Study analysis needs separate respondent consent and can be withdrawn.

The new workflow separates synthetic software tests from human evidence. It reports relevance CVI, per-criterion linear weighted kappa, exact agreement and rating differences, and complete-total ICC(A,1) for the fixed selected pair. Participant-level percentile bootstrap intervals report missing or undefined results. Stored snapshots are immutable and checked against recomputed sources; no automatic validity approval is issued. All four original task definitions have a versioned content fingerprint.

[16-page Chinese practical validation guide](docs/acceptance/FutureFit_专家审题与盲评验收指南.pdf) · [26-page progress and acceptance record](docs/acceptance/FutureFit_交付核查与进度总表.pdf) · [Current release evidence](docs/acceptance/release.json).

Historical validation checks: 89 Node tests, 566 Firestore permission checks, independent Python cross-checks and synthetic production Firebase readback. Professional content validity, actual human inter-rater agreement, form equivalence, norms and predictive validity remain pending. The new page's requested mobile viewport did not apply in this browser run; that scope is not marked passed.

Direct handbook download without a GitHub account: https://aligna-two.vercel.app/validation-guide.pdf . The local server serves the same declared PDF at that path; other documentation and backend source paths remain unavailable on the public site.


## Seeker features 1–3 (2026-10-23)

- `counterfactual.html`: try each missing explicit skill with the existing HR matcher. Show current and hypothetical coverage, full numerator/denominator, largest single-record gain, learning links and optional credential references. Profile data and interest ranking are unchanged. Five directions per page, from the original top twenty.
- `life-skills.html`: catalogue/action-rule extraction on the device, exact source spans, unchecked-by-default confirmation, private Firebase save/readback and removal from future matching. It is **not an LLM implementation**. The employer-facing export contains only consented skill names and a self-report source type, never the private original quote; old application snapshots remain frozen.
- `career-try.html`: budget, record reconciliation and customer-policy fragments, with two emails, a task, reasoning and reflection. All 923 catalogue roles can choose templates by mean O*NET skill importance. These are three generic fragments, not 923 expert-validated job simulations. Fixed conditions are checked; written reasoning is unassessed, private and does not increase match scores.

Current checks: **108 Node tests; 633 Firestore rule assertions** (566 prior + 67 new). Production browser writes and direct Firebase readback, three synthetic trial templates plus a deliberate conflict, cross-account rejection, max-12 life claims, removal, and original session/game preservation are recorded in `docs/acceptance/exploration-*.json`. Independent Python Fraction and vector identities checked 4,550 values across 923 roles. Mobile records include actual 320px and 390px widths in zh/en/ms. Professional human validity and physical-device certification remain pending. No new paid service, AI credential or news-worker access was added.

Life evidence v2 stores skill IDs and source offsets against one private original text, then re-grounds claims on read; this avoids Firestore's per-request expression limit hit by redundant v1 nested data. Existing v1 records remain readable and removable. Test rule suites run sequentially against an emulator only.

Independent arithmetic reproduction without cloud credentials: `python tests/counterfactual-crosscheck.py` (set `NODE_BINARY` if Node is not on PATH). It runs a fixed synthetic input across the 923 catalogue roles, independently verifies coverage, cosine and the maximum gain, and prints its check count.


## 求职者七项功能：第 4–7 项（2026-10-23）

新增 `ai-trends.html`、`study-calendar.html`、`application-reflection.html`、`portfolio-careers.html`，通过同一 workspace / Learn & Grow / 找工作 / 换职业导航接入。保留首次问卷及两个挑战门槛，页面使用现有米色样式和中文、英文、马来语。第 1–3 项不重做。

- **技能与 AI 变化**：`ai-exposure.js` 是带来源、日期的人工任务—技能对应表，不是取代概率。未知技能保留未知。技能详情、JD 学习建议和路线单元复用标签；相关动态必须经过既有发布审核及技能引文过滤，不改变匹配分。
- **班表与本地资源**：每周 168 个整点小时，保留睡眠 / 工作 / 上课及学习上限；将现有先修有序的学习单元放进空档，跳过同目标已完成步骤，明确报告待排小时。支持带时区的本机 ICS 导出。eLATiH 只把 FREE 标记入口当免费；Rakyat Digital 基础资源与年龄限定优惠分开；PERKESO 补助和费用待本人核实。
- **申请复盘**：使用本人原申请冻结的 job description 和 candidate，调用原 `matchCandidate`，不另造分数。拒信原句用本机规则提取，可能漏掉复杂措辞；不把差距解释为拒绝原因。没有回复不等于拒绝。每个不同申请统计一次，本人确认的学习重点经来源重核后才带到成长页。原信不发给新闻模型或 HR。
- **组合工作**：先取最多 30 个选项，再检查最多 435 对的班次、通勤、工时和学习保留冲突。时薪×每周小时×52/12，月薪不重复换算。最多展示 5 对。收入是税前估算，手填数据未核实；合成例子不和真实职位混合。仅支持明确整点固定班次，模糊班次不猜。

算法集中在 `seeker-tools-core.js`。使用确定性 first-fit 排程、去重的有界组合枚举、原匹配引擎、精确原文位置引用和字典规范化。没有引入付费或新的私人文本外部模型。岗位匹配分依然不是录用概率。

新增私人集合在 `aligna_users/{uid}` 下：`seeker_availability`、`career_reflections`、`career_priorities`、`career_options`。本人验证账号专用；拒信和薪资创建后不能改写，只能移出后续使用。**规则是否已经正式发布、正式存取是否通过，须查看 `docs/acceptance/release.json` 的 `careerTools`，不能用本机 Emulator 通过代替正式云端结果。**

复现：`node --test tests/*.test.mjs`；Firestore Emulator 按 `firebase/tests/run-all.mjs` 执行 11 套权限检查。`docs/acceptance/career-tools-rule-proof.json` 记录 749 项权限检查；`career-tools-independent-proof.json` 记录独立 Python Fraction / datetime 的 1,796 项核对。专业效度、真人审阅和真实市场覆盖仍待验收。

独立核对可复现：`node scripts/verify-career-tools.mjs | python scripts/verify-career-tools.py`。仅生成合成算例，不读取用户资料，不依赖网络或 Python 第三方库。

正式验收更新：四类私人规则已获确认并发布；正式站已部署 `dpl_CMvvx625Ho2o4VYrKzotytQUfLRR`。125 项 Node 检查、749 项 Emulator 权限检查、51 项正式 Firebase 存取/隔离检查、24 组正式手机三语视图通过；9 个资产逐字节匹配。实际 ICS 导出 12 个事件，已确认的财务学习重点出现在成长页；原问卷、游戏及申请记录保留。移除、无回复、重复申请和来源变化均有检查。详情见 `career-tools-live-proof.json`、`career-tools-browser-proof.json` 和 `career-tools-deploy-proof.json`。没有启用付费或新增密钥；真机及专业效度仍待验收。


## 全新求职者 S003：七项功能整条链验收（2026-10-23）

从正式网站新注册、真实邮件验证、上传合成 PDF 开始。CV 两条教育、两条工作和六项技能自动填入；30 题覆盖不足时出现弹窗，保存返回后继续至 50 题。两项挑战都经服务器读回才开放工作区。随后同一个客服目标串起七项功能、每周 4 小时学习路线和本人申请。

本轮通过 **126 项 Node 检查、114 项正式 Firebase 检查、125 项新账号独立 Python 算术/日期/先修核对、96 组手机三语视图**。HR 普通账号读取同一份获准分享的冻结申请，70% 覆盖、85% 余弦及逐技能证据与求职者完全一致。具体原因、学习重点、时间约束与收入边界均有读回/重算，不靠空白演示数据。

修复了挑战未保存却提前显示已保存，以及 320px 英文“Not enough trials”撑出卡片的两个问题。自动化游戏的全部过快反应被排除，真实反应时间仍显示样本不足；不当作人的能力数据。第 4 项读已发布证据时没有直接相关新动态，系统正确保留原判断。第 5 项云端班表生成 45 个 ICS 事件，本次是程序内容核对，前轮实际下载 12 个事件的记录另行保留。

本轮正式部署：`dpl_9xqqYyDL2nq6bkbHproMjkkLrd8g`，运行代码 `e1a0a7205bc7d1172023c13a7e868ab7e6f7a40e`。查看 `docs/acceptance/seven-fresh-*.json` 及 `release.json` 的 `freshSeekerAcceptance`；[更新后的 34 页总表](docs/acceptance/FutureFit_交付核查与进度总表.pdf) 第 31-34 页是本次补充。旧页面/旧测试数字保留为历史证据，不能相加当真人样本。

仍待真人专家、真实盲评、物理手机和辅助技术验收。职业试穿文字与生活经历没有因此被认证；没有启用付费、扩大新闻账号权限或改变原有申请授权。

## HR 合并、公司验证与面试反馈（2026-10-23）

选择性合并 `02_HR组完整版.zip` 与 H02/H04 合并包。保留现有问卷、游戏、7 项私人功能、正式工作样本、独立盲评及撤回规则，未用旧压缩包覆盖基础版本。

- **公司验证**：`company.html` 收正式名称、注册号、MY 地区、地址和授权依据；PDF 最大 2 MB，原子分块保存、SHA-256 回读。指定审核账号核对，未核对者不能发布；合成公司只获明确标记的 sandbox，不是实际登记认证。`company.html?review=1` 是审核入口。当前政府核对为人工流程，没有免费自动登记 API。
- **结构化面试**：`candidates.html` 读取冻结要求。四类观察状态、原回答引用、时间/条件和每项分享勾选，私人记录与最小共享反馈在同一事务保存并回读。点 Sankey 技能可看实际面试证据；HR 私人条件不会发求职者。取消分享可移除旧反馈，撤回关闭 HR 访问。
- **图表**：Bullet chart 对岗位要求；完整度环图只统计可见字段；来源矩阵不虚构同行均值或测谎。两边共享匹配仍用同一 `matchCandidate`；本次新 S003 结构化申请为 80% 覆盖、94% 余弦，独立 Python 重算相符。HR 67% / 求职者 33% 是各自可见证据完整度，范围不同，不能混作匹配分。
- **身份安全入口**：`identity.html` 的护照与自拍按钮禁用，没有相机或文件采集。待提供者与服务条款明确后再接通；未启用付费。

本轮 **139 项 Node、12 套 838 项权限检查、25 项最终正式 Firebase 联调、12 项独立 Python 算术核对** 通过。手机三语数量及 24 个线上资产逐字节比对见 `docs/acceptance/hr-company-*.json`。公司网页上传、正常审核账号保存 sandbox、HR 网页面试保存及邀请都已实际执行；SDK 发布临时职位后求职者可读，撤回测试后 HR 对原申请/面试/反馈均失去访问，测试职位已关闭。多份报告检查有重叠，不相加当真人样本。

正式部署和代码提交见 `docs/acceptance/release.json` 的 `hrCompanyIntegration`。更新后的 **38 页总表第 35–38 页** 记录本次合并、方法、验收与待办。专业效度、真实盲评、真实公司身份、物理手机和无障碍仍待验收。没有采集护照/自拍，也没有打开付费项目。

## 配对测试入口与字号统一（2026-10-23）

为现有合成 HR 与 S003 求职者准备专用 `SYNTHETIC QA — Customer Operations Assistant`：公司名与提交记录一致，全文与结构化三项技能一致，地点统一为 Kuala Lumpur；不修改旧申请的冻结内容。两边读取同一份申请、80% 覆盖、94% 余弦及同一学习建议；已保存 HR 记录和明确分享的反馈。账号密码只交给用户，不进入仓库或网页。

`candidates.html?application=…` 与 `applications.html?application=…` 自动聚焦、展开同一份申请及 Sankey；可打开完整冻结 job description。账号 `next` 参数仅允许角色对应的站内页面，权限和首次流程门槛不变。

`ui-typography.css` 统一字体及字号：正文 / 输入 / 按钮 16px，标签 / 表格 14px，辅助文字 13px；标题桌面 36px、手机 28px。手机不显示空白账号侧栏。141 项 Node、11 项配对 Firebase 核对、24 组手机三语视图及 6 个部署资产逐字节比对通过。普通 SDK 核对两账号；浏览器本轮沿用 HR 登录状态，不冒称重新接受求职者条款或真机验收。详见 `docs/acceptance/paired-*.json` 与 release.json 的 `pairedTestAccounts`。


## Reviewer handoff — 2026-10-23

New `review-guide.html` links the prepared synthetic application in both roles, explains the 80% weighted coverage and 94% cosine result, and offers `project-guide.pdf` (Chinese, 14 pages). Credentials are supplied privately, never in this repository or the PDF. The build copies `docs/acceptance/FutureFit_项目与算法指南.pdf`; the local server serves the same PDF.

This addition is **deployed** to https://aligna-two.vercel.app/review-guide.html, with the PDF at `/project-guide.pdf`. Deployment `dpl_XXEm2pSED3J2iGFtr3TnSTDLZpfh` is READY and all four delivered files match local SHA-256/bytes. An initial team HTTP 403 was resolved by the existing CLI login flow; no change of team, billing or permissions was made. Status is recorded in `docs/acceptance/release.json` under `reviewerGuideDelivery`; `reviewer-guide-proof.json` distinguishes local guide checks from production route/news reads.

This run: 141 Node tests, 11 read-only Firebase checks on the existing paired accounts, 12 production HTML routes, 15 news sector endpoints, 6 local desktop/mobile language views. Empty news sectors are retained as empty; no fabricated articles. Professional validity and real independent human ratings remain pending.

Additional independent verification: 4,550 Fraction/dot-product checks across 923 occupations, four formal work-sample forms checked by dynamic programming/SQLite, and 320 numerical agreement comparisons plus 2,000 bootstrap replicates. Six responsive-language views were rechecked on production, and the existing seeker session reached the stored application and skill advice through the new portal. HR data was checked through the ordinary SDK, not a repeated browser login.
