                                # 个人密码库实施方案

日期：2026-10-15。状态：实施设计稿，尚未实现、测试或完成安全审计。

面向每个用户独立管理自己的密码，优先保护数据库泄露、账户被盗和 ERP 页面漏洞场景。用户记住一个独立的主密码，并持有一份账户密钥文件；服务端负责身份认证、权限、密文存储和同步。第一版采用对称加密，不引入 RSA。RSA 并不能加强被弱主密码保护的私钥；未来出现共享需求时，再评估公钥协议。

本次交付为实施方案和后端仓库中的 PostgreSQL 建表 SQL，不修改前后端业务代码、依赖或运行配置，也不执行数据库迁移。后端内容是供后续协作使用的接口与数据契约，不代表本项目已经具备相应能力。本轮补齐认证隔离、HTTP 错误契约、Passkey 遗失恢复及轮换与会话撤销的一致性；不评审或修改现有非正式 nginx 配置。文档同时记录推荐默认项、可替换项及调整条件，P0 完成后冻结第一版实际采用的组合。

## 1. 第一版范围与成功标准

第一版包括：独立登录与 Passkey MFA、备用凭据管理和一次性 MFA 恢复码、初始化、账户密钥导入、主密码解锁、密码条目增删改查、本地搜索、密码生成、短暂显示与复制、自动锁定、修改主密码、恢复、完整密钥轮换、加密备份与恢复。

第一版不包含：团队共享、管理员恢复、浏览器自动填充、附件、TOTP 种子保管、明文导出、条目历史版本、长期离线编辑、可信设备持久化账户密钥、指纹快捷解锁。上述功能分别引入新的授权、明文或密钥保管边界，后续单独设计。

可验证目标：

- 数据库、API 请求、服务端日志与备份不包含主密码、账户密钥、恢复密钥或明文条目。
- 仅持有服务端数据库和已知主密码，仍无法通过正常解密流程获得条目，因为还缺少账户密钥。
- 仅获得登录会话不能解锁已有密码库；所有接口仍需服务端检查条目归属。
- 错误密钥、密文篡改、条目调包、版本不支持均失败关闭，不返回部分明文。
- 通过恢复演练证明：新设备可以恢复，普通改主密码不会丢失数据，中断轮换保留旧库可用。

## 2. 威胁边界

| 场景 | 设计措施 | 边界 |
| --- | --- | --- |
| 数据库或服务器备份泄露 | 客户端加密；账户密钥不上传 | 条目数量、长度、更新时间等元数据仍可见 |
| 登录会话被盗 | 登录与解密分离；高风险操作二次认证 | 攻击者仍可能读取密文、破坏数据；需备份与审计 |
| ERP 页面发生 XSS | 密码库独立源、独立构建和会话 | 不能保护密码库自身被注入恶意脚本的情况 |
| 用户设备或密码库前端被控制 | 减少明文驻留、发布保护、短时解锁 | 无法保证主密码或解锁后内容不被窃取 |
| 服务端篡改、删除或回放旧数据 | AEAD、身份绑定、版本检查、备份清单 | AEAD 不阻止删除；没有独立可信检查点时，不能完全检测整库历史回滚 |
| 主密码、账户密钥遗失 | 独立恢复密钥与加密备份 | 所有可用解锁路径都遗失时不可恢复 |

独立源与 Web Worker 都不是对恶意密码库脚本的安全沙箱。若未来要求抵御前端托管服务器下发恶意代码，应另立浏览器扩展或独立客户端项目，并设计独立的可信更新渠道。

## 3. 项目接入与部署

### 3.1 当前项目能力

现有前后端仓库核对结果：

- React 19、Umi Max 4、antd 6、TypeScript 严格模式可继续使用。
- `config/config.ts` 启用了 Google Analytics，并配置了 `@umijs/request-record` 插件；这不表示已经发生数据泄露，但密码库不应继承这些采集或录制能力。
- `src/app.tsx`、登录页面目前从 localStorage 保存或读取登录令牌；密码库使用独立会话，不复用这套浏览器令牌存储。
- 后端 `pom.xml` 使用 Java 25、Spring Boot 4.0.5、Spring Security、MyBatis-Plus 3.5.15、PostgreSQL、Spring Data Redis/Jedis，可以复用现有业务与存储技术栈。
- 后端 `SecurityConfig.java` 当前使用无状态 JWT，并关闭 CSRF；已检查的认证代码未见 OIDC、MFA 或密码库专用会话实现。前端保留的 OAuth 调用文件不能证明这些能力已经存在。
- 默认采用现有账号体系的密码库独立登录，再完成 Passkey MFA。需要免重复登录时可改用 OIDC，但必须在 P0 确认实际身份提供方能力，不把建设统一认证系统当作第一版必备前提。
- 当前 `npm run test` 实际运行 Vitest，尽管项目说明中还存在 Jest 字样；实施时以脚本与配置为准。

### 3.2 推荐默认部署

第一阶段推荐“独立前端站点 + 现有 Java 后端新增 vault 模块 + 独立密码库认证链与会话”。不要求新增整套密码管理产品、Node.js BFF 或单独购买服务器；密码库前端是一个独立构建的静态站点，BFF/会话职责可以由现有 Java 应用承担。

推荐在同一仓库新增独立应用 `vault-web/`，有自己的 `package.json` 和 `package-lock.json`，不自动改造为 npm workspace。复用技术栈和开发规范，不直接复制主应用配置。以下域名均为部署占位符，实施前替换为实际受控域名。

| 入口 | 部署内容 |
| --- | --- |
| ERP 原域名 | 仅增加“个人密码库”入口和三语菜单文案 |
| `https://vault.example.com` | 独立密码库前端 |
| `https://vault.example.com/api/v1/vault/*` | 通过反向代理访问现有 Java 应用中的密码库模块，同源请求 |
| `https://vault.example.com/vault-auth/*` | 独立登录、Passkey/MFA、退出；采用 OIDC 时增加授权跳转和回调 |

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
| `mybatis-plus-spring-boot4-starter`、PostgreSQL JDBC | 已有 | 复用，新增 vault 模块的实体、Mapper、Service 和 Controller |
| `spring-boot-starter-data-redis`、Jedis | 已有 | 复用连接设施，核对与新增 Session 依赖的客户端配置兼容性 |
| `spring-boot-starter-session-data-redis` | 未见直接依赖 | 默认新增，管理密码库服务端会话及撤销 |
| `org.springframework.security:spring-security-webauthn` | 未见直接依赖 | 默认新增，实施 Passkey 注册、验证和 MFA 组合策略 |
| `spring-boot-starter-security-oauth2-client` | 未见直接依赖 | 仅采用 OIDC/SSO 路径时新增；默认本地账号路径不需要 |

