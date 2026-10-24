# Future Fit 验收记录

更新日期：2026 年 10 月 23 日。

最新合并代码已同步到本仓库，线上入口为 https://aligna-two.vercel.app/ 。本目录中的 22 页 PDF 是累计验收总表，第 21 至 22 页是本轮最新记录；另有 16 页专家审题与盲评验收指南。Word 副本保留为 2026-10-22 的 20 页历史版本，本轮以 PDF 为准。

既有记录包含 132 项浏览器尺寸与语言检查；本轮现为 89 项 Node 测试和 566 项规则检查。真实 Firebase 并发覆盖三名合成用户、四个独立会话，验证重复申请、版本冲突、私人记录隔离、实时候选人更新和撤回优先。两账号的八个并行个人新闻请求也已核对。

## 阅读顺序

1. 打开 `FutureFit_交付核查与进度总表.pdf`，第 5 至 6 页看各组状态，第 9 至 11 页看本轮新增验收，第 12 至 13 页看共同匹配和面试修复，第 14 至 15 页看正式任务，第 16 至 17 页看复核与澄清，第 18 页看剩余任务，第 19 至 20 页看 H06 合并补验，第 21 至 22 页看本轮专家审题补验。
2. 查看 `release.json`，核对代码提交、正式部署、检查数量和限制。
3. 按场景打开相应 JSON。题目语言测试保留合成账号的 UI 题文及选择值；没有密码、令牌、原始真实 CV 或私人账号导出。

## 证据用途

- `responsive-language-proof.json`：132 个实际页面、语言、视口和宽度记录。
- `mobile-interaction-proof.json`：表单输入、题库、技能弹窗和两个游戏的手机交互。
- `question-language-ui-proof.json` 与 `question-language-cloud-proof.json`：同题三语、选择保留，以及新增 20 题逐项读回。
- `concurrency-live-proof.json`：同职位竞态、重复申请、实时 HR 列表及跨账号拒绝访问。
- `cloud-network-recovery-proof.json`：真实提交后的客户端确认丢失注入，重试仅读回，不重复写入。
- `concurrent-news-api-proof.json`：两个用户的八个并行请求，核对身份隔离和 no-store。
- `bookmark-account-isolation-proof.json`：本机职业收藏按账号隔离；没有将其标为云端收藏。

## 还需另外验收

实体 iPhone、Android、Safari、运营商网络切换以及更高并发规模，需要有相应设备和测试条件后继续。原创双任务已接入，专业效度、独立评分者一致性和常模仍待验证。以上没有因本次功能测试而标记为通过。

本目录不包含测试密码或后台 Secret。测试账号通过私下交接；不接受真实人物资料代替合成测试。

## 同份申请与面试补验

本轮两端正式 Firebase 读回与实际中文浏览器显示一致：冻结 v1 为 60% 覆盖 / 75% 余弦，当前 v2 为 100% 覆盖。三语建议的主题、样本、复核、资源与资格同源；HR 不读取求职者的私人学习进度。

- shared-jd-live-proof.json：两账号读回、三语同源渲染及学习建议。
- shared-jd-independent-proof.json：Python 独立算术和三项贡献。
- shared-jd-browser-proof.json：真实中文页面逐项对照。
- interview-stage-live-proof.json：接受、婉拒、原样保存、改期与网络失败；测试后恢复原状态。

另有 45 页技术和算法入门详解，从技术栈、CV、选题、匹配到新闻与复核逐步解释。公式正确与科学有效性分别说明，未把规则式选题称为训练式机器学习。


## 正式工作样本本轮补验

18 页总表的第 14 至 15 页记录本轮正式任务验收，第 16 至 17 页记录复核、更正和澄清，第 18 页记录待完成项。45 页技术说明的第 31 至 40 页包含两套 A/B 完整材料、参考解、全部评分锚点、数据库和独立算法。

