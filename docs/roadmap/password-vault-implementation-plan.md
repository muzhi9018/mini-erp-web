                                # 个人密码库实施方案

创建日期：2026-10-15；更新日期：2026-10-21。状态：按用户提供的进度，除 P6 第三方账号 Passkey 存储及导入导出外，原计划功能均已实现；本次新增“已删除列表、30 天内恢复及到期自动清理”设计，尚未实现。功能完成状态与本次实际验证范围见第 3.1 节。

面向每个用户独立管理自己的密码，优先保护数据库泄露、账户被盗和 ERP 页面漏洞场景。用户记住一个独立的主密码，并持有一份账户密钥文件；服务端负责身份认证、权限、密文存储和同步。第一版采用对称加密，不引入 RSA。RSA 并不能加强被弱主密码保护的私钥；未来出现共享需求时，再评估公钥协议。

本方案附后端仓库中的 PostgreSQL 建表 SQL；本次仅更新文档中的设计、接口契约和实现状态，不修改前后端业务代码、SQL、依赖或运行配置，也不执行数据库迁移。原计划保留为现有功能的设计基线，本轮仅安排删除功能增量，不重新安排 P0–P5 建设；本次未重跑历史测试或安全验收。文档保留认证隔离、HTTP 错误契约、密码库登录 Passkey 遗失恢复及轮换与会话撤销的一致性要求；不评审或修改现有非正式 nginx 配置。文档同时记录推荐默认项、可替换项及调整条件，现有组合继续作为本轮实现基线。

## 1. 第一版范围与成功标准

第一版包括：独立登录与 Passkey MFA、备用凭据管理和一次性 MFA 恢复码、初始化、账户密钥导入、主密码解锁、账号条目增删改查、账号关联的 TOTP 动态验证码管理、本地搜索、密码生成、短暂显示与复制、自动锁定、修改主密码、恢复、完整密钥轮换、加密备份与恢复。第三方账号 Passkey 的导入、加密管理及再次导出正式列入后续 P6，优先级最低，在第一版 P0–P5 完成后实施，详见第 8.6 节。

本轮增量：删除密码后移入“已删除”，保留整条密文及关联 TOTP；删除起 30 天内允许恢复，到期自动永久清理。列表空间允许时提示剩余天数，详情始终显示准确的永久删除时间和不可恢复说明，详见第 6.3、8.7 节。底层同为密文条目的账号组沿用相同保留期，删除组仍不删除成员账号。已删除详情提供“恢复”和“永久删除”两个操作，永久删除经二次确认后立即执行，无须等待 30 天；本轮不增加清空已删除列表、批量永久删除或批量恢复功能。

第一版不包含：团队共享、管理员恢复、浏览器自动填充、附件、短信/邮箱验证码接收、HOTP、验证器批量迁移、第三方账号 Passkey 保存/记录/导入导出与代签登录、明文导出、条目历史版本、长期离线编辑、可信设备持久化账户密钥、指纹快捷解锁。其中账号 Passkey 导入、加密管理及导出已排到 P6；其他扩展功能后续按需求单独设计。

本文区分以下能力，不能共用一套“2FA/Passkey”名称和接口：

| 能力 | 服务对象与数据边界 |
| --- | --- |
| 密码库自身登录 MFA | 验证进入密码库的身份；现有 Passkey 公钥记录和 MFA 恢复码由服务端管理，见第 7 节 |
| 账号 TOTP | 为条目对应的第三方账号保管种子并在本地生成动态码；种子及参数整体加密，服务端不计算或验证动态码 |
| 第三方账号 Passkey 管理 | P6，最低优先级；通过原生配套应用从 Apple/Google 导入完整可迁移凭据，加密保管并可再次导出回 Apple/Google |

“2FA 动态验证码”在本次范围中指基于时间的 TOTP。用户仍在第三方服务完成启用、确认和撤销；在本库添加或删除记录不会改变第三方服务的认证配置。

可验证目标：

- 数据库、API 请求、服务端日志与备份不包含主密码、账户密钥、恢复密钥或明文条目。
- 仅持有服务端数据库和已知主密码，仍无法通过正常解密流程获得条目，因为还缺少账户密钥。
- 仅获得登录会话不能解锁已有密码库；所有接口仍需服务端检查条目归属。
- 错误密钥、密文篡改、条目调包、版本不支持均失败关闭，不返回部分明文。
- 通过恢复演练证明：新设备可以恢复，普通改主密码不会丢失数据，中断轮换保留旧库可用。
- 删除后立即从正常列表移除；未主动永久删除时，30 天内可恢复完整密码及 TOTP；已删除详情可直接恢复或经确认永久删除，永久删除成功及到期后均不能再恢复，到期清理任务延迟也不例外。改主密码、完整轮换或密钥恢复不得提前丢失仍在保留期内的已删除条目，也不得重置其到期时间。
- TOTP 与标准向量一致，种子不进入服务端、日志或持久缓存；旧条目仍可读取，新增凭据不会在编辑、备份或恢复中被静默丢弃。
- 账号 TOTP 与密码库登录 MFA 分离；首版不增加第三方账号 Passkey 字段、页面或备份内容。P6 的延后不影响密码库自身 Passkey 登录与恢复按首版计划实施。

## 2. 威胁边界

| 场景 | 设计措施 | 边界 |
| --- | --- | --- |
| 数据库或服务器备份泄露 | 客户端加密；账户密钥不上传 | 条目数量、长度、更新时间等元数据仍可见 |
| 登录会话被盗 | 登录与解密分离；高风险操作二次认证 | 攻击者仍可能读取密文、破坏数据；需备份与审计 |
| ERP 页面发生 XSS | 密码库独立源、独立构建和会话 | 不能保护密码库自身被注入恶意脚本的情况 |
| 用户设备或密码库前端被控制 | 减少明文驻留、发布保护、短时解锁 | 无法保证主密码或解锁后内容不被窃取 |
| 网站密码与 TOTP 种子存入同一库 | 本地加密、按需生成、最小明文驻留；说明集中保管的取舍 | 密码库解锁后失陷可能同时泄露两个因子，不能宣称与独立验证器/硬件密钥具有相同隔离性 |
| 服务端篡改、删除或回放旧数据 | AEAD、身份绑定、版本检查、备份清单 | AEAD 不阻止删除；没有独立可信检查点时，不能完全检测整库历史回滚 |
| 主密码、账户密钥遗失 | 独立恢复密钥与加密备份 | 所有可用解锁路径都遗失时不可恢复 |

独立源与 Web Worker 都不是对恶意密码库脚本的安全沙箱。若未来要求抵御前端托管服务器下发恶意代码，应另立浏览器扩展或独立客户端项目，并设计独立的可信更新渠道。

## 3. 项目接入与部署

### 3.1 当前项目能力

截至 2026-10-21，按用户提供的进度，原计划除 P6 第三方账号 Passkey 管理外均已实现，包括密码库自身 Passkey MFA、TOTP、恢复、轮换和加密备份。本轮不将这些能力重新列为待开发，也不将密码库登录 Passkey 误列为未实现的账号 Passkey 存储。

本次只读核对与删除调整有关的代码和现有说明，确认以下设计基线：

- 独立客户端位于 `vault-web/`，沿用 React、Umi Max、antd、TypeScript、Worker 和独立会话；密码库与 ERP 的认证、来源及明文驻留边界继续按本文执行。
- 后端使用 Java 25、Spring Boot、MyBatis-Plus、PostgreSQL 和 Redis；已有密文 CRUD、原子批量变更、行版本/集合版本、幂等、authEpoch/outbox、轮换、快照和后台清理。
- 首次生产发布统一采用内容版本 1，包含完整 LOGIN、TOTP 与 ACCOUNT_GROUP；数据写请求要求 `X-Vault-Item-Schema-Version: 1` 和 `X-Vault-Lifecycle-Version: 1`。开发期密文及备份不自动转换。账号组是独立密文记录，仅含名称与成员引用。具体契约以 `mini-erp-api/docs/password-vault-account-groups.md` 为基线，本轮不恢复旧版邮箱绑定设计。
- 当前删除使用 `is_deleted`、`gmt_deleted`、`delete_user`，没有已删除列表或条目恢复接口。现有 `purge-delay` 默认 24 小时，并同时用于已删除条目、旧槽和旧代清理；不能直接沿用为本轮 30 天保留策略。
- 当前轮换源集合、正常快照和空库判断排除已删除条目。本轮必须分别调整轮换及空库语义，不能仅新增一个列表页面。

后端已有 `VaultHttpContractTest`、`VaultProtocolTest`、`VaultPersistenceTest` 等密码库测试；原文“Tests run: 0、没有密码库测试源码”的阶段记录已不代表当前状态。本次仅检查文档和相关实现，未执行测试、迁移或真实设备验收，不新增测试通过或安全验收完成的结论。OIDC 等可选替代方案仍不是本轮工作。

### 3.2 推荐默认部署

现有方案采用“独立前端站点 + 现有 Java 后端 vault 模块 + 独立密码库认证链与会话”，本轮沿用该接入方式。不要求新增整套密码管理产品、Node.js BFF 或单独购买服务器；密码库前端是一个独立构建的静态站点，BFF/会话职责可以由现有 Java 应用承担。

现有同仓库独立应用 `vault-web/` 有自己的 `package.json` 和 `package-lock.json`，不自动改造为 npm workspace。复用技术栈和开发规范，不直接复制主应用配置。以下域名均为部署占位符，实施前替换为实际受控域名。

| 入口 | 部署内容 |
| --- | --- |
| ERP 原域名 | 仅增加“个人密码库”入口和三语菜单文案 |
| `https://vault.example.com` | 独立密码库前端 |
| `https://vault.example.com/vault/api/*` | 通过反向代理访问现有 Java 应用中的密码库模块，同源请求 |
| `https://vault.example.com/vault/auth/*` | 独立登录、Passkey/MFA、退出；采用 OIDC 时增加授权跳转和回调 |

ERP 入口使用独立页面跳转；新标签页必须断开 opener。URL、查询参数、片段和跨窗口消息均不传递 ERP token、主密码或任何解密密钥。默认在密码库站点使用现有账号单独登录；启用 OIDC 后通过身份提供方完成 SSO。两条路径都要求用户进入密码库后独立解锁。

密码库不导入 ERP 的 `app.tsx`、全局请求拦截器、聊天、Markdown 渲染、外部头像、统计脚本和请求录制插件。自己的依赖与构建产物独立发布；API 不能通过宽泛 CORS 再次向 ERP 源开放读取权限。

### 3.3 部署选项与隔离边界

| 部分 | 第一版默认 | 可调整方案与触发条件 | 隔离边界 |
| --- | --- | --- | --- |
| 前端仓库 | 同仓库独立应用 | 独立团队、权限或发布周期需要时拆成独立仓库 | 仓库拆分本身不提供浏览器隔离 |
| 前端站点 | 独立源、构建产物、部署配置与发布权限 | 若调整域名或托管平台，保留这些边界并重新验证 Cookie、CSP 和 Passkey 配置 | 不能退化为 ERP 同源普通路由后仍宣称隔离 ERP 脚本 |
| Java 后端 | 同一进程中的 vault 模块、独立安全链 | 需要独立发布、资源限制、故障或后端漏洞隔离时拆成独立 Java 服务 | 同进程不能隔离 JVM 被控制或共享应用凭据泄露 |
| PostgreSQL | 同一实例的 public schema，使用 vault_ 表名前缀 | 拆后端时配置专用数据库账号与授权；更高隔离或备份要求再拆实例 | schema 或表名前缀不等于权限隔离；同进程持有全部账号时仍共享风险 |
| Redis | 同一实例的密码库专用命名空间 | 需要访问控制时配置独立 ACL 用户；需要资源/故障隔离时拆实例 | 命名空间只避免键冲突，不提供安全隔离；密钥和条目明文不得进入 Redis |
| 服务器/容器 | 可共用现有基础设施，独立站点配置 | 按威胁模型增加容器、进程、主机及部署凭据隔离 | 同机或共享发布凭据仍可能同时影响两套前端 |
| 身份系统 | 现有账号 + 独立密码库会话 + Passkey MFA | 确实需要 SSO 且已有合适 IdP 时接 OIDC；无 IdP 时新增身份服务单独评估 | 登录成功与密码库解密是两条不同的授权路径 |

拆分后端时，密码库站点的同源 API 路径、稳定 ownerSubject 和密文协议应保持兼容，反向代理改指向新服务；如果同步迁移数据库，还需独立验证一致性和权限。拆部署不要求重新生成用户密钥，改变身份标识或密码学上下文则可能需要重新加密。

## 4. 技术选型、依赖与可调整项

### 4.1 加密和客户端基础

| 能力 | 第一版选择 | 实施约束 |
| --- | --- | --- |
| 界面 | React、Umi Max、antd，沿用项目主版本 | 编写 antd 代码前执行 `npx antd info <Component>` |
| 安全随机数 | `crypto.getRandomValues` | 不使用 Math.random 生成密钥、IV 或密码 |
| 数据和密钥加密 | 浏览器 Web Crypto，AES-256-GCM | 128 位认证标签；每次加密使用新的 12 字节随机 IV |
| 账号 TOTP | Worker 内使用 Web Crypto HMAC，按 RFC 6238 生成 | 仅开放第 8.5 节的参数档案；Base32、计数器编码与截断必须通过标准向量 |
| 主密码派生 | `hash-wasm` 的 Argon2id | 使用标准 `secret` 输入传入账户密钥；锁定具体版本 |
| 用途隔离 | Web Crypto，HKDF-SHA-256 | 不同用途使用不同 info；不自行实现算法 |
| 加密计算 | 同源专用 Web Worker | 明确命令类型、状态、消息尺寸和返回内容 |
| 密文状态 | React Query | 仅缓存密文；不持久化敏感查询 |
| 校验 | Biome、tsc、Vitest、浏览器集成测试 | 真浏览器验证 WASM、Worker 和 Web Crypto |

