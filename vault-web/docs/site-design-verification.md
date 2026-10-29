# 科技蓝站点与域名界面验证

日期：2026-10-28。本文记录本轮 UI／交互调整及本轮实际执行的检查，与实施计划中 S1–S4 原实现的历史验证分开。沿用现有 React／Umi／antd、大屏框架、独立密码库客户端和 Worker；未修改后端、SQL、ERP 站点管理、依赖或运行配置，未部署。

## 本轮改动

| 文件 | 调整 |
| --- | --- |
| [ItemEditor.tsx](../src/pages/vault/ItemEditor.tsx) | 标题独占一行，站点／域名相邻，账号／密码相邻，备注／标签相邻；本地名称与域名搜索、双行选项、本地图标、选中勾选、固定“其他”入口及空列表／无结果／失败提示；域名只读说明、手填聚焦与草稿保留。保留生成选项、覆盖警告、TOTP 和完整保存对象。 |
| [EntryDetail.tsx](../src/pages/vault/EntryDetail.tsx) | 站点与域名集中在卡片中；增加文字打开按钮、不可用说明及重试；复制和打开均独立检查有效域名。正常和已删除详情仍复用同一组件。 |
| [Entries.module.css](../src/pages/vault/Entries.module.css) | 740px 表单限宽、580px 容器断点、相邻的取消／保存按钮、卡片、选项、只读和失败样式；复用现有浅色／深色令牌。 |
| [index.tsx](../src/pages/vault/index.tsx) | 编辑期间返回窗口不再同步整库并关闭编辑器；保留草稿，仍执行超时检查、锁定及敏感内容隐藏。 |
| [sites.ts](../src/pages/vault/sites.ts) | 复用全量查询和完整规范域名匹配，补充窗口重新获得焦点时的刷新；搜索不请求接口。 |
| [domain.ts](../src/security/vault/domain.ts) | 在现有工具上补齐输入校验，拒绝根路径斜杠、单标签主机及数字地址；继续支持协议去除、大小写、根域点、IDN 和历史完整 HTTP／HTTPS 网址提取。 |
| 三语 [简体](../src/locales/zh-CN/entries.ts)、[繁体](../src/locales/zh-TW/entries.ts)、[英文](../src/locales/en-US/entries.ts) | 同步搜索、空态、失败、域名帮助、固定其他入口和外链文案。 |

复用既有 `services/vault/site.ts`、模块类型、`httpClient.ts`、`protocol.ts`、`VaultEngine` 和 Worker 消息流程。站点选中值只存在于 UI 内存；LOGIN 仍只在原 `website` 字符串中保存规范域名。未增加站点 ID、名称、状态、外键或持久选择标志，内容 schema 和加密盒格式继续为 1。

保存继续展开原条目，沿用 Worker 的 `preserveTotp`；没有照搬原型的简化对象。历史 `platform`、`boundEmail`、`emailItemId` 保留，但不参与站点名称推导。后台时隐藏显示中的密码、关闭导入／生成弹窗并丢弃迟到生成结果；自动锁定仍清理编辑器。

## 本轮工程检查

| 检查 | 本轮结果 |
| --- | --- |
| 密码库 `npm run test` | 19 个文件、161 项通过，含域名、协议、加密、生命周期、TOTP、二维码相关工具及三语键一致性。 |
| 根项目 `npm run test` | 4 个文件、42 项通过。 |
| 根项目与密码库 `npm run tsc` | 均通过。 |
| 根项目与密码库 `npm run build` | 均通过；密码库最终浏览器测试再次执行构建。 |
| 密码库源码、配置与脚本 Biome | 103 个文件通过；修改文件的 Biome check 和 `git diff --check` 通过。 |
| 密码库 `npx antd lint ./src --format json` | 0 问题。 |
| 根项目 antd 检查 | 12 条既有静态反馈 API usage 警告，未改无关 ERP 代码。 |
| 完整 `npm run lint` | 未通过。密码库被两份刻意损坏的本地 JSON 测试样本阻塞；根目录扫描还包含遗留 SVG 无标题等错误，共报告 54 个错误、7 条警告。未删除这些样本、修改无关代码或降低规则；类型检查已单独运行通过。 |

## 本轮浏览器验证

环境：macOS arm64，Google Chrome 156.0.8078.48，Playwright，实际生产构建、真实 Worker／Web Crypto。后端请求全部使用本地隔离 fixture；Passkey 用 CDP CTAP2 虚拟认证器生成真实 WebAuthn 断言，并由 fixture 验签。所有测试账号、条目和站点数据仅用于测试，没有进入业务代码。