- formal-work-live-proof.json：A 版两任务由实际浏览器分配、作答、提交、评分；两账号直接读回三类记录一致，旧申请 60%/75% 不变。
- formal-work-draft-live-proof.json：私人草稿已保存，刷新恢复；HR 直接读取被拒，接口隐藏草稿。
- formal-work-live-boundary-proof.json：B 版通过正式接口；未观察不记零、提交评分不可覆盖，撤回后 HR 六次读取被拒，合成职位已关闭。
- formal-work-independent-proof.json：Python 动态规划和 SQLite 与主算法比较四个变式。
- formal-work-review-independent-proof.json：独立 Python Fraction 从真实评分值重算 11/12=92% 和 10/12=83%。它不验证主观观察。
- formal-work-rules-proof.json：新增 154 项权限及原有 131 项回归检查；经明确确认发布。
- formal-work-browser-proof.json 和 formal-work-responsive-proof.json：实际网页流程，以及中文320、马来语390、英文1440宽度。输入的答案和观察保留原语言。

运行 `python tests/formal-work-independent.py` 可复核任务数值，使用环境变量 NODE_BINARY 指定 Node 24。运行 `python docs/acceptance/formal-review-independent.py` 可复核本目录实际评分算术。权限测试位于 firebase/tests，需先安装该子目录依赖，并在 127.0.0.1:8180 启动 Firestore Emulator 后执行测试；测试项目仅使用 demo-aligna-formal，不向正式项目写测试种子。

专业岗位相关性、独立人工评分者一致性、A/B 等值和常模仍待验证。追加更正、单题盲评和澄清已接入。没有监考，也没有自动作出录用决定。


## 评分复核 更正 澄清和个人设置

上轮总表 18 页，技术说明 45 页；本轮总表补至 20 页。第 41 至 45 页讲追加审计、乐观并发、原子提交、单题授权盲评、同分比例与平均绝对分差，以及私人资料和主题。旧人工评分不能覆盖；更正追加。第二账号不读取第一评分或原始 CV、问卷和游戏。

- work-followup-live-proof.json：25 项正式 API / Firestore 检查，实际网页提交澄清、更正、答复、单题同意和第二账号评分。双方完整行数据相同。原 83%、第二 75%；同分 3/4=75%，平均绝对分差0.25。
- work-followup-independent-proof.json：独立 Python Fraction 从上述真实保存数值复算；运行 python docs/acceptance/work-followup-independent.py。
- work-followup-withdrawal-proof.json：另一合成申请中改分 6/9→7/9，未观察排除；撤回后 HR 和第二账号八次读取拒绝，测试职位关闭。
- work-followup-rules-proof.json：新101项与原309项规则检查通过，明确确认后发布。正式规则 SHA-256 可与 firebase/firestore.rules 对比。
- profile-live-proof.json：真实网页上传合成头像、保存显示名、深色主题并直接读回；其他账号拒绝。浅色恢复及 Settings 退出在浏览器操作核对。

实测修复了复核邀请查询缺少 applicationId 被规则拒绝，以及语言切换后状态提示未同步。权限拒绝时复核页清空已载入的上下文，不保留旧作答作为可读结果。头像异步读取可取消，深色主题选中态加对比。

新增账户访问经过求职者逐题同意，测试后关闭；原评分和第二评分仍由本人及发布 HR 在有效申请中保留。功能验收使用三个合成账号，不能据此宣称已完成独立专业人工评分者研究。专业内容效度、A/B等值和常模仍待外部验收。


最终补测：work-followup-browser-proof.json 记录三语 320 宽度，无横向溢出；修复长更正编号溢出。面试职业自填在失焦后保留，320宽度305内容宽。work-followup-deployment-proof.json 核对15项线上资源/保护，静态资源与源码哈希相同，服务器参考解404，未登录接口401且no-store。


## H06 合并补验

收到的 aligna-main-h06-completed.zip 已逐项对照后合并；h06-package-self-report.json 是包内自述，不作为本轮云端通过依据。总表第 19 至 20 页记录本轮。66 项 Node 测试、440 项顺序执行的规则检查通过，构建 155 个资源及 vendor。

实际修复：四个原评分版本被新增元资料改变、任务 CSS 被覆盖、无效时区键、原样保存已回复邀请误报失败、改期与资料详情选错节点、过期邀请回复，以及岗位更新错误阻断冻结申请。新任务现在必须关联快照中的真实技能和工作产出；数值检查读取实际材料，资料缺少或无可行解时停止核算。显示技能名称，原 ID 可展开追溯；成功重试清除旧错误提示。