Argon2id 初始配置：版本 0x13、内存 65,536 KiB、迭代 3、并行度 4、盐 16 字节、输出 32 字节。这是 RFC 9106 的低内存推荐配置；并行度指算法 lanes，不承诺浏览器多线程。客户端只接受已登记的配置档案，v1 仅开放这个档案。实测不达标时调整发布计划或目标设备，不在运行时静默降级。[RFC 9106 参数建议](https://www.rfc-editor.org/rfc/rfc9106.html#section-4)。

`hash-wasm` 官方接口提供 Argon2 的 `secret` 参数、二进制输出、TypeScript 类型和 Worker 支持；这说明接口可用，不代表本项目或所选版本已经完成安全审计。P0 要用独立实现与测试向量验证带 secret 的结果，确认实际锁定版本、WASM 资源和 CSP 能工作。[官方接口](https://github.com/Daninet/hash-wasm#api)。

最终采用标准算法组成应用层协议，以下格式是本项目拟定的 v1 协议，不是 1Password 协议的复刻，也没有因引用标准而自动获得审计。

### 4.2 后端职责与依赖

后端接收密文和公开协议参数，不接收 MP、AK、RK、KEK、VMK、DEK 或条目明文。一次性 MFA 恢复码仅用于身份恢复，按第 7.6 节由服务端验证；它与 RK 属于不同材料，不具有解密能力。密码库条目的 Argon2id/AES 运算由浏览器完成；系统登录密码继续使用现有 PasswordEncoder 验证，两者不能混用。不需要为了条目加解密向后端新增 RSA、Argon2 或通用密码管理服务器。

| 职责 | 实施内容 | 复用框架 |
| --- | --- | --- |
| 登录与授权 | 密码库专用会话、安全链、MFA 状态、近期认证、CSRF 和精确 Origin 校验 | Spring Security |
| 密文持久化 | 第 6.1 节的密文、认证和事务控制表；密文盒/公开参数、唯一约束和归属条件 | MyBatis-Plus、PostgreSQL |
| 并发与轮换 | 预期版本检查、幂等、staging、事务提交和超时回收 | Spring 事务、数据库约束；Redis 仅作辅助临时状态 |
| 会话与认证挑战 | 会话过期/撤销、短期单次挑战、认证状态 | Spring Session、Redis |
| Passkey 凭据 | 持久化凭据 ID、公钥及所需元数据，校验 challenge、RP ID、origin、用户验证 | Spring Security WebAuthn、PostgreSQL |
| 快照与审计 | 一致性密文快照、认证与写入审计、日志脱敏和禁止正文采集 | 现有 Web MVC、存储和日志设施 |

| Maven 依赖 | 当前情况 | 第一版动作 |
| --- | --- | --- |
| `spring-boot-starter-webmvc`、`spring-boot-starter-security` | 已有 | 复用，不因密码库整体升级框架 |
| `mybatis-plus-spring-boot4-starter`、PostgreSQL JDBC | 已有，vault 分层代码及 13 表 SQL 已提供 | 补齐事务与关联约束测试，核验目标数据库迁移 |
| `spring-boot-starter-data-redis`、Jedis | 已有 | 复用连接设施，验证 Session、索引、通知和故障恢复 |
| `org.springframework.session:spring-session-data-redis` | 已有直接依赖及专用会话配置 | 复用实际依赖，不重复新增 Session starter；补齐部署验证 |
| `org.springframework.security:spring-security-webauthn` | 已有直接依赖，使用 WebAuthn4J 校验凭据 | 复用注册、验证和 MFA 流程，补齐自动化及真实设备验收 |
| `spring-boot-starter-security-oauth2-client` | 未见直接依赖 | 仅采用 OIDC/SSO 路径时新增；默认本地账号路径不需要 |

Spring 依赖优先由当前 Spring Boot BOM 管理兼容版本，不能直接照搬最新文档版本号。库支持 WebAuthn 不等于应用已经实现 MFA：还需持久化凭据、配置 RP ID/允许的 origin、要求用户验证，并将第二因子与当前用户和会话绑定。[Boot 4.0 依赖列表](https://docs.spring.io/spring-boot/4.0/reference/using/build-systems.html)、[Spring Security 7.0 Passkey 支持](https://docs.spring.io/spring-security/reference/7.0/servlet/authentication/passkeys.html)。

后端已有 Controller → Service → Mapper 分层、`JsonResult<T>` 和 Service 多表事务。路径迁移后，密码库专用安全链须优先匹配 `/vault/auth/**` 和 `/vault/api/**`，ERP 链须显式排除这些路径，并同步 Session/过滤器注册和失败审计路径。仍须补齐 ERP JWT、Session 和 Cookie 的回归测试，不能因已有配置而认定同 JVM 隔离验收通过。

第一版无需新建独立 Node.js BFF。选用现有 Java 服务时，由 Java 直接承担浏览器会话和可选 OIDC 客户端职责；拆分后端时，也可由独立 Java 服务承担这些职责。

### 4.3 前端职责与依赖

| 职责 | 采用能力 | 依赖动作 |
| --- | --- | --- |
| 初始化、登录、解锁、列表、显示/复制、恢复和备份页面 | React、Umi Max、antd、ProComponents | 沿用现有主版本，在独立应用声明实际需要的依赖 |
| Passkey 登录/MFA 交互 | 浏览器 WebAuthn API | 后端校验注册和认证结果；不能用前端“验证成功”标志替代 |
| 账号 TOTP 管理 | 本地解析 Base32/otpauth、Web Crypto HMAC、按需显示与复制 | 二维码图片仅在本地解码；P0 确定同源打包的解码库与版本，不接外部识别服务 |
| 主密码派生 | hash-wasm Argon2id，使用 secret=AK | 核心新增 npm 依赖为 `hash-wasm`，P0 锁定具体版本 |
| AES-GCM、HKDF、安全随机数 | Web Crypto API | 浏览器原生，无需另加 AES/RSA npm 库 |
| 计算、密钥状态与本地搜索 | Web Worker | 浏览器原生；校验消息并处理锁定后的迟到结果 |
| 密文传输与缓存 | 独立应用 httpClient、React Query | 复用项目约定；不能复制 ERP localStorage token 拦截器 |
| 文件解析、状态与清理 | 严格格式校验、应用内状态管理 | 不为单一模块新增通用状态管理框架；秘密不进入持久存储 |
| 检查与测试 | Biome、tsc、Vitest、真实浏览器测试 | 复用现有工具，浏览器测试工具在 P0 确定并锁定版本 |

前端完成密钥生成、文件导出和重新导入验证、派生、加解密、恢复重加密、备份认证和锁定。后端只提供相应的密文与事务接口。浏览器 Web Crypto 的原生能力与第三方 Argon2 库都需要在真实目标浏览器验证，不能以 Node 或 happy-dom 测试替代。[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)。

### 4.4 调整规则和决策记录

部署、认证集成和依赖实现可以按实际条件调整，但不能改变“用户持有解密秘密、浏览器完成加解密”的边界。P0 在下表记录最终选择、依据、具体版本和验证结果；调整已发布协议需要增加版本及兼容/迁移方案，不能当作普通环境开关。

| 决策项 | 推荐默认项 | 可调整方案/触发条件 | 调整时必须补做的验证 |
| --- | --- | --- | --- |
| 后端形态 | 现有 Java 应用新增模块 | 按发布、故障或安全隔离需求拆成独立服务 | 代理路由、会话/认证边界、最小数据库权限、稳定用户标识与迁移一致性 |
| 登录入口 | 现有账号单独登录 + Passkey MFA | 用户需要 SSO，且已有支持所需认证级别的 IdP 时改用 OIDC | 授权回调、state/nonce/PKCE、issuer/audience、MFA 级别与认证时间，不能仅验证 SSO 成功 |
| 会话存储 | Spring Session + 现有 Redis | 根据权限或资源要求配置独立 ACL 用户/Redis 实例 | Cookie、CSRF、会话撤销、命名空间、序列化和 ERP JWT 回归 |
| 数据库部署 | 现有 PostgreSQL 的 public schema，使用 vault_ 前缀、逻辑关联 | 随独立后端增加专用账号；强隔离时拆实例 | 归属校验、vault_* 表级授权、关联一致性、事务、备份及恢复；表名前缀不提供权限隔离 |
| Argon2 实现 | hash-wasm，带标准 secret 输入 | 审计、维护或兼容性要求下评估其他实现；Sodium 体系需单独验证接口与协议 | 带 AK 的独立向量、原始二进制输出、历史密文解锁；不允许丢弃 secret 输入来换库 |
| KDF 档案与容量 | 本文冻结参数和容量目标 | P0 设备/性能测试确实不达标时重新评估；发布后引入新档案和明确迁移 | 目标设备、离线猜测成本、旧档案兼容；禁止运行时静默降级 |
| AK 保管 | 当前标签页 Worker 内存，刷新后重新导入 | 后续确有长期可信设备需求时，另评估平台保护或 Passkey PRF 解锁 | 新解锁路径、设备遗失、撤销和恢复；第一版不得直接将 AK 写入 localStorage |
| 公钥加密 | 个人库 v1 不使用 RSA | 后续共享或委托授权出现时，另行选择成熟公钥协议 | 收件人身份、公钥真实性、授权与撤销；不能用“增加 RSA”代替主密码/密钥保护 |

以下项属于第一版安全约束，不作为可随意调整的技术偏好：MP/AK/RK/明文不上传；服务端无个人库解密后门；前端独立源；认证会话与本地解锁分离；密文采用认证加密并绑定用途和身份；失败处理、恢复和轮换通过验收。

## 5. 密钥、编码和加密格式

### 5.1 密钥职责

| 符号 | 含义 | 生成/保管 |
| --- | --- | --- |
| MP | 用户主密码 | 至少 16 个 Unicode 码点，最多 1,024 个 UTF-8 字节；建议随机词组；不要求机械字符组合 |
| AK | 账户密钥 | 浏览器随机 32 字节；用户保管的密钥文件；服务端从不接收 |
| KEK | 主保护密钥 | 通过 MP、AK 和公开派生参数得到；只在解锁过程中使用 |
| VMK | 密码库主密钥 | 浏览器随机 32 字节；服务端仅保存其密文 |
| DEK | 条目密钥 | 每次保存条目时重新随机生成 32 字节，不在不同条目间复用 |
| RK | 恢复密钥 | 浏览器独立随机 32 字节；单独离线保管，不上传 |

MP 与系统登录密码应不同。前端不向现有登录接口发送 MP。主密码输入按 UTF-8 编码，v1 不做 trim、大小写转换或 Unicode 归一化；创建和解锁行为必须一致，允许空格和粘贴。

新生成的密码库协议 ID（如 vaultId、itemId、slotId、rotationId）使用随机 UUID 的规范小写字符串；ownerSubject 使用现有不可变用户 ID 的规范字符串表示，不要求改造 ERP 用户主键。后端内部记录使用 bigint 逻辑 ID，沿用现有 IdWorker/ASSIGN_ID；不声明数据库物理主键或外键，保留逻辑 ID 的非空唯一约束及公开协议 ID 的唯一约束。密码学用途的随机字节独立生成。二进制字段统一用无填充 Base64url 编码。解析时严格检查版本、编码和解码后的字节长度。

### 5.2 正常解锁路径

以下为协议说明，不是业务实现代码：

```text
P = Argon2id(
  password = UTF8(MP), secret = AK,
  salt = kdfSalt[16], m = 65536 KiB, t = 3, p = 4, output = 32 bytes
)

KEK = HKDF-SHA-256(
  IKM = P, salt = wrapSalt[32],
  info = Context("normal-wrap", ownerSubject, vaultId, keyEpoch),
  output = 32 bytes
)

normalWrappedVMK = AES-256-GCM(KEK, VMK, freshIV, NormalAAD)
wrappedDEK       = AES-256-GCM(VMK, DEK, freshIV, ItemKeyAAD)
encryptedItem    = AES-256-GCM(DEK, UTF8(itemJSON), freshIV, ItemDataAAD)
```

`kdfSalt`、`wrapSalt` 均公开存储，不能拿账户密钥充当公开盐。账户密钥传入 Argon2 的标准 secret 输入。每次重建正常密钥槽都生成新盐和 IV；P、KEK 使用后尽力覆盖字节缓冲并解除引用。[Argon2 secret 输入](https://www.rfc-editor.org/rfc/rfc9106.html#section-3.1)、[HKDF 用途隔离](https://www.rfc-editor.org/rfc/rfc5869.html#section-3.2)。

### 5.3 恢复路径

```text
RKEK = HKDF-SHA-256(
  IKM = RK, salt = recoverySalt[32],
  info = Context("recovery-wrap", ownerSubject, vaultId, keyEpoch),
  output = 32 bytes
)

recoveryWrappedVMK = AES-256-GCM(RKEK, VMK, freshIV, RecoveryAAD)
```

RK 是高熵随机值，因此此处不使用面向低熵口令的 Argon2。恢复可以绕过 MP 和 AK，RK 的保管等级等同于整个密码库。短信验证码、邮箱链接或 ERP 管理员重置不能代替 RK。

### 5.4 AEAD 与上下文约定

统一加密盒结构为 `formatVersion`、`algorithm`、`iv`、`ciphertext`。v1 的算法只能是 `A256GCM`；ciphertext 保存 Web Crypto 返回的密文与末尾 16 字节标签，不额外拼接第二份标签。每次加密的 IV 都独立生成；不能把固定 ID、时间戳或数据库版本直接当 IV。[AES-GCM 参数要求](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams)。

`Context` 和各 AAD 使用固定字段顺序的 JSON 数组，经无额外空格的 JSON 序列化后转 UTF-8，禁止拼接无分隔字符串或依赖对象属性顺序。协议前缀固定为 `mini-erp-vault`，协议版本固定为整数 1。v1 不接受任意算法或任意 KDF 参数。KDF 档案编码固定为 `ARGON2ID_V19_M65536_T3_P4_L32`，对应第 4.1 节参数。

| 用途 | 数组中在前缀、版本之后的字段，按顺序排列 |
| --- | --- |
| 正常 HKDF info | `normal-wrap, ownerSubject, vaultId, keyEpoch` |
| 恢复 HKDF info | `recovery-wrap, ownerSubject, vaultId, keyEpoch` |
| NormalAAD | `normal-vmk, ownerSubject, vaultId, keyEpoch, slotId, accountKeyId, kdfProfile, kdfSalt, wrapSalt` |
| RecoveryAAD | `recovery-vmk, ownerSubject, vaultId, keyEpoch, slotId, recoveryKeyId, recoverySalt` |
| ItemKeyAAD | `item-key, ownerSubject, vaultId, itemId, contentVersion, keyEpoch` |
| ItemDataAAD | `item-data, ownerSubject, vaultId, itemId, contentVersion` |

purpose 字段均为字符串；epoch/version 为安全范围内的正整数；其他值为规范字符串。`ownerSubject` 是身份系统的稳定主体 ID，不使用可修改的用户名、邮箱或前端传入的 owner。客户端从认证后的会话建立预期身份，用预期条目 ID 重建 AAD，不能盲目采用密文携带的另一用户身份。

错误 MP、错误 AK、密文损坏都不产生明文。界面可以先报告明确的文件格式/版本错误；认证解密失败统一提示“无法解锁，请检查主密码和密钥文件，或尝试恢复”，避免把所有失败都误报为密码错误。

## 6. 明文、密文与数据库契约

LOGIN 明文保留 `title`、`website`、`username`、`password`、`notes`、`tags`、可选 `totp` 及现有兼容字段；当前生产 `itemSchemaVersion=1`，`itemType=LOGIN`。ACCOUNT_GROUP 使用同一内容版本，组名和成员 ID 整体加密，不内嵌密码或 TOTP。删除状态和期限属于服务端生命周期元数据，不写入加密明文，本轮不升级内容 schema。整体加密，不为搜索另外上传标题、域名、标签、是否启用 TOTP 或确定性搜索索引。备注按纯文本显示；网址只允许 http/https，打开外链断开 opener，不请求外部网站图标。

| 明文字段 | 首版内容契约 |
| --- | --- |
| `itemSchemaVersion` | 生产读写均为 1，区分 LOGIN / ACCOUNT_GROUP，完整保留 TOTP 及现有兼容字段；开发期缺版本及 v2/v3 内容须另行转换，不能视为生产 v1 |
| `totp` | null 或单个配置：`secretBase32`、`issuer`、`accountName`、`algorithm`、`digits`、`period`；T0 固定为 0，不保存当前动态码或倒计时 |

TOTP 首版每个账号只关联一份配置；多个第三方账号使用独立条目。首版不为第三方账号预留 Passkey 私钥存储格式；P6 在原型验证后单独冻结内容 schema、容量及迁移规则，并保持旧条目可读，旧客户端不得覆盖新凭据数据。

`itemSchemaVersion` 描述解密后的字段结构，与每次编辑递增的 `contentVersion`、服务端 `rowVersion` 和外层密文盒 `formatVersion` 不同。生产版本 1 与开发期编号不等价；本轮不自动迁移开发期条目或备份。正常编辑沿用原版本控制，不因读取批量改写。遇到未知内容版本或不支持的字段结构，客户端必须阻止该条目的编辑，以及需要解析重写它的整库轮换/恢复，不得丢弃字段后继续；密文备份仍可保留原始内容。当前通过生产内容版本 1 的完整结构校验及写入声明阻断不兼容客户端有损写入；本轮再独立声明删除生命周期协议能力，见第 6.3 节，不能仅靠内容版本号识别是否支持已删除条目轮换。

现有容量上限为每库 2,000 条正常密文记录，LOGIN 与 ACCOUNT_GROUP 共同计数；已删除记录不占正常条目名额，恢复时重新检查容量，不得挤掉其他数据。每条序列化明文最多 16 KiB，标签最多 20 个；超过限制在加密前拒绝。服务器按协议限制密文盒长度和请求体大小，不尝试解密。本轮保留这些已采用的单条及正常容量限制。

第一版数据库使用现有 `public` schema，13 张表统一采用 `vault_` 前缀；不创建独立 schema，不使用物理主键或外键。业务主表之外增加身份认证、代次、预期集合、批次、幂等回执和会话撤销队列，以落实第 7、9 节的一致性要求。具体表结构见第 6.1 节。

`rowVersion` 用于服务端并发控制，`contentVersion` 用于条目内容认证，二者不能混为一谈。正常编辑生成新 DEK，contentVersion 和 rowVersion 各加 1；服务端在事务内验证预期旧版本。任何当前代条目或活动密钥槽的写入递增 collectionRevision；活动密钥槽更改还递增 metaRevision。staging 批次不改变当前代的 collectionRevision，提交切换时再统一递增。start 在事务内检查预期版本并建立写锁，写锁同时覆盖条目和主密码修改，避免阶段内发生变化。完整轮换保持每条 contentVersion 不变，在全新 generation/keyEpoch 下重新加密，rowVersion 从 1 开始；备份恢复在目标新上下文中将 contentVersion、rowVersion 均从 1 开始。每次新建 generation 取已分配最大值加 1，取消的代次不得复用；keyEpoch 在完整轮换或向已有空库恢复时取原值加 1，新库为 1。generation 与 keyEpoch 分开维护，不能假定它们始终相等。

服务端可见 ID、条目数、密文长度、时间、密钥版本及访问事件。AES-GCM 不隐藏这些元数据，也不提供完整历史回滚检测。

### 6.1 PostgreSQL 表结构与执行边界

建表脚本位于后端仓库 `mini-erp-api/docs/sql/20261015_password_vault.sql`。目标为 PostgreSQL 14+，一次性在已有 `public` schema 创建 `vault_*` 表；`owner_id` 与现有 `public.sys_user.id` 逻辑关联。脚本不声明 PRIMARY KEY、FOREIGN KEY 或 REFERENCES，表间有效性与归属由 Service 事务校验。不使用 `IF NOT EXISTS` 隐藏已有结构差异，不自动执行脚本，不改变现有用户表。

| 表 | 职责和关键约束 |
| --- | --- |
| `public.vault_account` | `owner_id` 唯一关联现有用户；随机 WebAuthn 用户句柄；`auth_epoch`、凭据版本、恢复码批次与待确认状态 |
| `public.vault_passkey` | 全局唯一凭据 ID、COSE 公钥、签名计数、备份属性、传输提示及撤销时间；不保存私钥 |
| `public.vault_auth_recovery_code` | 一次性 MFA 恢复码 SHA-256 摘要、批次、确认/消费/撤销时间；不保存 RK 或恢复码明文 |
| `public.vault_info` | 公开 vaultId、所属认证账户、活动代指针、元数据/集合版本、EMPTY/ACTIVE/RESTORING 状态；一账户一库 |
| `public.vault_generation` | 每代 keyEpoch、STAGING/ACTIVE/RETIRED/ABORTED 状态；每库最多一个 ACTIVE 代 |
| `public.vault_key_slot` | 每代每种未逻辑删除的 NORMAL/RECOVERY 槽唯一；分别约束派生参数；VMK 密文为 48 字节、IV 为 12 字节 |
| `public.vault_item` | 库/代/条目 ID 唯一；内容版本、行版本、两个密文盒；Service 事务校验 keyEpoch 与代一致 |
| `public.vault_rotation` | ROTATION/RESTORE 任务、源/目标代、预期版本、认证代次、逻辑会话绑定、30 分钟截止及持久化提交回执；每库一个进行中任务 |
| `public.vault_rotation_expected_item` | start 时登记的逐项 ID 和版本，用于集合等价校验，不能只检查数量 |
| `public.vault_rotation_batch` | 批次 ID 与请求摘要唯一回执；同批次不同内容拒绝，与条目写入同事务提交 |
| `public.vault_idempotency_record` | 账户/操作/幂等键唯一，保存请求摘要和最小公开成功回执，与业务写入同事务提交 |
| `public.vault_session_revocation_outbox` | 认证代次更新后的 Redis 旧会话撤销任务，支持租约、退避和重试 |
| `public.vault_audit_event` | 固定动作、结果、错误码和服务端请求 ID；不保存正文或敏感输入 |

`public.vault_passkey` 仅用于密码库自身登录/MFA，不承载第三方账号凭据。账号 TOTP 封装在 `public.vault_item` 的 `encryptedItem` 中，复用现有 13 表和条目 CRUD，不新增服务端种子表或明文关联字段；本次不需要调整后端 SQL，也不向登录凭据表追加第三方私钥列。

内部逻辑 ID 使用 bigint 和 IdWorker/ASSIGN_ID，`id` 保留 NOT NULL、UNIQUE 和正数 CHECK，但不声明物理主键；逐项集合保留 `(rotation_id, item_id)` 非空唯一约束。MyBatis 的 @TableId 只标识应用使用的逻辑 ID，不要求数据库定义 PRIMARY KEY。公开协议 ID 使用 UUID，API 输出规范小写字符串。API 的 ownerSubject 由 `public.vault_account.owner_id` 转为规范十进制字符串，不能将雪花 ID 转成 JavaScript number。公开版本、generation、keyEpoch、authEpoch 均限制在 JavaScript 安全正整数范围。时间用 timestamptz，二进制用 bytea，HTTP 层严格转换 Base64url。普通改 MP 不改变 generation/keyEpoch，只替换当前 NORMAL 槽并更新版本。

`key_epoch` 由 `public.vault_generation` 表维护，meta 根据活动代取得；不在 vault 主表额外保存一个可能不同步的副本。密文盒按字段存储，数据库只校验协议版本、算法和字节长度，不能验证 GCM 标签。关联记录存在且属于当前用户、item 的 keyEpoch 与所属代一致、活动代恰好有两个未逻辑删除的有效槽、每库最多 2,000 条未逻辑删除的活动条目、活动指针与代状态一致等跨行规则，由 Service 在第 9.3 节的锁与事务内保证。唯一约束、部分唯一索引和 CHECK 继续用于防重复与字段约束，不能代替关联校验。

密码库沿用项目的逻辑删除字段。删除条目后立即从正常列表、正常搜索及新导出的用户备份中排除，转入当前库的“已删除”集合；整条密文保留 30 天，期间可恢复，到期自动清理。完整轮换的冻结源集合必须包含仍在保留期内的已删除条目。旧密钥槽和旧代沿用独立的原清理策略，不能把其 `purge-delay` 混用为已删除条目的期限，具体规则见第 6.3 节。物理清理保留必要的操作审计。清理 RETIRED/ABORTED 代的条目和密钥槽后，保留最小 generation/任务控制记录，便于查询超时提交结果；不提供历史版本解密功能。EMPTY 可作为已取消首次恢复的未初始化占位，meta 返回 initialized=false，并复用该 vaultId。删用户先按独立保留策略处理密码库；数据库不提供关联删除保护或级联清理，Service 必须显式阻止未处理的删除并维护关联记录，不能假定删父记录会自动处理子记录。

Redis 保存专用会话、短期认证挑战及限流计数，不另建 SQL Session 表。会话仅含稳定用户 ID、认证因子、时间、authEpoch 和随机逻辑会话标识，不保存 MP/AK/RK 或条目内容。`gmt_modified` 由应用审计填充，不把 DEFAULT 当作自动更新机制；表名前缀和表约束不代替权限隔离，运行账号仅授予实际需要的 vault_* 表权限。脚本仅调整新建 vault_* 表对 PUBLIC 的授权，不改变 public schema 或既有 ERP 表权限。

幂等回执仅存 ID、版本和结果，不缓存恢复码、认证令牌、登录口令或解密材料；第一版保留最小回执，不使用 Redis TTL 作为成功提交证据。重放回执前仍检查当前身份、MFA 和 authEpoch；旧回执只说明该次操作已成功，客户端仍需重新查询 meta 判断最新状态。

### 6.2 公共审计字段与逻辑删除

13 张表均保留统一的审计字段。`VaultAuditEntity` 已提供创建/更新时间、创建/更新人、逻辑删除、删除人和删除时间；操作人由密码库 Service 显式维护，不依赖现有 FieldFillHandler 自动识别独立会话。

| 字段 | 类型与默认值 | 服务端维护规则 |
| --- | --- | --- |
| `gmt_create` | timestamptz，非空，默认当前时间 | 创建时填写，后续不可由客户端修改 |
| `gmt_modified` | timestamptz，非空，默认当前时间 | 实际更新时填写，不能只依赖数据库 DEFAULT |
| `create_user` | bigint，可空 | 创建人的系统用户 ID，逻辑关联 sys_user.id |
| `update_user` | bigint，可空 | 最近更新人的系统用户 ID，逻辑关联 sys_user.id |
| `is_deleted` | boolean，非空，默认 false | 对应项目 @TableLogic，普通业务读取过滤 false |
| `delete_user` | bigint，可空 | 执行逻辑删除的系统用户 ID，不由客户端传入 |
| `gmt_deleted` | timestamptz，可空 | 逻辑删除时填写；未删除记录必须为空 |

用户发起的操作由服务端认证主体取得实际系统用户 ID，填写 create_user/update_user/delete_user；不能直接把 vault_account.id 当系统用户 ID。后台任务没有真实用户主体时允许为空，不填虚构的 0，也不从请求体接收操作人。未知账户登录失败的审计允许 create_user 为空。审计字段不包含秘密、不参与 AAD/备份认证数组，避免审计更新导致客户端密文失效。

现有 vault 实体通过 `VaultAuditEntity` 配置 @TableLogic 和创建/更新时间的 @TableField(fill=...)；`VaultAccess` 使用服务端主体显式设置可信操作人，条目删除和槽替换同时填写删除人/时间；条目恢复清空删除人/时间并另记恢复审计，历史删除事件仍保留。现有 FieldFillHandler 通过 SecurityUtils.getCurrentUser() 读取 LoginUser，不能据此假定它支持 vault 独立认证主体。自定义 Mapper SQL、Wrapper 更新与逻辑删除仍须显式维护审计字段，后续通过自动化测试验证；本次只同步文档，不修改全局填充器。

删除条目在同一事务内锁定库并校验归属、活动代、写锁和 expectedRowVersion，再设置 is_deleted=true、delete_user、gmt_deleted、update_user、gmt_modified，递增 rowVersion 与 collectionRevision，并写操作审计和幂等回执。条目明文和 contentVersion 不变。未删除行禁止带删除人/时间；已删除行必须有删除时间，系统任务允许删除人为空。重复请求通过幂等回执返回结果，不重复递增版本。删除成功后前端同步移除正常 Worker 搜索索引、列表及当前显示的秘密，并刷新已删除集合；恢复入口及事务见第 6.3 节。

正常列表、计数、搜索同步及用户备份排除已删除条目；已删除列表使用显式、受归属限制的 Mapper 查询，绕过默认 @TableLogic 过滤，且仅返回未到期数据。完整轮换的预期集合包含正常记录和未到期的已删除记录。用于备份恢复的“空库”须同时没有正常记录和可恢复的已删除记录，防止换代覆盖仍可恢复的数据；已过期残留不计作非空，由独立到期清理流程处理，不纳入恢复集合。关联校验同时检查相关父记录未删除。物理清理由独立受控 Mapper 路径执行，按库锁、期限和代状态复核，不能误删有效条目或未到期的已删除条目。

主密码修改需要在同一代插入新 NORMAL 槽，因此 `(vault_id,generation,slot_type)` 改用 `WHERE is_deleted=false` 的部分唯一索引：先标记旧槽删除、填写删除人/时间，再插入新槽，一起提交，失败则全部回滚。旧槽在物理清理前仍存在于数据库，不能把逻辑删除标记视为撤销旧解锁材料；疑似泄露仍需完整轮换。不能把 is_deleted 直接追加到普通唯一约束，否则多次替换后会因多条已删除槽冲突。slotId、itemId、账户 ownerId、库/代、批次和幂等键的身份约束继续保留；已删除记录不能用于绕过凭据撤销、单次消费或重放历史操作。

统一字段不意味着统一开放删除 API。Passkey 删除须先撤销并使旧会话失效，恢复码删除须先消费或撤销；STAGING/ACTIVE 代、UPLOADING 轮换和未完成 outbox 任务禁止仅靠软删除隐藏。审计表只追加，幂等/批次回执及最小代记录按保留策略维护，不通过普通业务接口删除；安全及回执校验需显式包含必要的历史记录，不能因默认逻辑删除过滤而把旧幂等键当作未使用。

### 6.3 已删除条目的 30 天生命周期（本轮新增，待实现）

本节替代原“不提供回收站/恢复已删条目”的约定，仅调整 `vault_item` 的删除生命周期；不将登录 Passkey、密钥槽、身份恢复码等统一审计表的软删除开放为可恢复数据。

| 阶段 | 服务端判定 | 允许操作 |
| --- | --- | --- |
| 正常 | `is_deleted=false`，删除字段为空 | 现有查看、编辑、删除等操作 |
| 已删除，可恢复 | `is_deleted=true` 且 `serverNow < purgeAt` | 在已删除列表查看，详情可恢复或确认永久删除；从正常搜索、分组有效成员及用户备份排除 |
| 已到期，待清理 | `is_deleted=true` 且 `serverNow >= purgeAt` | 列表不再返回，详情和恢复拒绝；由后台任务或此前已发起的永久删除请求清理 |
| 已永久清理 | 密文行已物理删除 | 无法通过已删除列表恢复；仅保留最小操作审计/回执 |

**期限与字段。** 复用 `gmt_deleted`，API 映射为 `deletedAt`；`purgeAt = deletedAt + 720 小时`，即固定 30×24 小时，不按自然日零点或客户端时区起算，也不按 `gmt_modified` 起算。不新增回收站表或重复的到期字段。删除事务取得锁后读取一次数据库实时时间，再写入删除时间；恢复、详情及清理也在取得所需锁后读取当前数据库时间，不能使用等待锁前的事务开始时间放行已到期数据。时间统一输出带时区的 ISO 8601，页面转换为用户本地时间并显示时区。

**删除与恢复。** 单条删除和 `/items/batch` 的 DELETE 均进入同一保留流程。删除成功回执补齐 `itemId`、`deleted=true`、删除后的 `rowVersion`、最终 `collectionRevision`、`deletedAt`、`purgeAt`、`serverTime`，批量逐项回执使用相同语义。相同幂等键重试返回原结果，不能刷新删除时间；不同键对已删除条目再次删除返回 409 `VAULT_ITEM_ALREADY_DELETED`，不延长保留期。

恢复通过 POST `/items/restore`，请求仅含 `itemId`、`generation`、`expectedRowVersion`、`idempotencyKey`，不接收客户端的密文、期限、归属或操作人。Service 在事务内按账户→库→条目的既有顺序锁定，检查完整 MFA/authEpoch、归属、活动代、轮换写锁、已删除状态、当前行版本、未到期以及正常条目容量。恢复使用显式 Mapper SQL 读取及条件更新已删除行，同时约束库、代、ID、删除状态和预期行版本，不依赖默认 @TableLogic 过滤的 updateById。成功后设置 `is_deleted=false`，清空 `gmt_deleted/delete_user`，维护更新审计字段，`rowVersion+1`、`collectionRevision+1`，写 `ITEM_RESTORE` 审计及 `RESTORE_ITEM` 幂等回执；保留 itemId、contentVersion、两个密文盒、原始创建信息及完整 TOTP。恢复不重新加密、不生成副本、不修改 authEpoch，也不额外要求近期 Passkey；与正常条目写入使用相同的完整会话、CSRF、Origin 保护。再次删除已恢复条目时，从这次新的删除时间重新保留 30 天。

恢复失败不得部分更新：仍属于本人的已删除行在到期但尚未清理时返回 409 `VAULT_ITEM_EXPIRED`，已恢复行返回 409 `VAULT_ITEM_NOT_DELETED`，容量不足返回 409 `VAULT_ITEM_LIMIT_REACHED`；行版本/代次不符复用版本冲突，轮换中返回 423。已清理、不存在和错误归属统一为 404，不为判断这些状态泄露其他用户数据。相同幂等键的成功重放先返回历史回执，客户端随后重新同步，不将回执当成当前仍可恢复的证明；两设备恢复、恢复与清理竞争只能有一个持锁结果。未来实现时在 `VaultEnum` 集中补充错误、操作和审计枚举，并同步三语提示及数据库 CHECK 白名单。

**手动永久删除。** 已删除详情提供 POST `/items/purge`，请求与恢复一样仅含 `itemId`、`generation`、`expectedRowVersion`、`idempotencyKey`。该操作不等待保留期结束，使用完整 MFA 会话、authEpoch、CSRF、Origin 和与普通条目写入一致的认证要求；不额外增加重新登录或近期 Passkey 步骤。Service 按统一顺序持锁复核归属、活动代、轮换写锁、行版本及当前仍为已删除状态，随后在同一事务物理删除当前已删除行，以及同一库、同一 itemId 在 RETIRED/ABORTED 代的残留密文副本，递增一次 collectionRevision，写 `ITEM_PURGE` 审计及 `PURGE_ITEM` 幂等回执，保留必要的最小任务/代控制记录。不删除其他条目、成员密码或密钥槽，不接受将正常记录直接永久删除的请求。到期但尚未清理的删除行也可由已发起的请求完成清理，不得因此允许恢复。成功回执含 `itemId`、`permanentlyDeleted=true`、`collectionRevision`、`purgedAt` 和 `serverTime`，不返回密文或虚构新的行版本；成功后立即从已删除列表移除，并清空该条目的 Worker 索引、详情和已显示秘密。

永久删除与恢复、自动清理或另一设备的永久删除串行竞争：恢复先成功时，永久删除必须以版本冲突或 `VAULT_ITEM_NOT_DELETED` 拒绝，不能误删恢复后的正常记录；永久删除先成功时，后续恢复返回 404。相同幂等键重试返回原成功回执，不重复审计；不同键遇到已清理记录返回统一 404，客户端重新同步，不盲目更换目标或重发破坏性操作。网络或审计失败时整个事务回滚，前端不能提前显示永久删除成功。手动永久删除只通过详情的明确确认触发，不将列表点击、关闭详情、恢复失败或倒计时到期自动转成该请求。

**查询与同步。** 新增 GET `/items/deleted`，沿用 cursor/pageSize（默认 100，1–100），按 `deletedAt` 倒序、itemId 稳定排序，返回本用户活动代未到期的密文及 `rowVersion/contentVersion/keyEpoch/deletedAt/purgeAt`；分页外层含 `generation`、`collectionRevision`、`serverTime`、`nextCursor`。GET `/items/deleted/detail?itemId=...` 使用同一可见性规则，返回对应记录和服务端时间，打开详情或返回前台时重新确认，不能只相信旧页面缓存。正常 `/items` 保持原有过滤。两类游标区分查询范围，绑定用户、库、代次和集合版本；已删除游标还固定首屏时间及当时集合最早到期边界，跨越该边界即返回 409 `VAULT_VERSION_CONFLICT` 并重载，避免尚未物理清理时因自然到期拼出半份集合。恢复、手动永久删除或自动清理成功后刷新两类列表、计数及 Worker 索引。

**自动清理。** 复用现有每分钟清理任务，条目使用固定的 30 天阈值；`purge-delay` 继续只控制旧槽/旧代，不将全部清理统一改成 30 天。任务分批查找候选，按统一锁顺序逐库短事务处理，在锁内再次核对 `is_deleted`、原删除时间和到期条件后物理删除两个密文盒所在行；恢复先提交则不得删除。多实例可跳过已锁候选并幂等重试；每库实际删除后递增一次 collectionRevision，记录不含密文的清理审计，保留最小回执。自动清理当前代和仍残留的历史代删除行均须受期限检查，不能因轮换提前清理当前可恢复副本；只有用户主动确认的手动永久删除可以提前结束该条目的保留期。

到期后立即不可恢复，不依赖任务准时运行。正常运行时目标为到期后的下一轮每分钟任务自动清理；任务故障或积压时重试并监测最老过期记录及清理失败，不把逻辑到期宣称为磁盘已即时擦除。进行中的轮换最多 30 分钟内临时冻结源行以保证清单一致，仍禁止到期查看/恢复，任务提交、取消或过期后立即处理已到期数据，详见第 9.1 节。服务端备份、用户已下载的备份及其他设备已取得的副本按原保留策略处理，不承诺远程撤销；“无法恢复”指当前密码库已删除列表的恢复能力。

**容量、账号组与升级。** 正常记录仍最多 2,000 条，已删除记录不因正常容量满而提前清除；恢复容量不足时保留原删除时间并提示先释放正常容量。已删除查询独立分页；轮换必须允许正常记录加保留期记录超过 2,000 条，调整现有整库数量校验和 Worker 处理上限，按页/批处理，不能截断或阻止必要的密钥轮换。

账号组与密码均在服务端视为不透明的 `vault_item`，采用相同保留期；列表在本地解密后标注“密码”或“账号组”，计数含义明确。删除密码继续沿用现有组引用解除流程，不改写其他密码；恢复密码默认回到“全部密码”，不自动重建已经解除的组关系，界面提示可手动重新加入。删除组只移走组本身，手动永久删除组也不删除成员账号；恢复组保留其密文成员引用，仅将当前正常账号显示为可用成员，缺失或已删除成员提示不可用，不连带恢复、不创建副本。

首次生产上线采用独立生命周期协议版本 1：`/meta` 声明 `lifecycleProtocolVersion=1`、`clientLifecycleVersionHeader=X-Vault-Lifecycle-Version`、`deletedItemRetentionDays=30`。全部数据 POST 在生产内容版本头 1 之外，要求唯一的 `X-Vault-Lifecycle-Version: 1`；缺失、重复或不支持时返回 409 `VAULT_CLIENT_UPGRADE_REQUIRED`，防止不兼容客户端发起会遗漏已删除条目的轮换。认证和普通 GET 不增加该要求；新增查询及内部保留集合下载由已支持本协议的客户端使用。该请求头不加入历史请求摘要，不修改现有幂等请求的字段顺序或摘要规则。

发布时先暂停旧条目清理任务并停止新建轮换，允许既有任务提交或取消；排空任务后短暂阻断数据写入，部署兼容服务与客户端，再开启新策略和写入。仍在库中且删除未满 30 天的历史删除行沿用原删除时间进入已删除列表；已满 30 天的直接列入清理，不重新赠送保留期。已被旧任务清除的密文或旧代已清除密钥导致不可解密的历史条目无法补回，不承诺历史完整恢复；迁移核对可用密钥与密文后再开放入口。数据库变更仅围绕必要的枚举 CHECK 和删除时间查询索引编写独立增量迁移，本次不写 SQL、不修改已执行的建表脚本。回退版本必须支持该生命周期，不允许恢复旧清理器提前删除未到期数据。

## 7. 身份认证、会话和 API

### 7.1 独立密码库会话

密码库已实现独立后端会话和默认的本地账号 + Passkey MFA 路径；OIDC 是尚未实现的可选方案。P0 确认沿用当前路径或另行建设 OIDC，不能根据客户端请求任意切换认证策略。

默认路径是现有账号单独登录：密码库站点提交系统账号和系统登录密码，后端复用 AuthenticationManager/现有用户验证逻辑，不调用原登录接口获取 JWT 再返回给浏览器。密码验证后只建立受限的待 MFA 状态，允许执行绑定当前用户和会话的认证步骤，不能读取密码库数据；完成 Passkey 验证且新恢复码保管确认完成后才授予密码库数据权限。首次绑定和身份恢复期间只允许受限引导操作，详见第 7.6 节。每次认证状态提升需更新会话 ID，持久化 SecurityContext，并明确检查所需因子，不能仅依赖 authenticated() 放行第一因子会话。

可选路径是 OIDC SSO：Java/BFF 发起授权码流程，验证 state、nonce、issuer、audience 和 PKCE，并核验身份提供方的认证级别和认证时间。若需要调用上游 API，访问/刷新令牌仅保存在服务端。没有符合要求的 IdP 时继续使用默认路径，不要求为密码库先部署新的授权服务器，也不把前端已有 OAuth 调用当成可用 SSO。启用此路径需要单独配置客户端、重定向地址、退出与近期 MFA 策略。

两条路径都只给浏览器 `__Host-vault_session` Cookie，设置 Secure、HttpOnly、Path=/、SameSite=Lax，不设置 Domain。默认路径不需要生成上游 OAuth token。现有 ERP JWT 仍用于 ERP 自身，不能拿密码库会话替换整个应用的原认证机制。

所有密码库 API 同源。写请求要求精确 Origin 校验及会话绑定的 CSRF token；不能仅依赖 SameSite，因为 ERP 和 vault 子域可能属于同一 site。禁止跨域通配放行。不要把主应用 token 搬入 Cookie，也不要通过 URL 传 token。[Cookie 前缀规则](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)。

进入密码库要求 MFA。初始化、修改密钥槽、恢复提交、轮换和备份下载要求 5 分钟内完成的二次认证，认证状态由服务端记录，不接受前端布尔值。会话默认 15 分钟空闲超时、8 小时绝对超时；401 时清理客户端解锁状态。OIDC 路径无法提供所需认证保证时不能仅以 SSO 成功放行，也不能回退复用 ERP localStorage token。

Passkey 的 challenge 短期、单次有效并绑定用户、用途和会话，校验实际 origin/RP ID，要求用户验证；凭据持久化到数据库。首次绑定只允许在已验证系统登录密码、尚未初始化密码库且没有有效 Passkey 的受控引导流程完成；已有密码库后新增或替换凭据需要近期 MFA，或第 7.6 节明确限制的身份恢复会话。Passkey 遗失的身份恢复与密码库 RK 恢复分离，后端不能接收 RK 代替身份验证。Passkey 在第一版用于登录/MFA，不使用 PRF 自动解封 VMK，因此不等于已实现指纹快捷解锁密码库。

本地解锁不调用“验证主密码”接口。服务端不保存可由 MP 单独计算的解锁校验值，否则会形成绕过账户密钥保护的猜测入口。

### 7.2 认证端点

以下本地账号端点已由 `VaultAuthController` 提供；OIDC 的 GET 登录和回调仅为后续契约，当前未实现。未启用的策略不暴露对应登录入口。

| 方法/路径 | 适用路径 | 作用 |
| --- | --- | --- |
| GET `/vault/auth/options` | 两者 | 返回部署启用的登录方式并建立最小预认证会话及 CSRF token；不授予数据权限 |
| POST `/vault/auth/login` | 默认本地账号 | 校验系统账号/登录密码，建立待 MFA 状态；不接收 MP，不返回 JWT 或密码库内容 |
| POST `/vault/auth/passkeys/register/options` | 默认本地账号 | 受控首次绑定或近期 MFA 授权后生成一次注册挑战 |
| POST `/vault/auth/passkeys/register/verify` | 默认本地账号 | 校验并保存注册凭据，严格执行用户、用途和会话绑定 |
| POST `/vault/auth/passkeys/authenticate/options` | 默认本地账号 | 为当前待 MFA 或二次认证会话创建一次认证挑战 |
| POST `/vault/auth/passkeys/authenticate/verify` | 默认本地账号 | 验证断言，提升为完整会话或更新近期认证时间；首次绑定完成后也需按该流程验证 |
| GET `/vault/auth/login` | 可选 OIDC | 创建服务端 state/PKCE 并跳转身份提供方 |
| GET `/vault/auth/callback` | 可选 OIDC | 校验授权回调及 MFA 保证并建立独立会话 |
| GET `/vault/auth/reauth` | 默认本地账号已实现 | 返回当前会话状态及 Passkey 认证 options 地址，客户端继续 options/verify；OIDC 跳转流程待另行实现 |
| GET `/vault/auth/passkeys` | 默认本地账号 | 完整 MFA 会话查看自己的凭据名称、状态及最近使用时间，不返回公钥正文 |
| POST `/vault/auth/passkeys/revoke` | 默认本地账号 | 近期 MFA；预期凭据版本；拒绝撤销最后一个有效凭据，引导走身份恢复 |
| POST `/vault/auth/recovery-codes/issue` | 默认本地账号 | 首次 Passkey 验证、近期 MFA 或受控恢复后的新 Passkey 验证；生成待确认批次，明文只返回一次 |
| POST `/vault/auth/recovery-codes/confirm` | 默认本地账号 | 本地导出并重新导入校验后确认 batchId，原子激活整批并撤销旧批次；服务端不能证明用户已可靠离线保存 |
| POST `/vault/auth/mfa-recovery/verify` | 默认本地账号 | 5 分钟内完成系统密码验证的待 MFA 会话提交一枚 MFA 恢复码；原子消费并建立 10 分钟受限重绑状态 |
| POST `/vault/auth/logout` | 两者 | CSRF 校验后注销密码库会话 |

包括登录、注册、认证在内的所有 POST 都受 CSRF 和精确 Origin 校验约束。预认证/待 MFA 状态仅允许必要认证端点，不能访问 `/vault/api/*` 数据接口。注册凭据本身不能被误当成第二因子认证已经完成。MFA 恢复码验证失败统一返回 HTTP 403 `VAULT_MFA_RECOVERY_INVALID`；客户端保留尚未过期的待 MFA 状态，不能据此取得数据权限。

### 7.3 数据端点

以下路径统一加前缀 `/vault/api`。业务调用统一使用各应用的 `src/services/httpClient.ts`，由 doGet/doPost 封装；新增文件接口类型放模块 `typings.d.ts` 的 `Vault` 命名空间。

| 方法/路径 | 请求/返回要点 |
| --- | --- |
| GET `/session` | 返回 ownerSubject、认证阶段、MFA/近期认证状态、凭据版本及 CSRF token；不返回解密秘密 |
| GET `/meta` | 返回初始化/库状态、generation、keyEpoch、metaRevision、collectionRevision、密钥槽及允许的格式/算法/KDF/内容版本；本轮新增生命周期版本、请求头名及 30 天保留声明，见第 6.3 节 |
| POST `/initialize` | vaultId、两个密钥槽、idempotencyKey；事务创建唯一密码库，拒绝覆盖已有库 |
| GET `/items` | cursor、pageSize；返回当前 generation 的密文条目、rowVersion 和 collectionRevision；pageSize 默认 100，范围 1–100 |
| POST `/items/create` | itemId、generation、keyEpoch、contentVersion=1、密文盒、idempotencyKey |
| POST `/items/update` | itemId、expectedRowVersion、generation、keyEpoch、新 contentVersion、两个密文盒、idempotencyKey |
| POST `/items/delete` | itemId、expectedRowVersion、generation、idempotencyKey；移入已删除并返回 deletedAt/purgeAt 等回执，保留 30 天；仅影响当前用户库 |
| POST `/items/batch` | 复用现有原子 CREATE/UPDATE/DELETE，DELETE 与单条删除使用同一保留策略；本轮不新增 RESTORE 批量动作 |
| GET `/items/deleted` | 新增；仅当前用户活动代未到期的已删除密文，含期限、服务端时间和独立分页游标 |
| GET `/items/deleted/detail` | 新增；itemId；返回未到期记录及准确期限，过期/不存在按第 6.3 节处理 |
| POST `/items/restore` | 新增；itemId、generation、expectedRowVersion、idempotencyKey；原位恢复同一记录，容量、期限和版本均在事务内检查 |
| POST `/items/purge` | 新增；请求字段同恢复，仅处理当前已删除记录；不等待 30 天，确认后永久删除并返回最小幂等回执；与恢复、自动清理竞争规则见第 6.3 节 |
| POST `/key-slots/change-master` | expectedMetaRevision、新正常槽、idempotencyKey；保持 AK、VMK 与恢复槽不变，原子递增 authEpoch |
| POST `/rotations/start` | rotationId、expectedMetaRevision、expectedCollectionRevision、新密钥槽、idempotencyKey；建立固定预期集合与新 generation，暂停本库写入 |
| GET `/rotations/status` | rotationId；返回该用户任务状态、截止时间、预期集合、已收批次、新代密钥槽与提交结果，用于超时后确认 |
| POST `/rotations/resume` | rotationId、预期版本、idempotencyKey；新完整会话经近期认证后显式接管未过期任务，事务替换 sessionBindingId，不改变暂存数据或期限 |
| POST `/rotations/batch` | rotationId、batchId、加密后的新代条目；上限 1 MiB，重试必须幂等 |
| GET `/rotations/items` | rotationId、cursor、pageSize；默认 scope=STAGING 返回暂存密文；本轮增加 scope=SOURCE，仅 ROTATION 模式按冻结预期集合分页下载源密文及删除状态/期限，要求任务归属、authEpoch 与会话绑定匹配；两种游标不可混用，pageSize 默认 100，范围 1–100 |
| POST `/rotations/commit` | rotationId、expectedCollectionRevision、verifiedManifestDigest、idempotencyKey；5 分钟内 Passkey 认证，原子切代并递增 authEpoch，见第 9.3 节 |
| POST `/rotations/cancel` | rotationId、idempotencyKey；当前要求 5 分钟内 Passkey 认证，丢弃未提交的新代并恢复旧库写入 |
| GET `/backup-snapshot` | 近期二次认证；在一致性快照中返回全部正常密文用于用户备份，排除已删除；轮换保留集合改从 start 后的 SOURCE 下载，不改变此接口及备份文件范围 |
| POST `/restores/start` | 近期二次认证；目标不得有正常记录或仍可恢复的已删除记录；rotationId、新库/槽、经客户端验证的待恢复条目集合、预期元数据/集合版本、idempotencyKey；建立 restore 模式 staging |

备份恢复的批次上传、查询、下载验证、提交和取消复用 rotations 端点，通过服务端任务 mode 区分；不把客户端传入的 mode 当授权依据。restore 提交校验 start 时登记的完整目标集合，rotation 提交则校验已锁定旧代的完整集合。空账户恢复期间状态为 RESTORING，初始化和其他写入被拒绝；提交前不暴露半成品，取消后恢复原空库或未初始化状态。

恢复后重设密钥也使用 rotations 流程，由客户端在本地用 RK 解密并重新加密。服务端不接收 RK，不提供“输入恢复码让服务端解密”的接口。

账号 TOTP 的新增、替换、删除随整个条目通过 `/items/create`、`/items/update` 提交，使用同样的预期版本、写锁和幂等规则。没有接收 otpauth URI、种子、当前动态码或第三方账号明文的独立 HTTP 端点；动态码生成是已解锁 Worker 的本地命令。`/vault/auth/passkeys/*` 只管理密码库自身登录凭据，不能用来为第三方站点注册或撤销 Passkey。

统一约束：

- owner 从认证会话取得；所有查询沿 `public.vault_account.owner_id` 关联并限制归属，不能依赖菜单权限，也不能给管理员增加跨用户密文接口作为默认行为。
- 错误归属返回与不存在相同的真实 HTTP 404；并发冲突 409；轮换写锁 423；会话过期 401；二次认证不足 403。保留 JsonResult 结构，错误码与 HTTP 状态契约见第 7.5 节。
- POST 写入使用 CSRF、请求尺寸限制、字段白名单、版本检查和幂等键。相同幂等键但内容不同必须拒绝。
- 普通列表分页的 cursor 绑定用户、库、generation 和 collectionRevision；后续页发生代次或集合变化时返回 409，由客户端重新同步，避免拼接不同快照。已删除列表额外绑定查询范围及到期边界，见第 6.3 节。快照和 staging 下载各自绑定固定代次。
- 初始化、正常改主密码、轮换提交分别有事务边界，不能先删除旧槽再写新槽。
- 数据接口返回 Cache-Control: no-store。网关、WAF、APM、应用日志、错误追踪和请求录制均排除请求/响应体，错误中不回显提交内容。
- “查看了密码”的本地审计只是客户端上报，不宣称服务端能完整记录所有离线解密；后端审计以认证、下载和写入等实际事件为准。

### 7.4 Spring Security 与会话隔离实施要求

现有后端已用 `VaultSecurityConfig` 和 `SecurityConfig` 分离密码库会话链与 ERP JWT 链；`JwtAuthenticationFilter` 已通过 `FilterRegistrationBean#setEnabled(false)` 禁止 Servlet 容器全局注册，仅由 ERP 链执行。下面列出已有实现需持续满足的隔离约束；仍须补齐混合 Cookie/Bearer、模块关闭及 ERP 回归测试。[Spring 官方过滤器注册说明](https://docs.spring.io/spring-security/reference/7.0/servlet/architecture.html#adding-custom-filter)。

| 顺序/范围 | 必须具备的行为 |
| --- | --- |
| 高优先级 vault 链 | securityMatcher 精确覆盖 `/vault/auth/**`、`/vault/api/**`；只接受专用服务端会话；显式 SecurityContextRepository；保留 CSRF；精确 Origin 检查；JSON 认证失败/拒绝处理，不跳转 HTML 登录页 |
| ERP JWT 链 | 明确排除 vault 范围，继续 STATELESS；不从 Session 加载身份；只在这条链装配 JWT 过滤器 |
| vault 未启用或配置缺失 | 保留覆盖上述路径的拒绝链，不能落回 ERP JWT 链；缺少 RP ID/origin 等关键配置时失败关闭 |
| Redis Session 接入 | 专用 Cookie、Redis namespace、序列化和会话索引；SessionRepositoryFilter 的 Servlet 注册只覆盖 vault 路径，避免为 ERP 请求建立/读取密码库 Session |

不能用 ERP JWT 换取 vault 会话，也不能让带 ERP JWT 的请求写入 vault SecurityContext。同一请求带 Cookie 与 Bearer 时 vault 忽略 Bearer，只以有效 vault 会话授权；回归测试必须覆盖有效与失效的 ERP Bearer。

登录提升、MFA 提升和近期认证时更新实际 Session ID、保存新 SecurityContext，并更新 CSRF token，响应返回新 token，客户端在后续 POST 使用。服务端另外生成 `sessionBindingId`，只放服务端会话/任务，不通过 URL 或客户端自报；在同一次登录内的 Session ID 更新中保持不变，退出或重新登录则生成新值，轮换不会因正常二次认证而失去归属。需要继续未过期任务时，新的完整 MFA 会话可用近期认证、任务 ID、预期版本向 `/rotations/resume` 显式重新绑定；原绑定随事务替换，旧会话随后不能上传或提交。

所有已知用户的 vault 请求检查 sys_user 仍启用、未逻辑删除，且 vault_account/vault_info（已初始化时）未逻辑删除，以及会话 authEpoch 与 `public.vault_account.auth_epoch` 相同；数据库异常时拒绝授权，不能沿用缓存的旧判断。写操作在业务事务内再次加锁检查，避免过滤器校验后恰好发生撤销的竞态。Spring Session 的空闲 TTL 不等于 8 小时绝对超时，两者都要显式实施。待 MFA/恢复会话不以普通 authenticated() 获得数据权限，因子与 recoveryRequired 均由服务端判断。

### 7.5 HTTP 状态与 JsonResult 错误契约

ERP 原接口保留 HTTP 200 携带 JsonResult.code 的历史行为。vault 已由 `VaultErrorWriter`、`VaultEnum.Error` 及安全链失败处理统一映射真实 HTTP 状态；现有全局 ControllerAdvice 根据 `VaultPaths` 分流到该处理器，过滤器/CSRF/认证入口也使用同一 JSON 格式。业务异常通过枚举对应的 i18n key 映射，不能把所有业务错误归为 500；完整错误契约仍需自动化验证。

保持 `JsonResult<T>` 的 `code`、`success`、`message`、`data`。错误响应 `code` 等于真实 HTTP 状态，`success=false`，`data` 固定含稳定的 `errorCode` 和服务端生成的 `requestId`；不在机器码中拼接参数。message 国际化，不供前端分支判断；新增 key 维护后端 vault 模块的英文、简体、繁体资源并加入 MessageSource。

| HTTP | errorCode 示例 | 含义/客户端动作 |
| --- | --- | --- |
| 400 | `VAULT_INVALID_REQUEST` | 字段、协议格式或编码不合法，解密前拒绝 |
| 401 | `VAULT_SESSION_EXPIRED`、`VAULT_SESSION_REVOKED` | 会话过期/认证代次失效；立即清理本地解锁内容并重新登录 |
| 403 | `VAULT_MFA_REQUIRED`、`VAULT_REAUTH_REQUIRED`、`VAULT_RECOVERY_SETUP_REQUIRED` | 补齐 MFA、近期认证或恢复码保管步骤；不因近期认证不足而丢弃未提交的轮换材料 |
| 403 | `VAULT_CSRF_REJECTED`、`VAULT_ORIGIN_REJECTED` | 拒绝伪造请求，不回显请求正文 |
| 404 | `VAULT_NOT_FOUND` | 不存在与不属于当前用户统一响应 |
| 405 | `VAULT_METHOD_NOT_ALLOWED` | 不支持的 HTTP 方法 |
| 409 | `VAULT_VERSION_CONFLICT`、`VAULT_IDEMPOTENCY_CONFLICT`、`VAULT_ROTATION_EXPIRED`、`VAULT_CLIENT_UPGRADE_REQUIRED` | 重新同步/查询结果或升级客户端；不能盲目覆盖或自动重做提交 |
| 409 | `VAULT_ITEM_EXPIRED`、`VAULT_ITEM_ALREADY_DELETED`、`VAULT_ITEM_NOT_DELETED`、`VAULT_ITEM_LIMIT_REACHED` | 本轮新增：分别提示到期无法恢复、已删除、已恢复/未删除、正常容量不足；刷新状态，不自动重新删除或延长期限 |
| 413 | `VAULT_PAYLOAD_TOO_LARGE` | 请求体、条目或文件超过协议限制 |
| 415 | `VAULT_UNSUPPORTED_MEDIA_TYPE` | 不支持的请求内容类型 |
| 423 | `VAULT_WRITE_LOCKED` | 正在轮换/恢复，读旧代、暂停编辑 |
| 429 | `VAULT_RATE_LIMITED` | 登录、恢复码或挑战验证限流；返回 Retry-After |
| 503 | `VAULT_UNAVAILABLE` | 数据库或会话设施不可用，失败关闭 |
| 500 | `VAULT_INTERNAL_ERROR` | 未知服务错误；只返回固定文案和请求 ID |

示例：`HTTP 409`，JSON 为 `{"code":409,"success":false,"message":"数据已更新，请重新同步","data":{"errorCode":"VAULT_VERSION_CONFLICT","requestId":"服务端UUID"}}`。客户端根据 HTTP 与 errorCode 处理，不能将所有 403 当退出、将所有 409 当写入失败。所有这些响应仍设置 no-store；参数绑定错误、畸形 JSON、未匹配路由和未支持方法也不能回显敏感输入。

### 7.6 Passkey 遗失与一次性 MFA 恢复码

默认本地账号路径提供两套明确区分的恢复材料：RK 由浏览器生成、服务端从不接收，用于解密 VMK；一次性 MFA 恢复码用于恢复身份认证，只能换取受限的 Passkey 重绑流程，不能解密或绕过本地主密码/账户密钥。选择 OIDC 时必须另行冻结 IdP 的因子恢复政策，不自动把本地恢复码接到 OIDC 旁路。

建议用户注册一枚备用 Passkey。首次主 Passkey 注册并完成一次认证后，服务端用 CSPRNG 生成 8 枚相互独立的 32 字节 MFA 恢复码，以无填充 Base64url 输出，附账户、batchId 和格式版本；明文仅在该次响应中出现。数据库只保存解码后原始 32 字节的 SHA-256 摘要，按批次管理；校验前严格检查 Base64url 编码和字节长度，不接受截断、补空格或模糊匹配。高熵随机恢复码不复用低熵口令，也不由 MP、AK 或 RK 派生。生成响应、恢复输入及相关页面禁止日志、录制和分析采集。

前端要求导出独立的“MFA 恢复码文件”并重新导入比对后确认 batchId；不与 AK/RK 文件混装。确认整批生效时原子撤销旧批次并清除 recoveryRequired；未确认批次永远不能用于恢复。签发或确认必须满足当前服务端引导状态、近期 Passkey 认证与凭据版本；待确认批次最多一个，未确认超过 10 分钟作废，不能因为响应丢失而破坏旧有效批次。首次确认完成前不能初始化或读取密码库。文件保管验证和 AK/RK 一样是客户端流程，服务端无法证明用户的长期离线保管质量。[OWASP MFA 恢复建议](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html#resetting-mfa)。

丢失唯一 Passkey 时按下列顺序恢复：

1. 先验证系统登录密码，形成最多 5 分钟的待 MFA 状态；再提交一枚 MFA 恢复码。不能仅持有登录会话或 RK 请求重绑。
2. 事务锁定 account，检查当前批次、确认状态、未消费/未撤销；以条件更新原子消费一次。递增 authEpoch 和 credentialRevision，撤销现有 Passkey，标记 recoveryRequired=true，同事务写撤销 outbox 和审计。
3. 该请求提交成功后只创建 10 分钟绝对过期的 RECOVERY_ENROLLMENT 会话，绑定新 authEpoch；不能读取 meta、密文、备份或调用轮换/密钥槽接口，也不接受此状态作为近期 MFA。其他未消费的旧批次码暂时仍可用于中断后重进重绑，恢复码重放被拒绝。
4. 在受限状态注册新 Passkey，并额外完成一次该凭据的认证。认证成功后仅开放恢复码换批引导；生成、离线验证并确认新批次后才允许数据接口，同时撤销旧批次。完成恢复再递增 authEpoch 并写 outbox，建立新完整会话，旧恢复会话立即失效。
5. 用户随后仍须以 MP+AK 或 RK 在浏览器解锁；身份恢复不更改密文、主密码或解密密钥，不声称已完成密钥轮换。

恢复码生成、校验和凭据更改按账户与来源双重限流；恢复码失败统一返回 `VAULT_MFA_RECOVERY_INVALID`，不区分已消费/已撤销/不存在；命中限流返回 429，不能允许攻击者永久锁定账户。挑战最长 2 分钟，校验尝试时原子取出并删除，绑定 owner、purpose、sessionBindingId 和 authEpoch；RP ID、origin、UV 由验证库检查。会话 ID、恢复码和挑战都不能作为日志字段。

当前已实现上述一次性 MFA 恢复码和受限 Passkey 重绑流程，本轮沿用其认证边界；不提供管理员“清空 vault MFA 后仅凭系统密码重绑”的后门。如果所有 Passkey 和有效 MFA 恢复码均遗失，旧库在线访问不可恢复；管理员重置系统登录密码不会重置 vault MFA。用户仍可使用独立加密备份及 MP+AK 或 RK，在本地验证后向另一个完成 MFA 的空账户重新加密恢复。只有 RK、没有备份且无法通过 MFA 时，不能读取服务端密文恢复。界面需在初始化前说明这些条件。

## 8. 用户流程与状态管理

### 8.1 初始化

1. 完成登录和近期 MFA，确认密码库尚未创建。
2. 两次输入 MP；浏览器生成 AK、RK、VMK、随机盐及标识。
3. 导出账户密钥文件和独立恢复文件，要求用户从导出的文件重新导入验证。两个文件不写入密码条目，不上传服务器；建议分开离线备份，MP 不写进文件。
4. 本地构建两个 VMK 密钥槽，试解密确认与原 VMK 一致。
5. 使用幂等键一次性提交初始化；收到确认后进入已解锁状态。
6. 超时不盲目重新生成密钥：先查询 meta，确认提交结果，再选择继续或安全重试。

账户密钥文件含格式版本、vaultId、ownerSubject、accountKeyId、AK；恢复文件含版本、vaultId、ownerSubject、recoveryKeyId、RK。文件用严格 JSON schema 解析、最大 8 KiB，不执行内容。文件本身是秘密，checksum 只能用于输错检测，不能代替加密或身份认证。导出成功的浏览器事件不等于用户已可靠备份，因此必须做重新导入验证。

### 8.2 解锁、列表、显示与复制

1. 当前页面会话首次解锁先导入 AK 文件，检查库与账户标识，再输入 MP。
2. Worker 派生 KEK，认证解密 VMK。VMK 不返回 React 主线程；尽可能以不可导出的 CryptoKey 使用。原始字节仅在确实需要包装或派生的短暂流程内使用。
3. 拉取密文列表；Worker 解密生成标题/用户名/网址/标签的内存搜索索引，可返回是否配置 TOTP 供本地筛选，不把密码或 TOTP 种子作为列表数据传入 React。
4. 点击查看或复制时才返回单条秘密；显示 20 秒后遮挡。密码生成在本地用安全随机数完成，避免取模偏差。
5. 剪贴板只在用户明确点击时写入。默认不自动读取或覆盖剪贴板；说明复制内容可能被系统剪贴板历史保留，不承诺自动清除即可消除副本。

### 8.3 锁定规则

| 事件 | 固定行为 |
| --- | --- |
| 5 分钟无用户操作 | 锁定并清理 VMK、DEK、TOTP 种子/HMAC 密钥/动态码、解密索引、明文字段和进行中的表单 |
| 页面转入后台 | 立即遮挡密码与动态码、停止 TOTP 刷新；后台达到 60 秒锁定 |
| 手动锁定 | 立即执行相同清理 |
| 刷新、关闭页面、退出密码库、401、切换用户 | 终止 Worker，清理 AK 和所有解锁内容 |
| 普通锁定后同标签页再次进入 | 可仅输入 MP；AK 保留在该标签页 Worker 的私有内存中 |

第一版不在 localStorage、sessionStorage、IndexedDB、Service Worker、React Query 持久缓存或全局 initialState 中保存 AK、MP、KEK、VMK、DEK、RK 或明文条目。AK 只在当前标签页存活；刷新后需重新导入。该使用成本换取不引入浏览器长期秘密存储。

Worker 和主线程维护会话代次。锁定时取消可取消的任务并递增代次，丢弃旧代异步结果；不可抢占的 WASM 计算结束后也不得发布旧代明文，随后清理缓冲。普通锁定可以保留 AK，但必须清理其他解锁内容，退出则终止 Worker。重获焦点、pageshow 和每次敏感操作前检查超时，不能依赖后台定时器准时执行。BroadcastChannel 仅广播锁定/退出事件，不广播秘密；新标签页独立导入和解锁。

JavaScript 字符串和垃圾回收无法保证物理内存立即擦除；清理是尽力覆盖缓冲、解除引用和限制存活时间。Web Worker 改善响应和秘密生命周期管理，但不能抵御同源恶意脚本主动调用其命令。

TOTP 定时刷新、倒计时和 Worker 返回消息不算用户操作，不延长自动锁定时间。导入的 otpauth 文本、二维码图像和编辑中的种子也受上述清理规则约束；图像对象 URL 用后撤销，原始文件不进入附件上传或缓存。

### 8.4 修改主密码与恢复

正常修改 MP：要求旧 MP 重新解锁和近期 MFA；生成新盐/新槽，用新 MP 与现有 AK 保护同一 VMK。先验证新槽可解密，再以 expectedMetaRevision 原子替换。记录更改事件并让其他会话失效；当前会话成功后也重新锁定。旧 MP 对已外流的旧密钥槽或历史备份仍然有效，不能宣称修改 MP 撤销了历史副本。若攻击者据此得到仍在使用的 VMK，还可能解密以后取得的当前数据；怀疑旧解锁材料泄露时，应完整轮换。

恢复：先登录并完成 MFA；Passkey 遗失时先按第 7.6 节恢复身份，再导入 RK 文件，从恢复槽得到 VMK；随后创建新 MP、AK、RK、VMK 并执行完整轮换。新文件必须导出和重新导入验证后才能提交。恢复文件遗失但 MP+AK 仍可用时，也通过该轮换流程生成新的恢复材料。

若既不能正常解锁，也没有可用恢复材料，界面说明无法恢复旧数据。管理员可以协助恢复登录身份，不能恢复解密秘密；不会用空库覆盖旧库作为隐式“修复”。

### 8.5 账号 TOTP 动态验证码管理

1. 在账号编辑/详情页增加“动态验证码”区域。支持手动输入 Base32 种子、粘贴 `otpauth://totp/...` URI、选择本地二维码图片；首版不申请摄像头权限。图片解码在浏览器本地完成，限制文件大小、解码尺寸和耗时，P0 冻结上限，不上传图片或调用远程识别服务。
2. 导入结果显示发行方、账号、算法、位数和周期，种子默认遮挡；用户检查并在第三方服务完成验证码确认后保存。手动配置默认 SHA1、6 位、30 秒；URI 缺省按格式约定补齐。首版允许 SHA1/SHA256/SHA512、6/8 位、30/60 秒、T0=0，种子严格 Base32 解码后限制为 16–128 字节。这些是产品兼容范围，超出时明确拒绝，不静默改参数。
3. 解析器只接受 TOTP 类型，按规则规范化种子并拒绝非法编码、空种子、重复关键参数、发行方冲突及不支持的参数；不把 URI 当链接打开。原始 URI 包含秘密，规范化后只保留字段，不写 URL、历史、日志或错误正文。[otpauth 格式说明](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)。
4. 已保存种子只在 Worker 内解密并导入 HMAC 密钥。按 `T=floor(UnixSeconds/period)` 编码为 8 字节大端计数器，按 RFC 6238 生成并补足前导零；标准向量覆盖三种 HMAC 和 2038 年后的时间。[RFC 6238](https://www.rfc-editor.org/rfc/rfc6238.html)。
5. 用户点击显示后，主线程仅接收该条目的当前动态码和有效起止时间，显示倒计时，最多显示 20 秒后遮挡。复制时重新请求当前窗口的码；跨窗口边界的迟到结果丢弃并重新生成。窗口结束立即废弃旧码；刷新始终按当前时间重算，不能简单依赖定时器逐秒减一。只为当前展开条目计算，不能在列表每秒生成整库动态码。
6. 休眠恢复、时钟跳变和回到前台时重新检查本地解锁/超时状态，再生成当前窗口的码；不把服务端时间作为秘密验证接口。持续失败时提示检查设备自动校时和参数，不能声称本库已验证第三方接受验证码。TOTP 可被钓鱼转用，不具有 Passkey 的来源绑定能力。
7. 替换种子或删除 TOTP 配置需明确确认并走整条目的并发保存；提示先在第三方账号验证新配置或关闭旧配置。操作冲突时重新同步并让用户选择，不能自动覆盖其他设备的密码或 TOTP 字段。

普通列表、详情及显示／复制动态码不返回种子，不默认展示种子或 URI。用户主动选择「添加到其他验证器」时，允许受控导出标准 otpauth://totp/ 配置二维码，完整保留原种子、算法、位数和周期，全部在本地用同源打包的二维码组件编码，不调用远程服务。编码后 URI 上限为 2000 个 ASCII 字符；过长时明确拒绝，避免二维码组件渲染失败，不截断种子或参数。每次导出重新执行真实 Passkey 认证，并读取服务端 MFA／近期认证结果；当前会话仅返回近期认证布尔值而无到期时刻，因此不复用可能即将到期的旧认证。已解锁 Worker 同时检查条目 ID、所属账号、当前解锁代次和短效认证检查时间；关闭或后台时中止尚未完成的认证，迟到结果不得展示。二维码最多显示 60 秒，关闭、失焦、后台、切换条目、退出和锁定立即移除画布及临时 URI。Worker 依赖可信宿主传入的实际 HTTPS 会话检查结果，这不是抗同源恶意脚本的签名授权凭据，也不能宣称可抵挡已解锁设备上的 XSS。可选短码核对仅比较本地当前窗口，不证明网站已启用、设备身份或安全交接。扫码获得的是相同配置副本，不实时同步，也不撤销旧设备；撤销须在原网站更换或关闭 2FA。编辑中的新配置、更换和移除只写入草稿，随整个条目按原内容版本、预期行版本及幂等键保存；取消保留旧配置。将密码和 TOTP 放入同一库的集中保管风险在启用时说明，允许用户继续使用独立验证器。密码库自身的 MFA 因子和离线身份恢复材料应在库外保留，避免必须先解锁才能取得登录凭据的循环依赖。

### 8.6 账号 Passkey 管理（P6，最低优先级）

账号 Passkey 管理已正式列入计划，优先级放到最后：先完成 P0–P5 的密码库、TOTP、恢复、轮换、备份和首版发布，再启动 P6。目标是从 Apple“密码”或 Google 密码管理工具导入完整可迁移的 Passkey，在本项目中关联账号、加密管理和备份，并可再次导出给 Apple 或 Google；仅记录名称、RP ID 或保管位置不满足交付要求。

基于当前公开接口，普通网页无法提供“生成通用静态二维码，Apple 扫码即导入已有 Passkey”的能力。WebAuthn 的普通站点接口不暴露认证器私钥；自行编码私钥也不会使 Apple“密码”获得识别和导入该二维码的能力。[WebAuthn 私钥边界](https://www.w3.org/TR/webauthn-3/#sctn-public-key-credential-source)。

P6 新增本项目的原生配套应用，接入系统凭据交换。Apple 为参与交换的凭据管理应用提供 `ASCredentialImportManager` 与 `ASCredentialExportManager`，Chrome 的移动端也支持从其他应用导入及向其他应用导出 Passkey。[Apple 导入接口](https://developer.apple.com/documentation/AuthenticationServices/ASCredentialImportManager)、[Apple 导出接口](https://developer.apple.com/documentation/AuthenticationServices/ASCredentialExportManager)、[Google 移动端迁移说明](https://support.google.com/chrome/answer/13068232?co=GENIE.Platform%3DiOS&hl=en)。

配套应用首先面向 iPhone，优先验证一台 iOS 26+ 设备上的配套应用、Apple“密码”及 Chrome，暂不要求同时建设 Android 客户端。配套应用需正确配置凭据提供方扩展、系统能力及分发签名，接入系统选择与用户授权；仅将网页打包为 App 或增加文件上传按钮不具备这些能力。移动端开发、分发和维护属于 P6 工作量，单独估算，不计入首版，也不阻塞首版发布。

1. **导入：** Apple“密码”或 Chrome 经系统授权将支持迁移的完整 Passkey 凭据交给配套应用。保留私钥、credentialId、RP ID、userHandle、算法及兼容所需的扩展数据；只保存公钥或名称不满足再次导出的要求。
2. **保管：** 配套应用在受信客户端中按与密码库兼容的协议加密后上传，服务端继续只接收密文。网页可在解锁后查看账号关联、名称及来源等信息；私钥不用于普通详情显示，也不开放复制。原生端的 AK/RK 导入、Argon2 secret、密钥生命周期、身份会话和跨端协议一致性需单独设计验证，不能直接复制 ERP token 认证。
3. **导出：** 配套应用重新认证并解锁，从本库取得密文，在本地解密后调用系统导出接口，由用户选择 Apple“密码”或 Chrome 接收。导入、存储和导出需保持凭据身份、私钥及必要扩展数据一致；不能随账号编辑更改 RP ID、userHandle 或重新生成密钥后称为同一份 Passkey。
4. **门槛：** 用虚构账号验证 Apple → 本项目 → Apple、Apple → 本项目 → Google、Google → 本项目 → Google、Google → 本项目 → Apple 四条路径，并实际登录原网站。覆盖取消、重复导入、冲突、异常、锁定、备份恢复及未知算法/扩展；不兼容时拒绝有损迁移。只能迁移源提供方允许导出的凭据，不承诺导出设备绑定的硬件密钥。

P6 提供用户触发的导入导出，不提供 Apple、Google 和本库之间的自动双向同步。交付范围为加密保管、账号关联、备份及再次导出；直接在第三方网站创建/使用本库 Passkey 的认证器、签名和自动填充能力另行评估。进入 P6 后先完成真实设备往返原型，再冻结内容 schema、备份、跨端认证及密钥边界并估算后续工作量；不能沿用首版“仅浏览器持钥”的全部假设。原型不满足四条迁移路径时记录阻塞原因，不降格为记录管理并宣称交付完成。

### 8.7 已删除列表、详情与恢复（本轮新增，待实现）

1. 正常密码详情/编辑页的删除入口沿用现有确认交互，将不可逆警告改为：“删除后将移入‘已删除’，可在 30 天内恢复；到期后自动永久删除。”删除组的确认同时说明成员密码仍保留；不将本次调整用于“仅移除 TOTP”或“从组中移出成员”。成功提示“已移入已删除”，从正常列表及当前详情移除，提供前往已删除列表的入口。
2. 桌面导航增加“已删除”，小屏放入现有导航选择器；与全部密码、账号组同级，沿用列表/详情布局。入口计数按未到期记录计算，密码/组类型在列表区分；仅登录并解锁后解密展示，已删除搜索只在本集合内本地执行，不混入正常搜索和安全统计。默认按删除时间从近到远，空状态为“暂无已删除的密码或账号组”。
3. 列表保留标题、用户名等现有摘要；有空间时使用次级小字显示“{n} 天后永久删除”。以服务端 `purgeAt` 与校准后的当前时间之差计算：剩余至少 24 小时时向上取整天数，不足 24 小时显示“不足 1 天后永久删除”；不显示“0 天后”或负数。小屏允许省略这行，不能挤掉标题或恢复操作；详情中的期限提示始终保留。小字保持可读对比度，不只靠颜色传达即将到期。
4. 打开已删除详情先重新确认服务端状态，在标题下方固定展示提示：“此密码将于 {本地日期、时间和时区} 永久删除，之后无法恢复。”另显示删除时间；账号组用对应名称。提示为常驻文本，不能只放在 tooltip 或恢复确认弹窗中。未到期详情只读，按现有规则短时查看/复制已保存字段；修改、TOTP 替换/移除及二维码导出须先恢复，不在已删除状态保存新内容。期限提示不因字段折叠消失。
5. 详情直接提供主要操作“恢复”和危险操作“永久删除”，桌面与小屏均可见，不要求返回列表操作。恢复点击后阻止重复提交，成功提示“已恢复”，从已删除列表移除并刷新正常列表；不因成功自动显示密码。密码回到全部密码，说明原分组需手动重新加入；账号组按第 6.3 节恢复。容量不足时保留详情并明确提示先释放正常容量，同时继续显示原到期时间。永久删除点击后弹出确认，标题“永久删除此密码？”，正文“此密码将立即永久删除，无法恢复。是否继续？”，操作为“取消”和危险按钮“永久删除”；账号组使用对应名称并提示成员密码保留。取消不请求接口、不改变期限；确认后立即执行，成功提示“已永久删除，无法恢复”，关闭详情、移除记录并刷新计数。任一操作提交期间同时禁用恢复与永久删除，防止本页面并发触发；网络超时保留完全相同的幂等请求，先确认结果再重试，遇到多设备冲突重新同步，不创建副本。
6. 页面停留跨越到期时刻，立即关闭已显示的秘密、清理该条目本地明文并关闭操作确认、禁用恢复与永久删除；提示“此密码已过保留期，无法恢复”，随后刷新列表。服务器可能已清理，404 时显示“该条目已不存在或已永久删除”并退出详情。页面回到前台、休眠恢复或执行查看/复制/恢复/永久删除前重新校时及检查，不只依赖定时器；最终资格由服务端锁内判断，客户端倒计时不构成恢复授权。
7. `serverTime` 用于估算时钟偏差，运行中以单调经过时间更新剩余时长，后台返回后重新请求；不要求每秒刷新整份已删除列表。用户会话失效、退出、锁定及切换账号沿用第 8.3 节清理，同时清空正常和已删除的明文索引、详情和迟到请求结果。恢复/删除的跨设备状态在重新同步时收敛，不新增实时推送设施。
8. 删除确认、已删除入口、类型/计数、剩余天数、准确期限、恢复/永久删除结果、永久删除确认、到期和容量错误同步维护简体、繁体、英文，并覆盖日期、时区、天数复数及移动端展示；不得把“30 天”直接拼入只维护单一语言的组件文案。

## 9. 完整轮换与加密备份

### 9.1 完整轮换

适用于恢复、账户密钥丢失/疑似泄露或用户主动更换全部密钥。正常改 MP 不需要走此流程。

1. 已解锁客户端先完成一次仅含正常记录的可验证加密备份和近期 MFA，取得预期 meta/collection 版本。用户备份与轮换所需的保留集合不能混用。
2. 生成新 AK、RK、VMK，导出并验证新文件；调用 start 锁定本库写入并建立 staging generation，按锁后数据库时间冻结正常记录和当时未到期已删除记录的 ID/版本。随后通过 `/rotations/items?scope=SOURCE` 分页下载完整冻结源集合，含密文、删除状态及期限；SOURCE 游标绑定任务、源代和查询范围，按固定预期 ID 集合读取，不受期间自然到期而少项。其他设备继续读旧代，但不能编辑。
3. 客户端逐条用旧密钥解密全部冻结记录（含 LOGIN、ACCOUNT_GROUP 和可恢复的已删除记录），使用全新 DEK、IV 和新 VMK 重新加密，按批上传新代。不能只重包旧 DEK 后称为“完整轮换”。服务端从冻结源行复制删除状态、原删除人/时间，派生的 purgeAt 不变；不得信任客户端提交的删除元数据，也不能将已删除条目写成正常条目。
4. 服务端校验预期条目集合完整、无重复/额外条目、每个条目的版本与阶段协议一致。客户端下载新代进行完整解密验证，确认内容与原快照一致。
5. commit 在一个数据库事务中切换 activeGeneration、keyEpoch、两个密钥槽和版本，随后撤销其他密码库会话。提交响应超时后查询 meta/轮换状态确认，不重复替换新材料。
6. 客户端清理旧秘密并锁定，要求用新文件重新解锁。新代中未到期的已删除记录仍可解密及恢复；确认完整迁移后旧代按原策略清理，不延长已删除条目期限。数据库备份按既定保留周期过期。

rotationId 是随机不可猜标识，但不能代替归属、完整 MFA、authEpoch 和逻辑会话绑定。当前 start、resume、commit 与 cancel 都要求 5 分钟内的 Passkey 认证；批次和下载验证要求完整会话，近期认证超时不清空 staging。取消也可能返回 403 `VAULT_REAUTH_REQUIRED`，客户端完成近期认证后重试。start 后最长 30 分钟，取消或超时丢弃 staging 密文并将目标代标为 ABORTED，另按原期限清理源代已到期删除行，保留最小任务回执；普通轮换的旧代始终有效，恢复则回到原空库或 EMPTY 占位。服务端回收任务也须具备幂等性。同一库只允许一个轮换任务，批次重试不能覆盖不同内容。

轮换期间禁止删除和恢复条目，普通改主密码也沿用原写锁。任务源行在最多 30 分钟的任务期内保持冻结；期间到期的已删除条目立即从普通已删除查询排除且不能恢复，但可作为固定任务集合的一部分完成内部上传和验证。commit 先验证完整冻结清单与摘要，再于同一切代事务移除目标代已到期记录，仅激活正常记录及仍未到期的已删除记录；同时清理源代对应到期删除行。取消/超时清理 staging 后也立即清理源代已到期删除行。不得通过从冻结清单中途删项绕过缺项检查，也不能因此阻止或无限期延长轮换。SOURCE 始终在 start 成功后下载，以实际冻结集合为准，不从 start 前的已删除列表或用户备份拼装源集合；任务状态须支持 SOURCE 下载、上传和验证阶段在原期限内继续。

轮换不能让攻击者忘掉已得到的密码或 TOTP 种子。若疑似泄露实际网站凭据，应在对应网站修改密码、重新绑定 TOTP；历史快照和备份也不会因在线轮换被远程撤销，删除本库条目不能替代这些操作。

### 9.2 备份与恢复验证

用户导出的备份为全部正常记录的完整密文包，包含所有公开派生参数、当前两个 VMK 槽、正常密码和账号组密文及版本，不包含已删除条目；导出前明确提示这一范围。轮换 SOURCE 下载仅供任务内部使用，不导出为用户备份，原备份 v1 格式及认证清单算法不变。希望单独备份某条已删除密码时须先恢复。AK、RK、MP 不包含在备份包中，用户仍需至少一条有效解锁路径。

条目中的 TOTP 种子、参数和账号关联随密文包一同备份；轮换、恢复和内容比对必须保留完整字段。恢复相同 TOTP 种子及参数后，可在正确设备时间生成同样的动态码，不必重新绑定第三方服务；若种子已在第三方撤销，旧备份不能使其重新生效。首版备份不保存第三方账号 Passkey，P6 再扩展完整凭据的加密备份、恢复与再次导出验证；密码库自身登录 Passkey、MFA 恢复码和会话不随条目备份迁移。

为检测备份中的缺项、重复和调包，v1 增加认证清单：客户端列出按 itemId 排序的条目 ID、contentVersion、keyEpoch 和规范条目数组的 SHA-256 摘要；清单包含 backupId、ownerSubject、vaultId、generation、条目数和公开密钥槽的摘要。每个条目规范数组固定为 ID、内容版本、密钥代次、两个密文盒的版本/算法/IV/密文字符串，不能依赖对象排序。

使用 VMK 经 HKDF-SHA-256 派生独立的 backup-auth 密钥：公开随机 32 字节 backupSalt，info 使用前缀、版本、backup-auth、ownerSubject、vaultId、backupId 的固定数组；对规范清单字节计算 HMAC-SHA-256。客户端在导出前及恢复前验证该认证清单和每条 AEAD。服务端不持有清单认证密钥。

认证清单用于检测已导出包的后续篡改，不能证明服务器在快照生成之前没有隐瞒或删除记录；这属于威胁边界中已说明的完整性与回滚限制。

第一版备份恢复只允许目标账户尚未初始化，或密码库同时没有正常记录和可恢复的已删除记录，不合并或覆盖已有非空库；仅剩已删除记录也应阻止空库恢复，避免清除其解密密钥。已过期残留不计入非空条件，由独立到期清理流程处理。先用源库 MP+AK 或 RK 在本地解锁备份并验证清单和全部条目；再生成目标库的新 AK、RK、VMK 和上下文，导出并验证新文件，经 restores/start 和 staging 批次将全部条目重新加密写入目标。源、目标身份不同时也必须重新绑定 AAD，不能直接改密文包 owner 或 ID。提交后使用新材料重新解锁验证，才显示恢复成功。第一版同时提供不写服务端的“备份验证”流程，便于定期演练。

### 9.3 数据库提交、认证代次与 Redis 撤销

PostgreSQL 是活动代与认证代次的唯一事实来源。`keyEpoch` 用于密码学上下文，`authEpoch` 用于撤销会话，二者不能互相替代。所有已登录请求先比较服务端认证代次；需要一致性的写操作在事务内再次校验。普通修改 MP、轮换/恢复提交、凭据撤销和身份恢复都在事务内递增 authEpoch，新增 outbox 任务；ERP 系统密码重置、禁用和删除已通过 `SysUserServiceImpl` 接入同一撤销机制，当前只要存在密码库账户记录就阻止系统用户删除，包括已逻辑删除的账户；本轮条目保留策略不改变该保护，也不作为用户注销/整库销毁方案，不能将会话撤销视为数据删除完成。MFA 恢复成功是唯一允许建立新 authEpoch 完整会话的受控恢复交接，必须重新生成 Session ID；普通改 MP 和轮换提交一律清理当前会话。

所有相关 Service 使用统一加锁顺序：`public.vault_account` → `public.vault_info` → `public.vault_rotation` → `public.vault_generation`/条目/密钥槽；不存在的账户使用 owner_id 唯一约束处理并发创建。需要串行化权限撤销的读操作在一致性快照事务中对 account 取 FOR SHARE，写操作取 FOR UPDATE。先完成授权再读取密文；已经在撤销前开始并取得快照的下载允许完成，撤销不能收回已下发数据。数据库/Redis 不可用时失败关闭，不在读取失败后回退到旧缓存或 ERP JWT。

start 持锁检查预期 meta/collection 版本和空库条件。ROTATION 将正常记录与当时未到期已删除记录的逐项 ID/版本、认证代次及会话绑定写入任务，源删除状态和时间从冻结源行取得；沿用现有预期集合表，不仅按正常条目计数。RESTORE 则登记备份中的正常目标记录，并确认目标库没有可恢复的已删除记录。唯一部分索引保证一个库只有一个 UPLOADING 任务。后续任何条目写入或改 MP 均持相同 vault 锁并检查任务，不能只在 Controller 查询“是否轮换中”。RESTORE 开始时把库状态置为 RESTORING；未初始化目标可以创建 EMPTY 占位再进入 RESTORING，不暴露半成品。

resume 只允许在当前 authEpoch 仍等于 startedAuthEpoch 时接管，不得通过改写 startedAuthEpoch 绕过撤销。若任务期间发生密码重置、凭据撤销或身份恢复而改变认证代次，用户以新完整会话和近期 MFA 可取消自己的旧任务，再重新 start；这种显式取消只解除暂存写锁，不接管或提交旧材料。其他上传、暂存下载及提交仍必须匹配任务绑定。

每个 batch 事务检查期限、authEpoch、sessionBindingId、预期条目 ID/版本和请求大小，登记 batch 摘要并写入条目；事务失败全部回滚。已存在同 batchId 且摘要相同则返回原结果，不同则 409。不同批次重复提交同一 itemId 必须拒绝，不能覆盖第一次上传内容；客户端从 status 查询已完成批次。取消、超时、resume 与 commit 使用同样行锁竞争，终态不可逆，过期时按数据库时间判断，不能只依赖回收任务准时执行。

提交摘要采用 `SHA-256(UTF8(JSON.stringify(["mini-erp-vault",1,"staging-manifest",ownerSubject,vaultId,rotationId,generation,keyEpoch,slots,items])))`，输出无填充 Base64url。slots 固定按 NORMAL、RECOVERY 排列，每槽数组为 `[slotType,slotId,keyId,formatVersion,algorithm,iv,ciphertext,kdfProfile,kdfSalt,wrapSalt,recoverySalt]`，不适用参数用 null；items 按规范 itemId 字符串字典序排列，每项数组为 `[itemId,contentVersion,keyEpoch,wrappedDEK.formatVersion,wrappedDEK.algorithm,wrappedDEK.iv,wrappedDEK.ciphertext,encryptedItem.formatVersion,encryptedItem.algorithm,encryptedItem.iv,encryptedItem.ciphertext]`。均使用规范 UUID、Base64url 和安全正整数，不包含 rowVersion、时间等服务端控制字段。本轮沿用该规范数组与摘要算法，条目集合扩展为完整冻结集合；删除状态和原删除时间只能由服务端从冻结源复制，并在 commit 与源记录逐项核对，不由客户端写入或借摘要替代校验。客户端下载 staging 时也返回这些公开生命周期元数据，逐条验证内容和状态一致。已验证后若暂存集合改变则提交失败。

commit 在一个 `@Transactional(rollbackFor = Exception.class)` 入口执行：

1. 锁定并校验身份、完整 MFA、当前 5 分钟内 Passkey 认证、authEpoch、任务绑定、未过期和预期版本。认证时间不足返回 403 `VAULT_REAUTH_REQUIRED`，保留未过期 staging；二次认证更新 Session ID，但逻辑绑定不变。401 则清理客户端秘密，重新登录后可用 resume 接管，再导入新旧材料恢复验证。
2. 从数据库检查预期与实际 itemId 集合双向差集均为空，数量和每项版本匹配；ROTATION 同时校验冻结源记录及服务端复制的删除元数据，RESTORE 校验目标仍无正常或可恢复的已删除记录。检查两个新槽完整且字段符合档案，重新计算按规范数组排列的暂存密文清单 SHA-256 与 verifiedManifestDigest 比较。此摘要仅证明客户端确认的密文集合一致，服务器不能证明解密结果或文件保管正确。
3. 完整校验后按第 9.1 节清理任务期间已到期的删除行；再将原 ACTIVE 代标记 RETIRED，将目标代设为 ACTIVE，切换活动指针，设置 ACTIVE 库状态并递增 metaRevision/collectionRevision；新 keyEpoch 由新代提供。由部分唯一索引保持最多一个活动代，并在持锁事务内显式确认活动指针对应的代存在、属于当前库且 keyEpoch/状态正确；所有校验及写入一起提交，不依赖延迟外键。
4. 同事务递增 account.auth_epoch，将任务置为 COMMITTED，保存含 generation/keyEpoch/版本的最小公开回执，新增 session_revocation_outbox、审计和幂等回执。任何一步失败则全部回滚，活动代保持旧状态。
5. 数据库提交后清理当前 HTTP 会话并要求重新登录/解锁；不能把当前旧会话直接改写成新 authEpoch 后继续使用。Redis 清理或响应发送失败不回滚已提交数据库，不向客户端声称切代失败。其他旧会话因 authEpoch 不符立即拒绝。

outbox 工作线程用 FOR UPDATE SKIP LOCKED 领取任务，设置短租约，数据库事务外访问 Redis；仅清理该账户且会话 authEpoch 小于任务值的会话，避免误删提交后新建会话。成功后标 DONE，Redis 失败按退避重试，工作线程崩溃则租约到期重新领取；不依赖 Redis Pub/Sub 收到每条事件。若采用 RedisIndexedSessionRepository，需验证会话索引在实际单机/集群部署可用；无论索引清理是否成功，请求代次校验始终生效。[Spring Session Redis 配置](https://docs.spring.io/spring-session/reference/configuration/redis.html)。

| 中断位置 | 恢复规则 |
| --- | --- |
| 数据库 commit 前失败 | 回滚到旧活动代；已完成的 staging 批次可在任务期限内继续 |
| commit 已成功，响应丢失或 Redis 不可用 | 禁止重复生成新材料；重新登录后查询 meta/status 取得持久化 COMMITTED 回执 |
| 后台撤销任务重复执行 | 按账户和代次幂等清理，只影响旧会话 |
| 上传超过近期认证 5 分钟 | 保留任务，提交前重新做 Passkey 认证；不延长 30 分钟期限 |
| 超过 30 分钟或取消与提交竞争 | 持锁后的唯一终态为准；取消/过期不能删除已提交活动代 |
| 新登录接管任务 | 近期认证后 resume 原子替换逻辑绑定；旧绑定即使仍登录也不能写该任务 |

整代密文清理只处理 RETIRED/ABORTED 代，保留当前 ACTIVE 代并重复检查状态；当前代仅允许按 30 天阈值清理到期删除条目，或按原 purge-delay 清理已替换密钥槽，不能清理有效条目/有效槽及未到期的可恢复条目；提交回执和最小代控制记录保留，不因清理无法查询提交结果。正常改 MP 也将旧正常槽逻辑删除及删除审计、新正常槽插入、版本递增、authEpoch 递增、outbox、审计和幂等回执放在同一事务；槽更改后的重试先查回执，不能再次覆盖当前槽。

## 10. 前端实施目录与工程要求

以下保留原实施时的职责拆分示意；实际文件沿用当前 `vault-web/` 结构，不为匹配示意重建目录。本轮在现有列表/详情、Worker 与服务类型中扩展已删除流程：

```text
vault-web/
  package.json / package-lock.json
  config/config.ts / config/routes.ts
  src/app.tsx / src/access.ts
  src/pages/user/login/index.tsx
  src/pages/vault/setup/index.tsx
  src/pages/vault/unlock/index.tsx
  src/pages/vault/items/index.tsx
  src/pages/vault/items/components/{TotpEditor,TotpCode}.tsx
  src/pages/vault/security/index.tsx
  src/pages/vault/recovery/index.tsx
  src/pages/vault/backup/index.tsx
  src/services/httpClient.ts
  src/services/vault/{session,vault,item,rotation,backup}.ts
  src/services/vault/typings.d.ts
  src/security/vault/{protocol,crypto,encoding,keyFiles,backup,itemSchema,totp}.ts
  src/workers/vault.worker.ts
  src/locales/{zh-CN,zh-TW,en-US}/passwordVault.ts
  src/locales/{zh-CN,zh-TW,en-US}.ts
```

目录只服务实际功能，不建立通用密码学框架。Worker 内部消息类型可放安全模块内部类型文件，HTTP 请求/响应类型统一为 services/vault/typings.d.ts 中的 `Vault` 命名空间。页面私有类型按项目约定保存。

主应用只增加入口、必要权限与三语文案。密码库应用自己的所有页面文案也必须三语维护，并在对应语言聚合文件导入。样式遵循 Tailwind 布局、antd-style 主题、CSS Modules 的顺序。业务请求经自己的 httpClient 封装，不能直接 fetch/request/axios；Worker 不承担网络请求。

TOTP 导入、参数校验、倒计时、复制、时钟提示和删除确认文案都同步维护简体、繁体、英文，保持国际化键一致。`itemSchema` 负责内容版本与容量校验，`totp` 负责解析及生成，不与密码库登录 WebAuthn 服务混放；生成动态码命令受解锁状态、条目 ID 和会话代次校验，不能在锁定后继续响应。

本轮前端仅在后续实现时调整现有页面及服务：新增已删除导航、只读详情、期限提示及恢复/永久删除交互；Worker 区分正常/已删除索引，并为轮换保留完整记录；服务层补齐生命周期协商、查询、回执、恢复和永久删除类型。普通业务 UI 不展示协议版本或后台任务参数；本次不修改这些代码文件。

密码库 mock 只生成显式虚构的测试数据，不能复制开发者真实密码；录制、快照、测试报告中不保存真实输入。生产异常上报最多包含固定错误码、协议版本和匿名请求 ID。

## 11. 部署与运行安全

- 全站 HTTPS；配置 HSTS 前确认域名及相关子域均满足 HTTPS 运维要求。
- 脚本、WASM、字体、图标均同源发布，禁止运行时 CDN 加载、统计、广告和会话回放。构建依赖锁定并保留来源与完整性记录。
- CSP 先在预发布验证再强制执行：限制 default-src、connect-src、worker-src、frame-ancestors、object-src、base-uri、form-action；Worker 使用同源静态文件。
- WASM 所需许可限定为 wasm-unsafe-eval；不以开放 unsafe-eval 解决打包问题。antd 样式按实际使用的 nonce/hash 或其他经评估方案适配，不假设所有内联样式均可直接禁止。CSP 是纵深防御，不能代替 XSS 修复。[CSP 指南](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)。
- 设置 frame-ancestors 'none'、Referrer-Policy: no-referrer、X-Content-Type-Options: nosniff；关闭不需要的传感器权限。生产构建不启用 React Query 开发工具，不对外发布 source map。
- v1 不注册 Service Worker，不持久化 API 响应或页面明文，不添加打印功能；不能保证阻止截图、浏览器扩展、系统剪贴板历史或操作系统取证。
- 发布权限与 ERP 分开控制，启用保护分支、依赖审查、构建产物摘要和最小部署权限；源隔离不能抵御同一套失陷发布凭据同时控制两端。
- 服务端备份仍需访问控制和存储加密；它们是附加保护，不能让后端获得客户端解密密钥。确定备份保留周期、删除策略并做恢复演练。

## 12. 当前进度与本轮实施分解

P0–P5 原计划功能按用户提供进度均已实现，包含密码库登录 Passkey MFA、TOTP、账号组、恢复、轮换及备份。原阶段工作量不再作为剩余工期，本次也不重新声称已执行全部历史验收。P6 第三方账号 Passkey 存储、原生配套应用及双向导入导出仍未实现，维持第 8.6 节范围和最低优先级；先完成本轮删除调整，再另行启动 P6。

本轮只做设计与文档更新，以下为后续实现顺序：

| 步骤 | 必要改动 | 验证通过条件 |
| --- | --- | --- |
| R1 后端生命周期与清理 | 复用软删除字段；区分条目 30 天与旧槽/旧代 purge-delay；删除回执、已删除查询/详情、单条恢复和永久删除、错误/审计枚举、协议协商及必要增量迁移 | 删除/恢复/永久删除事务、归属、期限边界、幂等、并发、容量及清理重试用例通过；无明文进入请求或日志 |
| R2 轮换与备份兼容 | start 冻结保留集合并支持 SOURCE 分页下载；服务端复制删除元数据；处理轮换中到期和超 2,000 条保留集合；空库恢复保护；用户备份保持原范围 | 改主密码、RK 恢复、完整轮换后仍可恢复未到期条目；期限不重置；旧客户端写入被阻断；新旧用户备份仍可验证 |
| R3 前端已删除流程 | 导航、独立列表/搜索、只读详情、准确期限、剩余天数、恢复和永久删除确认、容量错误、三语及锁定清理 | 桌面/小屏均可在详情恢复或永久删除，取消确认不产生请求；详情始终提示准确时间；计时、休眠、到期、会话失效及迟到结果行为正确 |
| R4 联调与发布 | 增量迁移核对、暂停旧清理器、处理历史残留与进行中任务、协调协议升级、到期清理观测和兼容回退 | 第 13 节新增用例通过；未到期数据不会被旧任务提前清除，发布失败可回退至兼容生命周期的版本 |

后续代码实施遵守各仓库修改边界：后端与前端由相应获授权的实施方分别完成；本次只修改本计划文档，不修改任一仓库业务代码、SQL 或运行配置。

## 13. 验收用例与发布检查

必须自动化覆盖的行为：

| 编号 | 用例 | 预期结果 |
| --- | --- | --- |
| C01 | 固定 MP、AK、盐和参数的派生向量 | 与独立实现一致；升级库后仍可解锁 v1 样本 |
| C02 | MP 正确但 AK 错误/缺失；AK 正确但 MP 错误 | 无法解锁，不返回任何条目明文 |
| C03 | 修改 IV、标签、密文、owner、条目 ID、内容版本或用途 | 认证失败；界面不显示部分解密结果 |
| C04 | 保存同一条目两次 | 使用新 DEK 和 IV，密文不同；历史版本冲突不能静默覆盖 |
| C05 | 用户 A 访问用户 B 的 ID 或轮换任务 | 所有相关读写拒绝；普通管理员也不能绕过归属 |
| C06 | XSS 注入测试字符串作为备注/标题，或 javascript URL | 内容按文本显示，非法外链拒绝，密码库不加载第三方脚本 |
| C07 | 锁定时仍有解密/搜索/保存请求未完成 | 迟到结果被丢弃，明文不重新出现在 UI 或缓存 |
| C08 | 后台计时受限、休眠后恢复、浏览器前进后退缓存恢复 | 敏感操作前检查超时，过期状态重新锁定 |
| C09 | 修改主密码时网络中断或两设备竞争 | 结果可查询，密钥槽整体替换，至少一个明确有效状态，无半写数据 |
| C10 | 轮换中途刷新、批次重复、超时或提交响应丢失 | 未提交时旧库可用；提交后以 meta 确认唯一代次；不存在混代 |
| C11 | 初始化未验证导出文件；恢复未验证新文件 | 不允许完成提交，避免生成无法再次解锁的库 |
| C12 | 备份缺项、重复、修改密钥槽、修改密文 | 认证清单或条目校验失败，不报告恢复成功 |
| C13 | 只有数据库/备份，没有 AK/RK | 没有可用正常解密路径；MP 单独不足以派生正常 KEK |
| C14 | 扫描请求、日志、异常、缓存与浏览器持久存储 | 不含测试 MP、AK、RK、KEK、VMK、DEK 或明文条目 |
| C15 | 错误协议版本、未知 KDF、超大参数、畸形文件、超大密文 | 在昂贵计算/解密前拒绝；不自动降级 |
| C16 | 跨站/ERP 同 site 的伪造写请求、伪造前端 MFA 状态 | CSRF、精确 Origin 与服务端认证检查拒绝 |
| C17 | 旧 MP+匹配 AK+旧备份，或旧 RK+旧备份 | 说明并验证旧副本仍可用，产品不误导用户已撤销它们 |
| C18 | 仅通过密码验证、重放 Passkey challenge、伪造 origin 或认证级别 | 待 MFA 会话不能读取库数据；挑战单次有效；绑定/认证/近期认证均按服务端规则校验 |
| C19 | 同 JVM 新增密码库 Session 安全链后访问 ERP 和密码库 | ERP 原 JWT 行为不变；ERP token 不被自动换成密码库会话；密码库接口不被原链误放行 |
| C20 | 采用实际部署组合检查前端、反向代理、数据库/Redis 权限和发布配置 | 独立源及 Cookie/Origin 边界有效；无第三方采集；如声称独立权限隔离，实际账号和 ACL 也须成立 |
| C21 | vault 请求同时携带 Cookie 与有效/无效 ERP JWT；模块未启用时访问 vault 路径 | 不执行全局 JWT 过滤器；只按 vault 会话授权；未启用时拒绝且不落回 ERP 链 |
| C22 | 参数错误、过期、归属错误、并发冲突、写锁、CSRF/Origin 拒绝 | HTTP 状态、JsonResult.code 和稳定 errorCode 一致，错误正文不含输入 |
| C23 | 丢失唯一 Passkey，有系统密码和一枚 MFA 恢复码；恢复中断或并发消费同码 | 仅一次消费成功；旧凭据/会话撤销；受限状态不能读密文；新 Passkey 认证且新码确认后才允许数据接口 |
| C24 | 只持有 RK，或全部 Passkey/MFA 恢复码遗失 | RK 不被身份接口接受；无备份时不能恢复线上库；有效离线备份可在另一空账户重新加密恢复 |
| C25 | 切代提交后 Redis 中断、工作线程崩溃/重复执行、响应丢失 | 数据库唯一代次与回执有效；旧 authEpoch 请求失败；任务重试不清理新代会话 |
| C26 | 轮换超过 5 分钟、超过 30 分钟、重新登录接管，及 commit/cancel/回收并发 | 近期认证可更新且保留逻辑绑定；绝对期限不延长；接管后旧绑定拒绝；唯一终态，不清理已提交活动代 |
| C27 | 在临时 PostgreSQL 执行建表 SQL，并并发初始化、开始任务、上传重复条目或畸形密文 | 所有新表位于 public 且使用 vault_ 前缀，没有物理主外键；非空唯一、部分唯一索引、档案和字节长度约束生效；无效关联、孤立记录、错误 keyEpoch 和清理顺序由 Service 事务测试覆盖，不把 DDL 成功当安全验收 |
| C28 | 创建、修改、删除条目；多次改 MP；删除与轮换竞争；后台清理及伪造审计字段 | 审计主体由服务端决定；已删内容从正常列表/用户备份排除并进入已删除列表，轮换冻结源集合仍保留未到期记录；槽替换及控制记录约束不变，清理不删除有效或未到期记录 |
| C29 | RFC 6238 三种 HMAC 向量、前导零、6/8 位、30/60 秒及 2038 年后时间 | 标准向量与独立实现一致；使用 8 字节计数器；时间窗口和位数正确 |
| C30 | 手动种子、otpauth URI、本地二维码图片；非法 Base32、重复参数、issuer 冲突、HOTP、超限文件/图片和未知参数 | 受支持配置正确导入；其他明确拒绝且不静默更改；图片、URI 和种子无网络上传或日志记录 |
| C31 | TOTP 跨窗口显示/复制、休眠恢复、时钟跳变、后台与锁定期间迟到结果 | 旧窗口结果不再显示或复制；按当前时间重算；后台遮挡/停止刷新，锁定清理；定时刷新不延长解锁 |
| C32 | 两设备分别修改密码或 TOTP；替换/删除种子和删除条目 | 整条目版本冲突，不静默覆盖其他字段；本地索引/显示清理；提示第三方启用/撤销需另行完成 |
| C33 | 六字段旧条目、新 schema、未知 schema，经编辑、备份、轮换和跨账号恢复 | 旧条目可读并按保存升级；新字段完整保留；未知 schema 阻止有损改写；旧客户端不能静默覆盖新结构 |
| C34 | 扫描 TOTP 导入、动态码显示/复制和用户主动二维码导出的请求、日志、缓存及浏览器持久存储 | 不含种子、otpauth URI、二维码图像或当前动态码；服务端只接收条目密文 |
| C35 | 在同一时间比较 TOTP 原库与恢复库，检查第三方已撤销种子的情况 | 种子、参数及账号关联往返一致；本地恢复不会重新启用第三方已撤销配置 |
| C36 | 用户主动二维码导出、Passkey 失败／取消／关闭期间迟到结果、60 秒期限、失焦／后台／锁定，以及默认和自定义参数扫码 | 每次真实 Passkey 与服务端近期认证通过才调用解锁 Worker 导出；本地二维码解码等于原配置；清理后不回显；两款真实手机验证器分别记录参数和结果，未执行则标为未验证 |

以下为本轮删除调整的新增验收门槛，尚待实现后执行，不影响原用例编号：

| 编号 | 用例 | 预期结果 |
| --- | --- | --- |
| D01 | 单条及批量删除带密码/TOTP 的账号、删除组 | 进入已删除；正常列表/搜索/用户备份排除；完整密文、内容版本保留；删除组不影响成员；回执包含期限和删除后版本 |
| D02 | 删除起 30×24 小时前一瞬、恰好到期、到期后一瞬；跨月、闰日、夏令时及时区切换 | 使用锁后数据库时间判断，只有严格早于 purgeAt 可恢复；期限固定 720 小时，客户端时钟无法延长 |
| D03 | 30 天内恢复后查看密码/TOTP，再次删除 | 原 ID 和密文不变，删除字段清空、行/集合版本递增且有审计；再次删除从新时间起算 |
| D04 | 两设备同时恢复、恢复与清理竞争、锁等待跨越到期 | 仅一个串行结果，过期不得恢复；已恢复有效行不得被候选清理误删；回滚不留半状态 |
| D05 | 删除/恢复成功后响应丢失、相同键重试、同键不同正文、不同键重复删除/恢复 | 返回原成功回执或明确冲突；不重写期限、不重复审计、不生成副本；旧回执不代表当前状态 |
| D06 | 到期后清理器停止、失败、重启、双实例领取及积压 | 到期即拒绝详情/恢复；恢复运行后分批幂等清理并更新版本，能观测失败/积压；不提前删除其他记录 |
| D07 | 进入详情后到期、休眠/后台返回、时钟回拨、到期或版本变化期间翻页 | 清理过期明文并禁用恢复；准确期限常驻；已删除游标失效后重载；不显示负数或 0 天；窄屏可省略天数但保留详情提示 |
| D08 | 跨用户/管理员、待 MFA、错误代次/版本、CSRF/Origin、401、未知协议版本 | 沿用归属与认证边界，错误归属统一 404；锁定/失效后正常及已删除明文均清除；旧客户端数据写入被阻断 |
| D09 | 含已删除密码/TOTP/组的改主密码、RK 恢复及完整轮换，随后清理旧代/旧槽 | 未到期内容用新材料仍可解密/恢复，删除状态及原期限不变；不依赖旧代密钥；少传或伪造状态不得提交 |
| D10 | 轮换中已删除条目到期、commit/cancel/超时，以及只有已删除数据时导入备份 | 固定清单完整验证，到期项不复活，终态立即处理到期行；存在可恢复条目时空库恢复被拒绝 |
| D11 | 正常记录满 2,000、删除后新建、恢复时容量已满，正常加已删除总量超过 2,000 | 删除释放正常容量；恢复满库失败不改期限；轮换/同步不截断保留记录，不因沿用旧总量上限丢失数据 |
| D12 | 密码删除前属于多个组，恢复密码/组，组成员后来已删除或已清理 | 密码恢复至全部密码且提示手动归组；恢复组不连带恢复成员，不创建副本或暴露不可用成员秘密 |
| D13 | 默认用户备份、start 后 SOURCE 下载、原 v1 备份恢复、客户端和后端请求/日志扫描 | 用户备份排除已删除并提示范围，SOURCE 始终与冻结集合一致，SOURCE/STAGING 游标不混用；备份格式/认证清单兼容，元数据不含明文秘密 |
| D14 | 上线前历史删除残留、已清理历史数据、既有轮换任务、发布回退 | 以原删除时间纳入或清理，不重置期限；不承诺补回已丢失密文/密钥；不恢复会提前清理的旧任务 |
| D15 | 桌面/小屏从已删除列表进入详情，取消或确认永久删除，网络失败及重试 | 恢复与永久删除均可直接操作；取消不请求且期限不变；确认成功立即移除详情/列表及本地秘密，无法再恢复；失败不假报成功，相同键重试只产生一次审计 |
| D16 | 永久删除与恢复、自动清理及另一设备永久删除竞争，或轮换进行中提交永久删除 | 统一锁与版本决定唯一结果；恢复后的正常记录不被误删；已清理记录统一 404；轮换写锁期间返回 423，不破坏冻结集合 |
| D17 | 永久删除密码/组、同 itemId 历史代密文副本，以及尝试直接永久删除正常记录或其他用户数据 | 仅清除目标已删除记录及同库历史副本，保留最小审计/回执；组成员及其他条目不变；正常记录拒绝，错误归属统一 404；用户已下载备份不被宣称同步擦除 |

以下用例仅为 P6 交付门槛，不作为本轮删除调整的前置条件：

| 编号 | 用例 | 预期结果 |
| --- | --- | --- |
| P6-C01 | Apple → 本项目 → Apple、Apple → 本项目 → Google、Google → 本项目 → Google、Google → 本项目 → Apple | 四条真实设备迁移路径均完成，凭据身份保持一致，导出后可实际登录原网站 |
| P6-C02 | 重复导入、账号关联冲突、未知算法/扩展或源提供方不允许导出 | 不静默覆盖既有凭据，不丢弃关键数据；不支持的迁移明确拒绝，不以公钥或记录信息冒充完整凭据 |
| P6-C03 | 原生端导入/导出取消、异常、锁定或会话撤销；扫描网络、日志及持久缓存 | 用户授权、认证和解锁状态均生效；取消/失败不写半成品；服务端及日志无明文私钥或解密材料 |
| P6-C04 | 网页与原生端协议互通、备份恢复、密钥轮换和旧客户端编辑 | 完整凭据与扩展数据往返保留，恢复后仍可导出使用；密钥与认证边界符合冻结方案，旧客户端不能造成有损改写 |
| P6-C05 | 网页移除凭据、导出完成后在源/目标应用查看凭据状态 | 不宣称已撤销第三方网站凭据或自动同步删除；导入导出、库内删除与网站撤销语义清楚 |

性能验收在 P0 记录真实设备型号与浏览器：桌面 Argon2 解锁目标不超过 2 秒，目标手机不超过 5 秒；2,000 条密文可分页同步并在 Worker 建索引，输入和锁定按钮保持响应。该指标是工程目标，未实测前不承诺。目标浏览器至少覆盖当前 Chrome/Edge、Firefox、macOS Safari 与 iOS Safari；不能只依赖 happy-dom 测试证明安全能力兼容。

提交业务实现前，ERP 根目录和 vault-web 各自执行对应检查：`npm run lint`、`npx antd lint ./src`、`npm run test`、`npm run build`；新增浏览器测试脚本后执行端到端测试。只用 Biome，不引入 ESLint/Prettier，不修改生成的 services/ant-design-pro 或 .umi 文件。

代码检查通过不等于安全评审通过。上线真实密码前必须完成密钥生命周期、协议格式、认证/归属、恢复/轮换、前端脚本与依赖的专项评审，并用独立设备成功恢复测试库。发布回退只回退兼容当前密文协议的前端；不能靠回滚数据库撤销已经成功提交的用户写入。

## 14. 执行起点

本轮设计交付为第 6.3、8.7 节及轮换/备份关联调整，后续按 R1–R4 实施并执行 D01–D17。编码前核对仍保留的删除行、活动代密钥和进行中的任务，按发布步骤防止旧清理策略继续提前清除数据；落地后端生命周期与轮换兼容，接入前端列表/详情/恢复/永久删除及三语交互，完成边界联调后发布。P0–P5 保持已实现状态，P6 继续独立排期。

本次仅更新此文档；未修改前后端代码、SQL、依赖或配置，未执行迁移、测试或线上任务。

账户密钥参考的是“用户额外持有高熵秘密”的安全思路，而不是普通登录验证码；它不需要记忆。1Password 对其 Secret Key 的说明可用于理解该权衡，但本方案不宣称与其产品具有相同安全保证。[Secret Key 说明](https://support.1password.com/secret-key-security/)。