本轮 58 个不同的相关用例均有通过结果：`entries.e2e.ts` 11 项、`groups.e2e.ts` 6 项、`password-actions.e2e.ts` 31 项、`site-selection.e2e.ts` 10 项。统一回归中前 48 项通过；站点英文尺寸用例遇到遍历动态 DOM 的定位超时，修正为单次 DOM 边界读取后，站点 10 项最终定向重跑全部通过。未把计划里的 159 项单元测试或 4 项浏览器历史结果计入本轮。

| 验证点 | 结果与边界 |
| --- | --- |
| 本地搜索 | 名称“百”、域名“BAIDU.COM”、名称“DESIGN”均匹配；无结果和空列表仍有其他。250 项数组保持虚拟列表、固定其他入口，搜索期间站点请求计数不增加，请求无搜索词／分页参数及 Authorization 头。 |
| 选择与手填 | 配置站点只更新域名并只读；其他保留域名且聚焦输入。搜索词不会自动写入域名。空域名允许保存，非法路径／端口／凭据／协议／查询阻止保存并保留表单。 |
| 当前名称与配置解耦 | 正常、已删除详情分别验证百度改名、`www.baidu.com` 改为 `baidu.com`、删除配置和失败重试。所有配置变更步骤零密码写入，前后完整条目／已删除密文 JSON 相同。标题及历史 platform 没有用作匹配回退。 |
| 失败与返回窗口 | 失败显示独立不可用状态；详情不会误报其他。表单返回焦点、隐藏后返回及重试保留域名、账号、密码和备注；主动选择的其他不会因新列表出现匹配项而自动切回配置站点。 |
| 历史网址与完整保存 | 历史 HTTP／HTTPS 完整网址在详情及编辑提取域名，未保存前密文不变；主动保存后才规范化。解密比对确认原账号、密码、标签、兼容字段保留，并重新导出／解析 TOTP URI 比对全部种子及参数。 |
| 外链与复制 | 在站点列表失败时实际复制有效域名，读取浏览器剪贴板确认值；点击真实 HTTPS 新标签页，检查 target、rel、精确 URL 及 `window.opener === null`。目标 HTTPS 页面由浏览器路由拦截，没有实际访问第三方服务。空／无效域名的两个操作均禁用。 |
| 既有能力 | 生成覆盖警告、取消／失败／迟到结果、逐次删除与永久删除、操作断言、未知写入回执、账号组成员及兼容字段、TOTP、二维码导入／导出／关闭／过期、标签保存等回归通过。 |
| 三语与布局 | 简体、繁体、英文各检查 320／375／736／1024／1440 CSS px 的详情、编辑、下拉，检查页面及控件边界；三语 320px 深色详情、下拉与失败状态也有截图。键盘验证下拉搜索、上下选择、Enter、Tab 到其他、Escape 和焦点返回。 |

## 实际截图

以下均是当前项目的真实渲染，使用隔离测试数据，不是设计原型。最终站点截图保存在被 Git 忽略的 `test-results/site-design/`，共 65 张。

| 状态 | 图片 |
| --- | --- |
| 新增选择站点 | [create-site-picker.png](../test-results/site-design/create-site-picker.png) |
| 新增其他手填 | [create-other-domain.png](../test-results/site-design/create-other-domain.png) |
| 编辑 | [edit-password.png](../test-results/site-design/edit-password.png) |
| 详情 | [password-detail.png](../test-results/site-design/password-detail.png) |
| 配置删除后 | [detail-site-removed.png](../test-results/site-design/detail-site-removed.png) |
| 详情加载失败 | [detail-sites-unavailable.png](../test-results/site-design/detail-sites-unavailable.png) |
| 编辑加载失败 | [edit-sites-unavailable.png](../test-results/site-design/edit-sites-unavailable.png) |
| 已删除详情 | [deleted-password-detail.png](../test-results/site-design/deleted-password-detail.png) |
| 已删除配置移除／加载失败 | [移除](../test-results/site-design/deleted-site-removed.png)、[失败](../test-results/site-design/deleted-sites-unavailable.png) |
| 320px 深色与三语 | [简体失败](../test-results/site-design/zh-CN-failure-dark-320.png)、[繁体详情](../test-results/site-design/zh-TW-detail-dark-320.png)、[英文下拉](../test-results/site-design/en-US-picker-dark-320.png) |

测试脚本、辅助 fixture、截图与报告均已用 `git check-ignore -v` 确认被忽略，未加入 Git 管理。旧账号组测试的界面标签和删除确认已适配当前逐次 Passkey 流程，未改变业务代码来迎合旧测试。

## 未验证范围

真实 Java 后端及 ERP 配置操作联调、生产部署、真实外部站点可达性、Safari／Firefox／Edge、真实手机／硬件 Passkey、读屏和完整安全验收未执行。Chrome 视口检查不能替代真机键盘、系统弹窗及辅助技术测试。本轮没有格式迁移、批量历史密文改写或旧客户端协议改造；发布时仍按最新计划同步更新密码库客户端并提示旧客户端刷新。