- h06-production-proof.json：16 项正式主流程检查；新职位与申请、两任务私人草稿和提交、两端 83% 评分一致；网页提交东京 14:15 的建议，双方读回 UTC 05:15。公开职位 v2 不改申请 v1 的 33% 覆盖 / 58% 余弦。
- h06-boundary-proof.json：10 项关闭职位、完成既有申请、草稿及撤回访问边界；撤回后接口为 403。另一个测试职位已关闭，私人记录保留。
- h06-rules-proof.json：八套 440 项检查的分项、规则及日志摘要；规则通过控制台发布。运行 firebase/tests 的 npm test 会按顺序执行各套，不要并发覆盖模拟器规则。
- h06-independent-numeric-proof.json：Python 动态规划及 SQLite 重算四个变式。
- h06-independent-live-proof.json：Python Fraction、点积和 datetime 从真实保存向量和时刻独立重算 33% / 58%、两份 10/12 评分和时区。运行 python docs/acceptance/h06-live-arithmetic.py。
- h06-browser-proof.json：求职者实际网页建议改期、HR 实际网页读取和原样保存；任务页三语 320 尺寸检查。历史自填答案和 HR 观察保留原语言。
- h06-deployment-proof.json：16 项最新部署资源哈希、服务器源文件 404 及未登录接口 401/no-store。

三种资料检查提示是方法说明，不是三份另外的受控测试。岗位专业效度、独立人工评分者可靠性、A/B 等值、实体设备和更大规模容量仍待外部验收，没有因此标记完成。新闻正向调整仍需要符合正文、日期及适用地区的证据。


## 2026-10-23 专家审题与独立盲评验收

入口：https://aligna-two.vercel.app/validation.html 。沿用既有正式任务与单题盲评，不另外复制 CV、问卷或游戏。负责人先冻结岗位版本、题目、变式、语言、条件、固定两位评分者和预先方案；指定专家只能阅读题目、冻结 job description、原锚点和标准答案。资历由负责人实际核对，软件不认证专家身份。

作答者分别同意两人的单题分享，还须另同意本轮研究统计。实际施测语言由负责人核对，系统未监考。独立评分声明、资历、授权或版本不符合者不计真人统计；合成测试单列。当前没有收集真实专家或真人评分样本，专业效度与真实一致性仍待验收。

统计按每个维度分别做线性加权 Kappa、同分比例、平均绝对分差及有向分差；四项完整总分做固定两位评分者的 ICC(A,1)。95% 区间按不同参与者抽样 2,000 次；少于 10 份或有效重抽样不足时留空。保留负值，不把维度当人头，不将缺失记零。默认 30 人 / 6 位专家只是计划起点，不保证精度。

本轮修复了正式云端实际发现的二维矩阵不能保存问题；快照用带 cells 的行对象保存，页面从当前来源重算并核对。旧快照不可覆盖，来源变化后标为历史；篡改汇总不能支持新的处理记录。

- FutureFit_专家审题与盲评验收指南.pdf：16 页白底黑字操作手册、专家表、双任务锚点、统计方法与真人签字表。
- validation-live-proof.json：四个现有合成账号，经正式 API 与 Firebase 服务端读回意见、两份盲评、研究同意、快照和处理记录；真人人数保持 0。
- validation-withdrawal-proof.json：撤回后新统计排除，旧快照保留并标记过期；旧快照处理与过期写入返回 409，已撤销专家入口返回 403。
- validation-rules-proof.json：126 项新增及 440 项回归，共 566 项；经明确确认发布。
- validation-independent-statistics.json：Python Fraction 列联表和协方差恒等式核对 320 项点估计；NumPy 独立核对 2,000 次重抽样及区间。