Spring 依赖优先由当前 Spring Boot BOM 管理兼容版本，不能直接照搬最新文档版本号。库支持 WebAuthn 不等于应用已经实现 MFA：还需持久化凭据、配置 RP ID/允许的 origin、要求用户验证，并将第二因子与当前用户和会话绑定。[Boot 4.0 依赖列表](https://docs.spring.io/spring-boot/4.0/reference/using/build-systems.html)、[Spring Security 7.0 Passkey 支持](https://docs.spring.io/spring-security/reference/7.0/servlet/authentication/passkeys.html)。

后端分层遵循现有 Controller → Service → Mapper 结构及 `JsonResult<T>`，多表一致性在 Service 事务中处理。密码库专用安全链匹配 `/vault-auth/**` 和 `/api/v1/vault/**`，优先级和路径边界必须显式配置；ERP 继续走原 JWT 链。新增 Spring Session 或 Cookie 配置后，必须回归 ERP 请求，不能因同 JVM 自动配置影响原认证行为。

第一版无需新建独立 Node.js BFF。选用现有 Java 服务时，由 Java 直接承担浏览器会话和可选 OIDC 客户端职责；拆分后端时，也可由独立 Java 服务承担这些职责。

### 4.3 前端职责与依赖

| 职责 | 采用能力 | 依赖动作 |
| --- | --- | --- |
| 初始化、登录、解锁、列表、显示/复制、恢复和备份页面 | React、Umi Max、antd、ProComponents | 沿用现有主版本，在独立应用声明实际需要的依赖 |
| Passkey 登录/MFA 交互 | 浏览器 WebAuthn API | 后端校验注册和认证结果；不能用前端“验证成功”标志替代 |
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

单个条目明文包括：`title`、`website`、`username`、`password`、`notes`、`tags`。整体加密，不为搜索另外上传标题、域名、标签或确定性搜索索引。条目类型 v1 固定为 login。备注按纯文本显示；网址只允许 http/https，打开外链断开 opener，不请求外部网站图标。

第一版容量上限为每库 2,000 条，每条序列化明文最多 16 KiB，标签最多 20 个；超过限制在加密前拒绝。服务器按协议限制密文盒长度和请求体大小，不尝试解密。上限通过 P0 压测校准后冻结。

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

内部逻辑 ID 使用 bigint 和 IdWorker/ASSIGN_ID，`id` 保留 NOT NULL、UNIQUE 和正数 CHECK，但不声明物理主键；逐项集合保留 `(rotation_id, item_id)` 非空唯一约束。MyBatis 的 @TableId 只标识应用使用的逻辑 ID，不要求数据库定义 PRIMARY KEY。公开协议 ID 使用 UUID，API 输出规范小写字符串。API 的 ownerSubject 由 `public.vault_account.owner_id` 转为规范十进制字符串，不能将雪花 ID 转成 JavaScript number。公开版本、generation、keyEpoch、authEpoch 均限制在 JavaScript 安全正整数范围。时间用 timestamptz，二进制用 bytea，HTTP 层严格转换 Base64url。普通改 MP 不改变 generation/keyEpoch，只替换当前 NORMAL 槽并更新版本。

`key_epoch` 由 `public.vault_generation` 表维护，meta 根据活动代取得；不在 vault 主表额外保存一个可能不同步的副本。密文盒按字段存储，数据库只校验协议版本、算法和字节长度，不能验证 GCM 标签。关联记录存在且属于当前用户、item 的 keyEpoch 与所属代一致、活动代恰好有两个未逻辑删除的有效槽、每库最多 2,000 条未逻辑删除的活动条目、活动指针与代状态一致等跨行规则，由 Service 在第 9.3 节的锁与事务内保证。唯一约束、部分唯一索引和 CHECK 继续用于防重复与字段约束，不能代替关联校验。

密码库采用项目的逻辑删除字段，并对密文配置独立的物理清理流程。用户删除条目后立即从业务查询、搜索同步及新生成的快照和备份中排除，随后清理已删除条目密文；被替换的旧密钥槽同样先逻辑删除再进入物理清理。逻辑删除不表示密文已经擦除，不提供回收站或恢复已删条目的接口；在线密文清理时限在 P0 明确配置，不允许无限期保留，物理清理保留必要的操作审计。清理 RETIRED/ABORTED 代的条目和密钥槽后，保留最小 generation/任务控制记录，便于查询超时提交结果；不提供历史版本解密功能。EMPTY 可作为已取消首次恢复的未初始化占位，meta 返回 initialized=false，并复用该 vaultId。删用户先按独立保留策略处理密码库；数据库不提供关联删除保护或级联清理，Service 必须显式阻止未处理的删除并维护关联记录，不能假定删父记录会自动处理子记录。

Redis 保存专用会话、短期认证挑战及限流计数，不另建 SQL Session 表。会话仅含稳定用户 ID、认证因子、时间、authEpoch 和随机逻辑会话标识，不保存 MP/AK/RK 或条目内容。`gmt_modified` 由应用审计填充，不把 DEFAULT 当作自动更新机制；表名前缀和表约束不代替权限隔离，运行账号仅授予实际需要的 vault_* 表权限。脚本仅调整新建 vault_* 表对 PUBLIC 的授权，不改变 public schema 或既有 ERP 表权限。

幂等回执仅存 ID、版本和结果，不缓存恢复码、认证令牌、登录口令或解密材料；第一版保留最小回执，不使用 Redis TTL 作为成功提交证据。重放回执前仍检查当前身份、MFA 和 authEpoch；旧回执只说明该次操作已成功，客户端仍需重新查询 meta 判断最新状态。

### 6.2 公共审计字段与逻辑删除

13 张表均保留统一的审计字段。现有框架已有创建/更新时间、创建/更新人和逻辑删除约定；删除人和删除时间是本次新增约定，不假定现有 FieldFillHandler 已经提供这些能力。

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

后续实体按项目约定配置 @TableLogic 和创建/更新字段的 @TableField(fill=...)。现有 FieldFillHandler 通过 SecurityUtils.getCurrentUser() 读取 LoginUser；vault 独立认证主体必须显式适配或在 Service 设置可信操作人，不能在返回 null 时沿用客户端字段。自定义 Mapper SQL、Wrapper 更新与逻辑删除均须显式维护审计字段；不能假定默认删除调用会自动填写 delete_user/gmt_deleted。本次仅更新设计和 SQL，不修改全局填充器。

删除条目在同一事务内锁定库并校验归属、活动代、写锁和 expectedRowVersion，再设置 is_deleted=true、delete_user、gmt_deleted、update_user、gmt_modified，递增 rowVersion 与 collectionRevision，并写操作审计和幂等回执。条目明文和 contentVersion 不变。未删除行禁止带删除人/时间；已删除行必须有删除时间，系统任务允许删除人为空。重复请求通过幂等回执返回结果，不重复递增版本。没有恢复已删条目的接口；删除成功后前端同步移除 Worker 搜索索引、列表及当前显示的秘密。

所有列表、计数、搜索同步、分页游标、空库判断、备份快照与轮换预期集合均排除已删除条目；关联校验同时检查相关父记录未删除。物理清理属于独立受控 Mapper 路径，按库锁和代状态再次校验，仅处理逻辑删除密文及 RETIRED/ABORTED 代；物理删除后仍可通过操作审计和最小控制回执确认结果。库为“空”按未删除条目计数，不能把残留软删除密文重新纳入恢复清单。

主密码修改需要在同一代插入新 NORMAL 槽，因此 `(vault_id,generation,slot_type)` 改用 `WHERE is_deleted=false` 的部分唯一索引：先标记旧槽删除、填写删除人/时间，再插入新槽，一起提交，失败则全部回滚。旧槽在物理清理前仍存在于数据库，不能把逻辑删除标记视为撤销旧解锁材料；疑似泄露仍需完整轮换。不能把 is_deleted 直接追加到普通唯一约束，否则多次替换后会因多条已删除槽冲突。slotId、itemId、账户 ownerId、库/代、批次和幂等键的身份约束继续保留；已删除记录不能用于绕过凭据撤销、单次消费或重放历史操作。

统一字段不意味着统一开放删除 API。Passkey 删除须先撤销并使旧会话失效，恢复码删除须先消费或撤销；STAGING/ACTIVE 代、UPLOADING 轮换和未完成 outbox 任务禁止仅靠软删除隐藏。审计表只追加，幂等/批次回执及最小代记录按保留策略维护，不通过普通业务接口删除；安全及回执校验需显式包含必要的历史记录，不能因默认逻辑删除过滤而把旧幂等键当作未使用。

## 7. 身份认证、会话和 API

### 7.1 独立密码库会话

密码库采用独立后端会话，提供两条部署时选定的认证路径，P0 冻结第一版启用哪一条。不能根据客户端请求任意切换认证策略。

默认路径是现有账号单独登录：密码库站点提交系统账号和系统登录密码，后端复用 AuthenticationManager/现有用户验证逻辑，不调用原登录接口获取 JWT 再返回给浏览器。密码验证后只建立受限的待 MFA 状态，允许执行绑定当前用户和会话的认证步骤，不能读取密码库数据；完成 Passkey 验证且新恢复码保管确认完成后才授予密码库数据权限。首次绑定和身份恢复期间只允许受限引导操作，详见第 7.6 节。每次认证状态提升需更新会话 ID，持久化 SecurityContext，并明确检查所需因子，不能仅依赖 authenticated() 放行第一因子会话。

可选路径是 OIDC SSO：Java/BFF 发起授权码流程，验证 state、nonce、issuer、audience 和 PKCE，并核验身份提供方的认证级别和认证时间。若需要调用上游 API，访问/刷新令牌仅保存在服务端。没有符合要求的 IdP 时继续使用默认路径，不要求为密码库先部署新的授权服务器，也不把前端已有 OAuth 调用当成可用 SSO。启用此路径需要单独配置客户端、重定向地址、退出与近期 MFA 策略。

两条路径都只给浏览器 `__Host-vault_session` Cookie，设置 Secure、HttpOnly、Path=/、SameSite=Lax，不设置 Domain。默认路径不需要生成上游 OAuth token。现有 ERP JWT 仍用于 ERP 自身，不能拿密码库会话替换整个应用的原认证机制。

所有密码库 API 同源。写请求要求精确 Origin 校验及会话绑定的 CSRF token；不能仅依赖 SameSite，因为 ERP 和 vault 子域可能属于同一 site。禁止跨域通配放行。不要把主应用 token 搬入 Cookie，也不要通过 URL 传 token。[Cookie 前缀规则](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)。

进入密码库要求 MFA。初始化、修改密钥槽、恢复提交、轮换和备份下载要求 5 分钟内完成的二次认证，认证状态由服务端记录，不接受前端布尔值。会话默认 15 分钟空闲超时、8 小时绝对超时；401 时清理客户端解锁状态。OIDC 路径无法提供所需认证保证时不能仅以 SSO 成功放行，也不能回退复用 ERP localStorage token。

Passkey 的 challenge 短期、单次有效并绑定用户、用途和会话，校验实际 origin/RP ID，要求用户验证；凭据持久化到数据库。首次绑定只允许在已验证系统登录密码、尚未初始化密码库且没有有效 Passkey 的受控引导流程完成；已有密码库后新增或替换凭据需要近期 MFA，或第 7.6 节明确限制的身份恢复会话。Passkey 遗失的身份恢复与密码库 RK 恢复分离，后端不能接收 RK 代替身份验证。Passkey 在第一版用于登录/MFA，不使用 PRF 自动解封 VMK，因此不等于已实现指纹快捷解锁密码库。

本地解锁不调用“验证主密码”接口。服务端不保存可由 MP 单独计算的解锁校验值，否则会形成绕过账户密钥保护的猜测入口。

### 7.2 认证端点

以下是应用契约路径，Spring Security 默认端点需在实现时映射到约定路径；未启用的策略不暴露对应登录入口。

| 方法/路径 | 适用路径 | 作用 |
| --- | --- | --- |
| GET `/vault-auth/options` | 两者 | 返回部署启用的登录方式并建立最小预认证会话及 CSRF token；不授予数据权限 |
| POST `/vault-auth/login` | 默认本地账号 | 校验系统账号/登录密码，建立待 MFA 状态；不接收 MP，不返回 JWT 或密码库内容 |
| POST `/vault-auth/passkeys/register/options` | 默认本地账号 | 受控首次绑定或近期 MFA 授权后生成一次注册挑战 |
| POST `/vault-auth/passkeys/register/verify` | 默认本地账号 | 校验并保存注册凭据，严格执行用户、用途和会话绑定 |
| POST `/vault-auth/passkeys/authenticate/options` | 默认本地账号 | 为当前待 MFA 或二次认证会话创建一次认证挑战 |
| POST `/vault-auth/passkeys/authenticate/verify` | 默认本地账号 | 验证断言，提升为完整会话或更新近期认证时间；首次绑定完成后也需按该流程验证 |
| GET `/vault-auth/login` | 可选 OIDC | 创建服务端 state/PKCE 并跳转身份提供方 |
| GET `/vault-auth/callback` | 可选 OIDC | 校验授权回调及 MFA 保证并建立独立会话 |
| GET `/vault-auth/reauth` | 两者 | 进入所选策略的近期认证流程；返回地址限定同源白名单 |
| GET `/vault-auth/passkeys` | 默认本地账号 | 完整 MFA 会话查看自己的凭据名称、状态及最近使用时间，不返回公钥正文 |
| POST `/vault-auth/passkeys/revoke` | 默认本地账号 | 近期 MFA；预期凭据版本；拒绝撤销最后一个有效凭据，引导走身份恢复 |
| POST `/vault-auth/recovery-codes/issue` | 默认本地账号 | 首次 Passkey 验证、近期 MFA 或受控恢复后的新 Passkey 验证；生成待确认批次，明文只返回一次 |
| POST `/vault-auth/recovery-codes/confirm` | 默认本地账号 | 本地导出并重新导入校验后确认 batchId，原子激活整批并撤销旧批次；服务端不能证明用户已可靠离线保存 |
| POST `/vault-auth/mfa-recovery/verify` | 默认本地账号 | 5 分钟内完成系统密码验证的待 MFA 会话提交一枚 MFA 恢复码；原子消费并建立 10 分钟受限重绑状态 |
| POST `/vault-auth/logout` | 两者 | CSRF 校验后注销密码库会话 |

包括登录、注册、认证在内的所有 POST 都受 CSRF 和精确 Origin 校验约束。预认证/待 MFA 状态仅允许必要认证端点，不能访问 `/api/v1/vault/*` 数据接口。注册凭据本身不能被误当成第二因子认证已经完成。MFA 恢复码验证失败统一返回 HTTP 403 `VAULT_MFA_RECOVERY_INVALID`；客户端保留尚未过期的待 MFA 状态，不能据此取得数据权限。

### 7.3 数据端点

以下路径统一加前缀 `/api/v1/vault`。业务调用统一使用各应用的 `src/services/httpClient.ts`，由 doGet/doPost 封装；新增文件接口类型放模块 `typings.d.ts` 的 `Vault` 命名空间。

| 方法/路径 | 请求/返回要点 |
| --- | --- |
| GET `/session` | 返回 ownerSubject、权限、MFA/近期认证状态、CSRF token；不返回解密秘密 |
| GET `/meta` | 返回库状态、generation、keyEpoch、metaRevision、密钥槽和允许的协议档案；未创建时返回明确状态 |
| POST `/initialize` | vaultId、两个密钥槽、idempotencyKey；事务创建唯一密码库，拒绝覆盖已有库 |
| GET `/items` | cursor、limit；返回当前 generation 的密文条目、rowVersion 和 collectionRevision；限制单页 100 条 |
| POST `/items/create` | itemId、generation、keyEpoch、contentVersion=1、密文盒、idempotencyKey |
| POST `/items/update` | itemId、expectedRowVersion、generation、keyEpoch、新 contentVersion、两个密文盒、idempotencyKey |
| POST `/items/delete` | itemId、expectedRowVersion、generation、idempotencyKey；事务内逻辑删除，写删除人/时间并递增 rowVersion、collectionRevision；仅影响当前用户库 |
| POST `/key-slots/change-master` | expectedMetaRevision、新正常槽、idempotencyKey；保持 AK、VMK 与恢复槽不变，原子递增 authEpoch |
| POST `/rotations/start` | rotationId、expectedMetaRevision、expectedCollectionRevision、新密钥槽、idempotencyKey；建立固定预期集合与新 generation，暂停本库写入 |
| GET `/rotations/status` | rotationId；返回该用户任务状态、截止时间、预期集合、已收批次、新代密钥槽与提交结果，用于超时后确认 |
| POST `/rotations/resume` | rotationId、预期版本、idempotencyKey；新完整会话经近期认证后显式接管未过期任务，事务替换 sessionBindingId，不改变暂存数据或期限 |
| POST `/rotations/batch` | rotationId、batchId、加密后的新代条目；上限 1 MiB，重试必须幂等 |
| GET `/rotations/items` | rotationId、cursor、limit；返回本用户 staging 密文，用于提交前下载验证 |
| POST `/rotations/commit` | rotationId、expectedCollectionRevision、verifiedManifestDigest、idempotencyKey；5 分钟内 Passkey 认证，原子切代并递增 authEpoch，见第 9.3 节 |
| POST `/rotations/cancel` | rotationId、idempotencyKey；丢弃未提交的新代，恢复旧库写入 |
| GET `/backup-snapshot` | 近期二次认证；在一致性快照中返回元数据与全部当前密文，流式传输 |
| POST `/restores/start` | 近期二次认证；目标必须为空；rotationId、新库/槽、经客户端验证的待恢复条目集合、预期元数据/集合版本、idempotencyKey；建立 restore 模式 staging |

备份恢复的批次上传、查询、下载验证、提交和取消复用 rotations 端点，通过服务端任务 mode 区分；不把客户端传入的 mode 当授权依据。restore 提交校验 start 时登记的完整目标集合，rotation 提交则校验已锁定旧代的完整集合。空账户恢复期间状态为 RESTORING，初始化和其他写入被拒绝；提交前不暴露半成品，取消后恢复原空库或未初始化状态。

恢复后重设密钥也使用 rotations 流程，由客户端在本地用 RK 解密并重新加密。服务端不接收 RK，不提供“输入恢复码让服务端解密”的接口。

统一约束：

- owner 从认证会话取得；所有查询沿 `public.vault_account.owner_id` 关联并限制归属，不能依赖菜单权限，也不能给管理员增加跨用户密文接口作为默认行为。
- 错误归属返回与不存在相同的真实 HTTP 404；并发冲突 409；轮换写锁 423；会话过期 401；二次认证不足 403。保留 JsonResult 结构，错误码与 HTTP 状态契约见第 7.5 节。
- POST 写入使用 CSRF、请求尺寸限制、字段白名单、版本检查和幂等键。相同幂等键但内容不同必须拒绝。
- 普通列表分页的 cursor 绑定用户、库、generation 和 collectionRevision；后续页发生代次或集合变化时返回 409，由客户端重新同步，避免拼接不同快照。快照和 staging 下载各自绑定固定代次。
- 初始化、正常改主密码、轮换提交分别有事务边界，不能先删除旧槽再写新槽。
- 数据接口返回 Cache-Control: no-store。网关、WAF、APM、应用日志、错误追踪和请求录制均排除请求/响应体，错误中不回显提交内容。
- “查看了密码”的本地审计只是客户端上报，不宣称服务端能完整记录所有离线解密；后端审计以认证、下载和写入等实际事件为准。

### 7.4 Spring Security 与会话隔离实施要求

现有后端 `SecurityConfig` 只有一条无状态安全链，`JwtAuthenticationFilter` 同时声明为 Bean 并加入该链。实施时先通过 `FilterRegistrationBean#setEnabled(false)` 禁止它被 Servlet 容器全局注册，仅由 ERP JWT 链执行；不能以只新增一个较高优先级安全链替代这一步。[Spring 官方过滤器注册说明](https://docs.spring.io/spring-security/reference/7.0/servlet/architecture.html#adding-custom-filter)。

| 顺序/范围 | 必须具备的行为 |
| --- | --- |
| 高优先级 vault 链 | securityMatcher 精确覆盖 `/vault-auth/**`、`/api/v1/vault/**`；只接受专用服务端会话；显式 SecurityContextRepository；保留 CSRF；精确 Origin 检查；JSON 认证失败/拒绝处理，不跳转 HTML 登录页 |
| ERP JWT 链 | 明确排除 vault 范围，继续 STATELESS；不从 Session 加载身份；只在这条链装配 JWT 过滤器 |
| vault 未启用或配置缺失 | 保留覆盖上述路径的拒绝链，不能落回 ERP JWT 链；缺少 RP ID/origin 等关键配置时失败关闭 |
| Redis Session 接入 | 专用 Cookie、Redis namespace、序列化和会话索引；SessionRepositoryFilter 的 Servlet 注册只覆盖 vault 路径，避免为 ERP 请求建立/读取密码库 Session |

不能用 ERP JWT 换取 vault 会话，也不能让带 ERP JWT 的请求写入 vault SecurityContext。同一请求带 Cookie 与 Bearer 时 vault 忽略 Bearer，只以有效 vault 会话授权；回归测试必须覆盖有效与失效的 ERP Bearer。

登录提升、MFA 提升和近期认证时更新实际 Session ID、保存新 SecurityContext，并更新 CSRF token，响应返回新 token，客户端在后续 POST 使用。服务端另外生成 `sessionBindingId`，只放服务端会话/任务，不通过 URL 或客户端自报；在同一次登录内的 Session ID 更新中保持不变，退出或重新登录则生成新值，轮换不会因正常二次认证而失去归属。需要继续未过期任务时，新的完整 MFA 会话可用近期认证、任务 ID、预期版本向 `/rotations/resume` 显式重新绑定；原绑定随事务替换，旧会话随后不能上传或提交。

所有已知用户的 vault 请求检查 sys_user 仍启用、未逻辑删除，且 vault_account/vault_info（已初始化时）未逻辑删除，以及会话 authEpoch 与 `public.vault_account.auth_epoch` 相同；数据库异常时拒绝授权，不能沿用缓存的旧判断。写操作在业务事务内再次加锁检查，避免过滤器校验后恰好发生撤销的竞态。Spring Session 的空闲 TTL 不等于 8 小时绝对超时，两者都要显式实施。待 MFA/恢复会话不以普通 authenticated() 获得数据权限，因子与 recoveryRequired 均由服务端判断。

### 7.5 HTTP 状态与 JsonResult 错误契约

当前后端全局业务异常主要用 HTTP 200 携带 JsonResult.code，且 JWT 过滤器在部分失败路径写 HTTP 200。vault 增加专用异常处理和安全链失败处理，不改变 ERP 旧接口行为：ControllerAdvice 仅作用于 vault Controller，过滤器/CSRF/认证入口也统一输出同一 JSON 格式。可以在 vault 范围内扩展 BusinessException，携带枚举化状态和 i18n key，不把所有业务错误映射为 500。

保持 `JsonResult<T>` 的 `code`、`success`、`message`、`data`。错误响应 `code` 等于真实 HTTP 状态，`success=false`，`data` 固定含稳定的 `errorCode` 和服务端生成的 `requestId`；不在机器码中拼接参数。message 国际化，不供前端分支判断；新增 key 维护后端 vault 模块的英文、简体、繁体资源并加入 MessageSource。

| HTTP | errorCode 示例 | 含义/客户端动作 |
| --- | --- | --- |
| 400 | `VAULT_INVALID_REQUEST` | 字段、协议格式或编码不合法，解密前拒绝 |
| 401 | `VAULT_SESSION_EXPIRED`、`VAULT_SESSION_REVOKED` | 会话过期/认证代次失效；立即清理本地解锁内容并重新登录 |
| 403 | `VAULT_MFA_REQUIRED`、`VAULT_REAUTH_REQUIRED`、`VAULT_RECOVERY_SETUP_REQUIRED` | 补齐 MFA、近期认证或恢复码保管步骤；不因近期认证不足而丢弃未提交的轮换材料 |
| 403 | `VAULT_CSRF_REJECTED`、`VAULT_ORIGIN_REJECTED` | 拒绝伪造请求，不回显请求正文 |
| 404 | `VAULT_NOT_FOUND` | 不存在与不属于当前用户统一响应 |
| 405 | `VAULT_METHOD_NOT_ALLOWED` | 不支持的 HTTP 方法 |
| 409 | `VAULT_VERSION_CONFLICT`、`VAULT_IDEMPOTENCY_CONFLICT`、`VAULT_ROTATION_EXPIRED` | 重新同步/查询结果；不能盲目覆盖或自动重做提交 |
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

当前只实现恢复协议设计，不提供管理员“清空 vault MFA 后仅凭系统密码重绑”的后门。如果所有 Passkey 和有效 MFA 恢复码均遗失，旧库在线访问不可恢复；管理员重置系统登录密码不会重置 vault MFA。用户仍可使用独立加密备份及 MP+AK 或 RK，在本地验证后向另一个完成 MFA 的空账户重新加密恢复。只有 RK、没有备份且无法通过 MFA 时，不能读取服务端密文恢复。界面需在初始化前说明这些条件。

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
3. 拉取密文列表；Worker 解密生成标题/用户名/网址/标签的内存搜索索引，不把整库密码作为列表数据传入 React。
4. 点击查看或复制时才返回单条秘密；显示 20 秒后遮挡。密码生成在本地用安全随机数完成，避免取模偏差。
5. 剪贴板只在用户明确点击时写入。默认不自动读取或覆盖剪贴板；说明复制内容可能被系统剪贴板历史保留，不承诺自动清除即可消除副本。

### 8.3 锁定规则

| 事件 | 固定行为 |
| --- | --- |
| 5 分钟无用户操作 | 锁定并清理 VMK、DEK、解密索引、明文字段和进行中的表单 |
| 页面转入后台 | 立即遮挡密码；后台达到 60 秒锁定 |
| 手动锁定 | 立即执行相同清理 |
| 刷新、关闭页面、退出密码库、401、切换用户 | 终止 Worker，清理 AK 和所有解锁内容 |
| 普通锁定后同标签页再次进入 | 可仅输入 MP；AK 保留在该标签页 Worker 的私有内存中 |

第一版不在 localStorage、sessionStorage、IndexedDB、Service Worker、React Query 持久缓存或全局 initialState 中保存 AK、MP、KEK、VMK、DEK、RK 或明文条目。AK 只在当前标签页存活；刷新后需重新导入。该使用成本换取不引入浏览器长期秘密存储。

Worker 和主线程维护会话代次。锁定时取消可取消的任务并递增代次，丢弃旧代异步结果；不可抢占的 WASM 计算结束后也不得发布旧代明文，随后清理缓冲。普通锁定可以保留 AK，但必须清理其他解锁内容，退出则终止 Worker。重获焦点、pageshow 和每次敏感操作前检查超时，不能依赖后台定时器准时执行。BroadcastChannel 仅广播锁定/退出事件，不广播秘密；新标签页独立导入和解锁。

JavaScript 字符串和垃圾回收无法保证物理内存立即擦除；清理是尽力覆盖缓冲、解除引用和限制存活时间。Web Worker 改善响应和秘密生命周期管理，但不能抵御同源恶意脚本主动调用其命令。

### 8.4 修改主密码与恢复

正常修改 MP：要求旧 MP 重新解锁和近期 MFA；生成新盐/新槽，用新 MP 与现有 AK 保护同一 VMK。先验证新槽可解密，再以 expectedMetaRevision 原子替换。记录更改事件并让其他会话失效；当前会话成功后也重新锁定。旧 MP 对已外流的旧密钥槽或历史备份仍然有效，不能宣称修改 MP 撤销了历史副本。若攻击者据此得到仍在使用的 VMK，还可能解密以后取得的当前数据；怀疑旧解锁材料泄露时，应完整轮换。

恢复：先登录并完成 MFA；Passkey 遗失时先按第 7.6 节恢复身份，再导入 RK 文件，从恢复槽得到 VMK；随后创建新 MP、AK、RK、VMK 并执行完整轮换。新文件必须导出和重新导入验证后才能提交。恢复文件遗失但 MP+AK 仍可用时，也通过该轮换流程生成新的恢复材料。

若既不能正常解锁，也没有可用恢复材料，界面说明无法恢复旧数据。管理员可以协助恢复登录身份，不能恢复解密秘密；不会用空库覆盖旧库作为隐式“修复”。

## 9. 完整轮换与加密备份

### 9.1 完整轮换

适用于恢复、账户密钥丢失/疑似泄露或用户主动更换全部密钥。正常改 MP 不需要走此流程。

1. 已解锁客户端取得一致性快照，先完成一次可验证的加密备份和近期 MFA。
2. 生成新 AK、RK、VMK，导出并验证新文件；调用 start 锁定本库写入并建立 staging generation。其他设备继续读旧代，但不能编辑。
3. 客户端逐条用旧密钥解密，使用全新 DEK、IV 和新 VMK 重新加密，按批上传新代。不能只重包旧 DEK 后称为“完整轮换”。
4. 服务端校验预期条目集合完整、无重复/额外条目、每个条目的版本与阶段协议一致。客户端下载新代进行完整解密验证，确认内容与原快照一致。
5. commit 在一个数据库事务中切换 activeGeneration、keyEpoch、两个密钥槽和版本，随后撤销其他密码库会话。提交响应超时后查询 meta/轮换状态确认，不重复替换新材料。
6. 客户端清理旧秘密并锁定，要求用新文件重新解锁。旧代在线数据提交后进入删除流程；数据库备份按既定保留周期过期。

rotationId 是随机不可猜标识，但不能代替归属、完整 MFA、authEpoch 和逻辑会话绑定。start 与 commit 都要求 5 分钟内的 Passkey 认证；批次、下载验证与取消要求完整会话，近期认证超时不清空 staging。start 后最长 30 分钟，取消或超时仅清理 staging 密文并将目标代标为 ABORTED，保留最小任务回执；普通轮换的旧代始终有效，恢复则回到原空库或 EMPTY 占位。服务端回收任务也须具备幂等性。同一库只允许一个轮换任务，批次重试不能覆盖不同内容。

轮换不能让攻击者忘掉已得到的密码。若疑似泄露的是实际网站密码，应在对应网站修改这些密码；历史快照和备份也不会因在线轮换被远程撤销。

### 9.2 备份与恢复验证

备份为完整密文包，包含所有公开派生参数、当前两个 VMK 槽、所有条目密文和版本。AK、RK、MP 不包含在备份包中，用户仍需至少一条有效解锁路径。

为检测备份中的缺项、重复和调包，v1 增加认证清单：客户端列出按 itemId 排序的条目 ID、contentVersion、keyEpoch 和规范条目数组的 SHA-256 摘要；清单包含 backupId、ownerSubject、vaultId、generation、条目数和公开密钥槽的摘要。每个条目规范数组固定为 ID、内容版本、密钥代次、两个密文盒的版本/算法/IV/密文字符串，不能依赖对象排序。

使用 VMK 经 HKDF-SHA-256 派生独立的 backup-auth 密钥：公开随机 32 字节 backupSalt，info 使用前缀、版本、backup-auth、ownerSubject、vaultId、backupId 的固定数组；对规范清单字节计算 HMAC-SHA-256。客户端在导出前及恢复前验证该认证清单和每条 AEAD。服务端不持有清单认证密钥。

认证清单用于检测已导出包的后续篡改，不能证明服务器在快照生成之前没有隐瞒或删除记录；这属于威胁边界中已说明的完整性与回滚限制。

第一版备份恢复只允许目标账户尚未初始化或密码库没有条目，不合并或覆盖已有非空库。先用源库 MP+AK 或 RK 在本地解锁备份并验证清单和全部条目；再生成目标库的新 AK、RK、VMK 和上下文，导出并验证新文件，经 restores/start 和 staging 批次将全部条目重新加密写入目标。源、目标身份不同时也必须重新绑定 AAD，不能直接改密文包 owner 或 ID。提交后使用新材料重新解锁验证，才显示恢复成功。第一版同时提供不写服务端的“备份验证”流程，便于定期演练。

### 9.3 数据库提交、认证代次与 Redis 撤销

PostgreSQL 是活动代与认证代次的唯一事实来源。`keyEpoch` 用于密码学上下文，`authEpoch` 用于撤销会话，二者不能互相替代。所有已登录请求先比较服务端认证代次；需要一致性的写操作在事务内再次校验。普通修改 MP、轮换/恢复提交、凭据撤销和身份恢复都在事务内递增 authEpoch，新增 outbox 任务；ERP 系统密码重置、禁用或删除用户也须在后续实现中接入同一撤销机制。MFA 恢复成功是唯一允许建立新 authEpoch 完整会话的受控恢复交接，必须重新生成 Session ID；普通改 MP 和轮换提交一律清理当前会话。

所有相关 Service 使用统一加锁顺序：`public.vault_account` → `public.vault_info` → `public.vault_rotation` → `public.vault_generation`/条目/密钥槽；不存在的账户使用 owner_id 唯一约束处理并发创建。需要串行化权限撤销的读操作在一致性快照事务中对 account 取 FOR SHARE，写操作取 FOR UPDATE。先完成授权再读取密文；已经在撤销前开始并取得快照的下载允许完成，撤销不能收回已下发数据。数据库/Redis 不可用时失败关闭，不在读取失败后回退到旧缓存或 ERP JWT。

start 持锁检查预期 meta/collection 版本和空库条件，仅将 is_deleted=false 的逐项集合、源版本、认证代次、服务端逻辑会话标识写入任务。唯一部分索引保证一个库只有一个 UPLOADING 任务。后续任何条目写入或改 MP 均持相同 vault 锁并检查任务，不能只在 Controller 查询“是否轮换中”。RESTORE 开始时把库状态置为 RESTORING；未初始化目标可以创建 EMPTY 占位再进入 RESTORING，不暴露半成品。

resume 只允许在当前 authEpoch 仍等于 startedAuthEpoch 时接管，不得通过改写 startedAuthEpoch 绕过撤销。若任务期间发生密码重置、凭据撤销或身份恢复而改变认证代次，用户以新完整会话和近期 MFA 可取消自己的旧任务，再重新 start；这种显式取消只解除暂存写锁，不接管或提交旧材料。其他上传、暂存下载及提交仍必须匹配任务绑定。

每个 batch 事务检查期限、authEpoch、sessionBindingId、预期条目 ID/版本和请求大小，登记 batch 摘要并写入条目；事务失败全部回滚。已存在同 batchId 且摘要相同则返回原结果，不同则 409。不同批次重复提交同一 itemId 必须拒绝，不能覆盖第一次上传内容；客户端从 status 查询已完成批次。取消、超时、resume 与 commit 使用同样行锁竞争，终态不可逆，过期时按数据库时间判断，不能只依赖回收任务准时执行。

提交摘要采用 `SHA-256(UTF8(JSON.stringify(["mini-erp-vault",1,"staging-manifest",ownerSubject,vaultId,rotationId,generation,keyEpoch,slots,items])))`，输出无填充 Base64url。slots 固定按 NORMAL、RECOVERY 排列，每槽数组为 `[slotType,slotId,keyId,formatVersion,algorithm,iv,ciphertext,kdfProfile,kdfSalt,wrapSalt,recoverySalt]`，不适用参数用 null；items 按规范 itemId 字符串字典序排列，每项数组为 `[itemId,contentVersion,keyEpoch,wrappedDEK.formatVersion,wrappedDEK.algorithm,wrappedDEK.iv,wrappedDEK.ciphertext,encryptedItem.formatVersion,encryptedItem.algorithm,encryptedItem.iv,encryptedItem.ciphertext]`。均使用规范 UUID、Base64url 和安全正整数，不包含 rowVersion、时间等服务端控制字段。客户端完成逐条解密/内容比对后计算摘要，服务端按相同规则重算；已验证后若暂存集合改变则提交失败。

commit 在一个 `@Transactional(rollbackFor = Exception.class)` 入口执行：

1. 锁定并校验身份、完整 MFA、当前 5 分钟内 Passkey 认证、authEpoch、任务绑定、未过期和预期版本。认证时间不足返回 403 `VAULT_REAUTH_REQUIRED`，保留未过期 staging；二次认证更新 Session ID，但逻辑绑定不变。401 则清理客户端秘密，重新登录后可用 resume 接管，再导入新旧材料恢复验证。
2. 从数据库检查预期与实际 itemId 集合双向差集均为空，数量和每项版本匹配；ROTATION 同时校验冻结源记录，RESTORE 校验目标仍为空。检查两个新槽完整且字段符合档案，重新计算按规范数组排列的暂存密文清单 SHA-256 与 verifiedManifestDigest 比较。此摘要仅证明客户端确认的密文集合一致，服务器不能证明解密结果或文件保管正确。
3. 先将原 ACTIVE 代标记 RETIRED，再将目标代设为 ACTIVE，切换活动指针，设置 ACTIVE 库状态并递增 metaRevision/collectionRevision；新 keyEpoch 由新代提供。由部分唯一索引保持最多一个活动代，并在持锁事务内显式确认活动指针对应的代存在、属于当前库且 keyEpoch/状态正确；所有校验及写入一起提交，不依赖延迟外键。
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

整代密文清理只处理 RETIRED/ABORTED 代，保留当前 ACTIVE 代并重复检查状态；当前代仅允许清理已逻辑删除的条目或已替换密钥槽，不能清理有效条目/有效槽；提交回执和最小代控制记录保留，不因清理无法查询提交结果。正常改 MP 也将旧正常槽逻辑删除及删除审计、新正常槽插入、版本递增、authEpoch 递增、outbox、审计和幂等回执放在同一事务；槽更改后的重试先查回执，不能再次覆盖当前槽。

## 10. 前端实施目录与工程要求

以下是实施阶段新增目录，不是当前已经存在的代码：

```text
vault-web/
  package.json / package-lock.json
  config/config.ts / config/routes.ts
  src/app.tsx / src/access.ts
  src/pages/user/login/index.tsx
  src/pages/vault/setup/index.tsx
  src/pages/vault/unlock/index.tsx
  src/pages/vault/items/index.tsx
  src/pages/vault/security/index.tsx
  src/pages/vault/recovery/index.tsx
  src/pages/vault/backup/index.tsx
  src/services/httpClient.ts
  src/services/vault/{session,vault,item,rotation,backup}.ts
  src/services/vault/typings.d.ts
  src/security/vault/{protocol,crypto,encoding,keyFiles,backup}.ts
  src/workers/vault.worker.ts
  src/locales/{zh-CN,zh-TW,en-US}/passwordVault.ts
  src/locales/{zh-CN,zh-TW,en-US}.ts
```

目录只服务实际功能，不建立通用密码学框架。Worker 内部消息类型可放安全模块内部类型文件，HTTP 请求/响应类型统一为 services/vault/typings.d.ts 中的 `Vault` 命名空间。页面私有类型按项目约定保存。

主应用只增加入口、必要权限与三语文案。密码库应用自己的所有页面文案也必须三语维护，并在对应语言聚合文件导入。样式遵循 Tailwind 布局、antd-style 主题、CSS Modules 的顺序。业务请求经自己的 httpClient 封装，不能直接 fetch/request/axios；Worker 不承担网络请求。

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

## 12. 实施分解与交付门槛

各阶段按顺序推进。时间是工作量估计，按一名前端、一名后端协作估算，不包括排期与外部审计等待；P0 之后根据验证结果重估。估计针对默认的同 JVM 模块、本地账号和新增 Passkey MFA，不假设这些认证功能已经完成；新建 IdP、拆后端进程或独立基础设施的额外工作不包含在当前估计中。

| 阶段 | 工作与产物 | 验证通过条件 | 参考工作量 |
| --- | --- | --- | --- |
| P0 可行性与协议冻结 | 冻结部署与认证路径；验证 Java 会话、安全链隔离和 MFA；独立构建；固定库版本、协议及测试样本；测试 Argon2 secret、Worker、CSP 与目标设备；选择 OIDC 时再验证 IdP | 两种独立实现结果一致；错误 AK 失败；真实浏览器可构建运行；已记录最终技术选择、依赖版本和认证验证结果 | 前端 2–3 人日，后端 2–3 人日 |
| P1 加密内核 | 派生、密文盒、上下文、文件格式、Worker 状态、清理、认证清单；不接入真实数据 | 正向、篡改、错误上下文、错误密钥、异步锁定测试通过；固定向量可复现 | 前端 3–5 人日 |
| P2 服务契约与密文存储 | 独立安全链、会话、Passkey/MFA 与一次性身份恢复码（或已选 OIDC）、HTTP 错误映射、CSRF、归属校验、初始化、CRUD、并发、幂等、authEpoch/outbox、轮换 staging、快照；前端仅联调虚构数据 | 跨用户、待 MFA 越权、并发写、中断和重试测试通过；扫描日志/抓包无秘密；ERP 原 JWT 流程回归通过 | 后端 7–10 人日，前端 1–2 人日 |
| P3 页面与正常使用 | 登录/MFA、初始化、文件校验、解锁、列表、本地搜索、显示/复制、三语、自动锁定、主应用入口 | 目标浏览器端到端流程完成；刷新需导入 AK；锁定后旧异步结果不恢复明文 | 前端 4–6 人日 |
| P4 恢复、轮换与备份 | 恢复向导、两套新文件验证、全量重加密、断点失败处理、认证备份验证与恢复 | 多设备冲突、网络中断、提交超时、旧文件、新备份和新设备完整演练通过 | 前端 3–5 人日，后端 2–3 人日 |
| P5 发布评审 | 安全评审、权限/供应链/CSP 检查、预发布恢复演练、发布/回退说明 | 无未处理的高风险问题；证明回退不会破坏新密文格式；先用测试账户验收 | 工程 2–3 人日，另计评审时间 |

前端合计约 15–24 人日，后端约 11–16 人日；不把两者相加直接当日历工期。以上包含安全边界和恢复功能，不适合作为两三个页面的普通 CRUD 工作量估计。

本前端仓库的后续实现遵守禁止修改 Java 后端的边界。P2/P4 中的后端工作由获授权的后端实施方完成；前端可以先用符合契约的 mock 联调，但不以 mock 通过视为后端安全验收完成。

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
| C28 | 创建、修改、删除条目；多次改 MP；删除与轮换竞争；后台清理及伪造审计字段 | 审计主体由服务端决定；逻辑删除同时写删除人/时间及版本，已删内容不进入列表/快照/备份；多次槽替换不触发已删槽唯一冲突；控制记录不能靠软删除绕过，物理清理不删除有效条目/槽 |

性能验收在 P0 记录真实设备型号与浏览器：桌面 Argon2 解锁目标不超过 2 秒，目标手机不超过 5 秒；2,000 条密文可分页同步并在 Worker 建索引，输入和锁定按钮保持响应。该指标是工程目标，未实测前不承诺。目标浏览器至少覆盖当前 Chrome/Edge、Firefox、macOS Safari 与 iOS Safari；不能只依赖 happy-dom 测试证明安全能力兼容。

提交业务实现前，ERP 根目录和 vault-web 各自执行对应检查：`npm run lint`、`npx antd lint ./src`、`npm run test`、`npm run build`；新增浏览器测试脚本后执行端到端测试。只用 Biome，不引入 ESLint/Prettier，不修改生成的 services/ant-design-pro 或 .umi 文件。

代码检查通过不等于安全评审通过。上线真实密码前必须完成密钥生命周期、协议格式、认证/归属、恢复/轮换、前端脚本与依赖的专项评审，并用独立设备成功恢复测试库。发布回退只回退兼容当前密文协议的前端；不能靠回滚数据库撤销已经成功提交的用户写入。

## 14. 执行起点

建议下一步进入 P0：按第 3、4 节确定“独立前端 + 现有 Java 模块”的默认部署及“本地账号 + Passkey MFA”的默认认证是否符合实际需求；如选 OIDC、拆后端或独立存储，记录触发条件、额外成本和验证结果。随后在独立原型中验证 Argon2id secret 输入、固定向量、Worker、独立源与 CSP，并与后端确认独立会话、MFA 和轮换事务能力。完成 P0 后冻结技术组合、协议、依赖版本和 API，再开始页面开发。

账户密钥参考的是“用户额外持有高熵秘密”的安全思路，而不是普通登录验证码；它不需要记忆。1Password 对其 Secret Key 的说明可用于理解该权衡，但本方案不宣称与其产品具有相同安全保证。[Secret Key 说明](https://support.1password.com/secret-key-security/)。