复现：Node 24 执行 node --test tests/*.test.mjs；先安装 firebase/tests 的依赖并启动本机 8180 Firestore Emulator，再运行 node firebase/tests/run-all.mjs。独立数值核对需要 Python 与 NumPy：python tests/validation-stat-crosscheck.py；可用 NODE_BINARY 指定 Node 路径。

历史手机限制（已由下面的手机补测记录更新）：此前视口工具虽接受 320px 请求，实际窗口未缩至该宽度，当时没有将手机尺寸标为通过。中文、英文、马来语切换已实际检查；实体手机、Safari、辅助技术及更大规模真人研究继续待验。

四套题目的三语说明、材料和锚点已用内容指纹固定。以后更改须发新任务版本，不能更新原 v1 指纹掩盖改题；旧定义不符时停止显示和提交。

validation-browser-proof.json 记录真实网页创建、冻结与专家表单提交，切换语言后保留输入，并读回明确 synthetic=true / independent=false。validation-responsive-proof.json 保留本轮实际尺寸与未达到手机宽度的限制。

验收指南另有免 GitHub 登录的站内下载：https://aligna-two.vercel.app/validation-guide.pdf 。validation-download-proof.json 已用未登录 HTTP 请求核对 200、PDF 类型和与本地交付文件逐字节相同。仓库未登录访问返回 404，因此不把 GitHub 原始链接作为对外唯一入口。


## 2026-10-23 手机与三语补测（当前状态）

修复手机输入字体偏小、复选框被长文字压缩，以及盲评材料显示 eventId/deliveryId 原字段名、冲突状态缺翻译等问题。盲评和专家共用材料渲染器；不传参考解时不会暴露标准答案。专家技能标签和“尚无法估计”的图表辅助说明也跟随三语。

实际 Chromium CSS 视口：320px 核心操作，390px 负责人撤回后页面；19 条语言及尺寸记录，无整页横向溢出。三语分别提交合成专家意见、同意研究、撤回研究；两位合成账号分别在手机表单提交独立评分。逐题批准/撤销两人的分享，负责人三语撤销专家访问。不是每一个操作 × 语言 × 宽度组合的穷举，也不是实体手机认证。

- validation-mobile-proof.json：实际宽度、语言、表头、输入字体及提交反馈。专家撤销点击后的页面状态读取早于异步完成，最终结果以云端 403 和直接 Firebase 拒绝读取为准。
- mobile-validation-before-proof.json：8 次 API 检查，并直接读回三份专家意见、三份研究授权、两份独立评分和三份快照。
- mobile-validation-after-proof.json：14 次 API 检查；研究撤回后新统计排除，旧快照保留并标记历史；专家及评分者读取同时被 API 与 Firebase 拒绝。
- mobile-validation-preservation-proof.json：原 HR 两题评分仍是 83%，原合成演示轮次仍有一份配对数据；未覆盖历史记录。
- FutureFit_交付核查与进度总表.pdf：更新到 24 页，最后两页为本轮交付；Word 仍为历史 20 页版。
- FutureFit_Mentor面谈_10个问题.pdf：两页白底黑字，附十个面谈问题和希望确认的决定。

本轮 91 项 Node 检查通过，修正版已发布正式网址。本轮没有修改权限规则；566 项规则检查属于上轮已发布规则的记录，不冒称此次重新跑过。真人专家与真人配对作答仍为 0，岗位专业效度、真实一致性、A/B 等值及实体设备测试仍待验收。


## 2026-10-23 求职者功能 1–3（当前补充）

第 1 项差一步推荐、第 2 项生活经历技能、第 3 项职业试穿已接入现有网站；入口、数据与边界见根 README 和总表第 25–26 页。108 项 Node、633 项规则检查通过。规则已发布并经控制台全文读回一致；最大 12 项新格式记录已在正式 Firebase 保存及撤回。

`exploration-cloud-proof.json` / `exploration-boundary-proof.json`：28 项正式数据与边界检查，含服务端读回、三模板条件重算、HR 与其他账号拒绝访问、原问卷和游戏不变。`exploration-browser-proof.json`：25 条手机、三语和操作记录，包括正式域名实际保存、冲突反馈与移除；不代表真人研究或穷举所有组合。`exploration-independent-proof.json`：Python Fraction、向量恒等式与缺口枚举独立核对 4,550 项数值；`exploration-deploy-proof.json`：正式新增资产与交付源码逐字节相同。

提取使用本机规则，不声称已实现大模型语义抽取。三种试穿是简化片段，文字理由未经人工评分。学习目录不足时明确说明，不虚构专门课程。真实专家与真实配对样本保持 0；专业效度与人工一致性继续待验收。
