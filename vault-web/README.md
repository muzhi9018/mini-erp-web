# 个人密码库前端

同仓库、独立构建的 Umi Max 应用。部署占位域名为 `https://vault.example.com`，需在正式联调时替换为受控域名并配置 DNS、证书和后端精确 Origin/RP ID。ERP 的 `/personal-vault` 页面仅提供独立站点入口，构建 ERP 时用 `VAULT_SITE_URL` 设置地址。

首次使用请阅读 [个人密码库初始化与使用指南](../docs/password-vault-initialization-guide.md)，按界面顺序完成 Passkey、MFA 恢复码、主密码和密钥文件设置。

## 本轮对接范围

- 独立 Cookie 会话、CSRF token 轮换、系统账号登录、Passkey 注册和 MFA。
- 首次 MFA 恢复码导出、重新导入确认，以及使用一次性码进入身份重绑流程。
- 主密码初始化、账户密钥及解密恢复文件导出与重新导入验证。
- Worker 中的 Argon2id（含 secret=账户密钥）、HKDF、AES-256-GCM 和认证上下文。
- 密文分页同步、条目增删改查、本地搜索、安全随机密码、短暂显示和主动复制。
- 手动/闲置/后台锁定、跨标签页锁定、401 清理、过期及迟到结果拦截。
- 简体中文、繁体中文、英文。

已对接后端 schema v2、账号 TOTP、备用 Passkey 管理、MFA 恢复码换批、修改主密码、完整密钥轮换、RK 解密恢复、加密备份和空账户恢复。第三方账号 Passkey 的 P6 需求不在本次范围。仍需真实 HTTPS/硬件 Passkey、跨设备恢复与生产专项安全验收，请先使用测试账户。

## 本地运行与后端配置

需要 Node >=22，使用本目录自己的 package-lock.json；不是 npm workspace。

首次启动前，在本目录执行 `cp .env.example .env.local`，并在 `.env.local` 中填写 `VAULT_API_TARGET`，包括后端网关所需的路径。真实后端地址仅保存在被 Git 忽略的本地文件或运行环境变量中，代码不提供默认目标。未配置该变量时不启用 Umi 开发代理；使用 Umi 内置的 `.env` 和 `.env.local` 加载规则；生产部署继续通过独立站点的同源反向代理访问后端。

使用已有 NGINX 和证书时，开发域名、证书路径和后端地址仅在本目录的 `.env.local` 或运行环境变量中配置，不写入代码或文档。NGINX 将页面请求转发到本机 Umi 开发服务，认证与数据请求转发到环境变量指定的后端。

首次配置：

1. 在 `.env.local` 中填写以下变量。`VAULT_DEV_ORIGIN` 使用证书覆盖的完整 HTTPS Origin；将其主机名在本机 DNS 或 hosts 文件中解析到回环地址。

| 变量 | 用途 |
| --- | --- |
| `VAULT_DEV_ORIGIN` | 浏览器访问的 HTTPS Origin，使用默认 443 端口 |
| `VAULT_NGINX_CERT` / `VAULT_NGINX_KEY` | 本机证书及私钥路径；相对路径从 `vault-web/` 解析 |
| `VAULT_NGINX_API_TARGET` | NGINX 直连后端的 HTTP(S) Origin，不含网关路径 |

2. 在本目录运行以下命令，从 `deploy/nginx.dev.conf` 模板生成本地配置：

```sh
npm run nginx:dev
```

3. 在本机 NGINX 的 `http` 配置块中加载生成的 `deploy/nginx.dev.local.conf`，执行 `nginx -t` 后再重载。生成文件包含真实配置，已被 Git 忽略；不要直接加载尚未替换变量的模板。
4. 由后端运行环境启用密码库，并将 `vault.origin` 设置为 `VAULT_DEV_ORIGIN` 的值，`vault.rp-id` 设置为该 Origin 的主机名。根目录 `.env.local` 中的 `DEV_VAULT_SITE_URL` 也使用同一个 Origin。

之后可在仓库根目录同时启动 ERP 和密码库：

```sh
npm run dev:all
```

ERP 访问 `http://localhost:8000`，其“个人密码库”入口在开发环境通过根目录 `.env.local` 的 `DEV_VAULT_SITE_URL` 配置为独立 HTTPS 站点；生产构建使用 `VAULT_SITE_URL`。按 Ctrl+C 同时停止两项服务。启动前请先停止已有的 ERP 或密码库开发进程，避免占用 `8000` / `8002`。

退出时会清理本次启动的 Umi 进程组，包含配置热重启后的服务进程；超过 3 秒仍未退出的进程会强制结束。单独运行密码库的 `npm run dev` / `npm run dev:https` 也采用相同的退出逻辑。

分开启动时，在根目录执行 `npm run dev` 启动 ERP，另一个终端执行 `npm run dev:vault` 启动密码库。也可以只在密码库目录启动：

```sh
cd vault-web
npm run dev
```

浏览器打开 `VAULT_DEV_ORIGIN` 配置的站点，保留热更新、Worker 和源码断点调试能力。浏览器无需访问开发服务的 HTTP 地址。

| 浏览器请求 | nginx 上游 |
| --- | --- |
| 页面、静态资源及 HMR WebSocket | `http://127.0.0.1:8002` |
| `/vault-auth/*` | `VAULT_NGINX_API_TARGET`，保留请求路径 |
| `/api/v1/vault/*` | `VAULT_NGINX_API_TARGET`，保留请求路径 |

这个新虚拟主机中的 API 路径直接保留，无需额外 `/api` 前缀；原有后端网关的重写规则保持原样。修改环境变量后需重新生成并重载本地 NGINX 配置。

以下是前端直接提供 HTTPS 的可选方式；使用现有 nginx 时跳过此部分。首次在本机准备可信开发证书（macOS）：

```sh
cd vault-web
brew install mkcert
mkcert -install
mkdir -p .certs
mkcert -cert-file .certs/localhost.pem -key-file .certs/localhost-key.pem localhost 127.0.0.1 ::1
npm run dev:https
```

`mkcert -install` 会安装本机开发 CA 的信任，需要由开发者在本机执行。本项目不会自动修改系统证书信任。证书目录已忽略提交；有现成证书时，可通过 `VAULT_DEV_CERT` / `VAULT_DEV_KEY` 指定其路径。

浏览器打开 `https://localhost:8002`，后端运行配置使用：

```yaml
vault:
  enabled: true
  origin: https://localhost:8002
  rp-id: localhost
```

HTTPS 开发服务器将 `/vault-auth/*` 和 `/api/v1/vault/*` 代理至 `.env.local` 中 `VAULT_API_TARGET` 配置的入口。前端保留真实浏览器 Origin。开发时启用 source map，生产构建关闭；在 DevTools 的 Sources 中可调试页面，Worker 可从其线程入口调试。ERP 开发入口通过根目录 `.env.local` 的 `DEV_VAULT_SITE_URL` 指向本地密码库。

如果后端网关入口包含 `/api` 前缀，在 `VAULT_API_TARGET` 中保留此前缀，nginx 转发时去掉第一个 `/api`。配置后运行：

```sh
npm run dev:https
```

浏览器仍打开 `https://localhost:8002`，业务服务继续使用相对路径；目标地址只配置在 Umi 开发代理中。代理使用 nginx 域名作为上游 Host，并保留浏览器的 Origin，不向浏览器引入跨域接口请求。

| 浏览器请求路径 | Umi 转发至 nginx 的路径 | nginx 去掉前缀后的 Java 路径 |
| --- | --- | --- |
| `/vault-auth/options` | `/api/vault-auth/options` | `/vault-auth/options` |
| `/api/v1/vault/meta` | `/api/api/v1/vault/meta` | `/api/v1/vault/meta` |

数据接口转发时的两个 `/api` 是有意的：第一个属于 nginx 网关前缀，第二个属于 Java 接口路径，不能一起删除。后端 `vault.origin` 仍为浏览器源 `https://localhost:8002`，`vault.rp-id` 仍为 `localhost`，不配置成上游网关地址。现有 nginx 规则无需为这一开发代理方式修改。

首次安装依赖或只查看 HTTP 页面时：

```sh
cd vault-web
npm ci
npm run setup
npm run dev
```

`npm run dev` 默认监听 `http://localhost:8002`，`npm run dev:https` 则使用本地证书直接监听 HTTPS。也可将独立 HTTPS 域名的页面请求反向代理至 HTTP 开发服务器，或构建后使用下方的独立站点部署模板。不设置跨域 API 地址，不读取 ERP localStorage token。开发代理保留浏览器 Origin。

ERP 的 Utoopack 开发服务会占用 `8000` 和内部端口 `8001`，因此密码库避开这两个端口。两条开发命令均通过 Umi 的 `PORT` / `STRICT_PORT` 固定端口 `8002`；端口占用时会报错退出，避免自动切换端口后与后端精确 Origin 配置不一致。

后端 `VaultProperties.validate()` 明确只接受 HTTPS Origin，且 RP ID 必须等于 Origin 主机名。因此直接在浏览器访问 `http://localhost:8002` 只能查看前端或执行模拟接口测试，不能通过真实后端的 Origin 校验；不能把后端 Origin 配成 HTTP 来绕过此约束。

后端仓库默认配置中的 `vault.enabled` 为 false，实际运行环境可能覆盖它。真实联调需后端实施方配置：

- `vault.enabled=true`；数据库表、Redis Session 及依赖服务已就绪。
- `vault.origin` 等于浏览器访问的完整源（含协议及非默认端口），`vault.rp-id` 对应该域名。
- 联调及正式环境均使用可信 HTTPS，并确认 `__Host-vault_session` Cookie 的 Secure/HttpOnly/Path/SameSite 设置。Origin 不包含路径或末尾斜杠，例如 `https://vault.example.com`；使用非默认端口时须包含端口。

本轮未修改 Java 后端或其运行配置，也未在当前环境完成真实后端账号、Cookie、Redis、数据库和 Passkey 校验联调。开发域名/端口变化后必须重新验证凭据绑定；不同 RP ID 的 Passkey 不能直接复用。

## 生命周期与重试

所有锁定都会终止 Worker、清理本页文件和明文、移除密文查询缓存。因此普通锁定也需要重新导入账户密钥，比方案允许保留 AK 的模式更保守。主密码不做 trim 或 Unicode 归一化。

开发环境的 effect 重放和热更新也执行完整清理，释放旧操作标记，再重新读取会话和密码库状态。状态尚未读取时显示加载或重试说明；读取失败后的“关闭提示 / 重新连接”会重新请求会话和状态，避免仅关闭错误后留下无法进入的页面。

显示内容 20 秒后移除，进入后台立即关闭显示及编辑表单。自动锁定默认时限：开发环境无操作 1 分钟或后台 20 秒，生产环境无操作 5 分钟或后台 60 秒。焦点恢复、pageshow、每次敏感操作和异步返回都会检查期限。复制不自动读取/覆写剪贴板，系统剪贴板历史可能保留副本。

可以在 `vault-web/.env.local` 或启动/构建命令的环境变量中配置自动锁定时限：

```dotenv
VAULT_IDLE_LOCK_MINUTES=1
VAULT_BACKGROUND_LOCK_SECONDS=20
```

两个变量分别以分钟、秒为单位，必须是正整数；留空采用当前环境默认值。配置在启动或构建时读取，修改后重启开发服务，生产环境修改后须重新构建。环境变量的显式值在开发和生产构建中都会生效；发布构建时应清除仅用于本地测试的覆盖值。页面三种语言的锁定提示与实际时限使用同一份配置。后端 Passkey 近期认证的 5 分钟规则单独管理。

初始化失败时保留已验证的材料和幂等键，重试前查询 meta。条目保存结果未确认时，重试复用原密文和幂等键；不允许在未确认请求上继续编辑。版本冲突保留当前草稿，并提供明确的“放弃草稿并加载最新版本”操作。离线刷新后没有秘密持久化，也没有自动恢复未提交编辑的功能。

## 验证

```sh
npm run lint
NO_UPDATE_CHECK=1 npx antd lint ./src --format json
npm run test
npm run build
npm run test:browser
```

浏览器测试使用本机 Chrome，在独立的 `18002` 端口启动生产构建预览，避免占用正在使用的 `8002` 开发服务。接口由测试契约模拟器拦截，并模拟 Java 响应省略 null 字段的行为；WebAuthn 使用 Chrome 虚拟认证器；Worker、WASM 和 Web Crypto 则在真实浏览器执行。测试覆盖首次登录/MFA、文件验证、密文 CRUD、提交后响应丢失的幂等重试、搜索、短暂显示、刷新、后台/闲置/pageshow 锁定、401 清理和秘密不进入请求/持久存储；生产脚本及 Worker 同时应用部署模板的 CSP。它不证明 Java 后端的权限、事务或真实身份恢复已通过验收。

固定 KDF 样本由 Node 24 的独立 OpenSSL Argon2id 实现生成，参数和 secret 输入与 hash-wasm 4.12.0 对照。单元测试仍使用 Node 环境；真实浏览器测试不能由这些单元测试替代。

## 部署

仅发布本目录 `dist/`，不要混入 ERP 构建产物。`deploy/nginx.conf.example` 是独立站点模板，没有修改现有 nginx 配置。所有静态脚本/WASM 同源，禁止请求录制、统计脚本、第三方字体和 source map 发布。

CSP 允许 `wasm-unsafe-eval`，不允许 `unsafe-eval`；样式暂允许 antd 所需的内联样式。模板仍需在预发布中验证 CSP、代理、Cookie 和安全响应头，再完成专项发布评审。各目标浏览器、手机性能及新设备恢复演练尚需后续验收。

## 已核对的后端契约差异

- `/items` 和 `/rotations/items` 使用 `pageSize`，不是设计稿表格中的 `limit`。
- 密文盒字段为 `wrappedVmk`、`wrappedDek`、`encryptedItem`；算法名 `A256GCM`。
- 认证阶段为 PASSWORD / RECOVERY_ENROLLMENT / RECOVERY_SETUP / MFA。
- `/vault-auth/options` 提供 `credentialRevision`；登录/认证/恢复确认响应会轮换 CSRF token，后续 POST 必须更新。
- Java 的 FastJson 响应省略值为 null 的字段。前端在接口边界补齐密钥槽中可空的参数，并将省略的 `nextCursor` 视为分页结束；加密协议、必填字段及密文校验仍严格执行。
- HTTP 错误按 `data.errorCode` 分支处理，页面不展示服务端任意异常消息或提交内容。

## 本轮核验记录（2026-10-16）

独立应用通过 Biome + TypeScript、antd 专项检查、加密/会话/分页单元测试、生产构建及 Chrome 浏览器流程测试。ERP 主应用生产构建通过，新增入口及三语文件通过定点检查。

主应用整库检查仍有已有问题：Biome 报告现存 SVG 文件的 49 处错误；TypeScript 在 `src/access.test.ts` 有 3 处旧用户类型不匹配；原有测试 15 项失败（access、app、requestErrorConfig 和 CategoryForm）。antd 整库扫描有 12 条原有静态反馈 API 警告。本轮未扩大范围修复这些文件，也未提交代码。

上述首次核验未完成真实 Java 后端联调，浏览器结果使用契约模拟器。当前开发环境的 nginx 后端入口通过 `.env.local` 的 `VAULT_API_TARGET` 配置；仍需在启用 vault 及匹配 HTTPS Origin/RP ID 的环境下，用测试账户验证真实 Cookie、Passkey 和密文读写，再完成真实环境恢复演练。

## 科技蓝 UI（2026-10-17）

页顶提供白天 / 夜间模式切换，首次使用时跟随系统主题，手动选择后优先采用所选模式并在刷新后保留。仅主题偏好写入浏览器本地存储；页面样式、antd 控件、弹窗和浏览器原生控件统一切换。桌面和手机均使用纯图标按钮，保留悬停提示和三语无障碍标签。

认证页使用同源玻璃锁头素材和三步进度。1024px 及以上窗口采用约 4:6 的左右比例，登录、验证、解锁及初始化显示为随窗口放大的浮层卡片；初始化文件区使用更宽的卡片，1280px 及以上并排展示两份文件，低高度窗口收紧间距，手机保持纵向布局。服务端的认证挑战决定常规验证分支；仅在服务端明确允许注册后显示首次绑定。身份恢复、新 Passkey 验证、MFA 恢复码回导确认和密码库初始化仍分别完成。

工作区采用分类、条目、详情三栏。桌面端随窗口铺开并保留 16px 外边距，列表保持适合扫描的列宽，1440px 及以上的详情和编辑字段按两列排列；列表与详情分别滚动。手机以列表、详情、编辑逐层进入。搜索继续使用 Worker 索引，详情中的密码与备注按明确操作解密，20 秒后隐藏，切条目、切后台和锁定立即隐藏，并丢弃迟到的查看结果。新增与编辑在右侧面板进行；未保存关闭需确认，冲突保留草稿，网络结果不明时复用相同密文和幂等键重试。复制使用真实剪贴板，拒绝时提供限时的手动选择区域。三语文案与系统深色模式同时维护。

普通锁定继续销毁 Worker，因此锁定及刷新后都需要重新导入账户密钥；没有启用设计原型中“同标签页免导入”的说明。开发与生产锁定时长均读取 `config/autoLock.ts`。当前条目协议未返回更新时间，“最近更新”暂不可用；不使用条目版本号推测跨条目的时间顺序。密码库内容恢复、完整密钥轮换与加密备份已通过页顶「密码库管理」入口开放。

本地浏览器回归使用契约接口夹具与虚构材料，执行实际 Worker、Argon2id、Web Crypto、WebAuthn 虚拟认证器、文件导出和重新导入。检查 2560、1920、1440、1366、1024、736、375、320 像素宽度及深色模式，包括 1366×768 的初始化文件布局。测试与截图位于被忽略的 `tests/`、`test-results/`，不加入 Git。真实环境仍需用测试账户完成 Cookie、Passkey 和密文写入的后端联调。

## 内容版本、TOTP 与管理流程（2026-10-17）

数据写请求统一附带 `X-Vault-Item-Schema-Version: 2`；认证请求和 GET 不带此头。元数据必须声明支持的密文格式、算法、KDF 档案、可读 schema 和最低写入版本。旧六字段密文仅在读取时补齐 `totp=null`，保存时升级到 v2；未知字段或版本拒绝解析重写。普通查看和编辑入口均不返回已存种子；编辑其他字段时由 Worker 保留原 TOTP，替换或删除需显式确认。

TOTP 支持 SHA1/SHA256/SHA512、6/8 位、30/60 秒以及 16–128 字节 Base32 种子。手动输入、otpauth URI 和本地 PNG/JPEG/WebP 二维码均不上传。二维码解码库固定为 `jsqr@1.4.0`，在独立 Worker 中执行；上限 2 MiB、单边 4096、800 万像素和 5 秒，退出编辑或锁定时中止。当前动态码只在解锁 Worker 中按需生成；主线程接收动态码和有效期，跨窗口重新计算，最多展示 20 秒，后台立即清理，刷新不延长闲置时限。

「密码库管理」在 MFA 后即可进入，即使无法正常解锁，也可使用 RK 恢复。进入管理页会锁定原工作区；后台、闲置或退出会销毁输入和 Worker。高风险操作仍由服务端检查近期 Passkey；顶部按钮可再次认证并更新 CSRF，不清除尚未提交的轮换材料。

- 备份：从一致性快照逐条验证 AEAD，生成随机 backupId/backupSalt，以 VMK 经 HKDF 派生的 HMAC 密钥认证规范清单。清单绑定身份、库、代次、元数据版本、槽摘要及按 ID 排序的逐项摘要。重新导入并验证清单和全部密文后才能用于轮换。未知内容 schema 可原样备份，但不能轮换或恢复重写。密钥文件与主密码不进入备份。
- 主密码修改：重新验证旧主密码和 AK，使用新盐与 IV 重包同一 VMK，验证后原子替换正常槽。网络失败保留同一请求和幂等键。提交后重新登录；AK/RK 文件保持有效。旧备份仍可使用旧主密码。
- 轮换与恢复：生成新 AK/RK/VMK，要求下载并回导两份新文件。每批最多 40 条以满足 1 MiB 请求上限，使用新 DEK/IV 加密。上传后下载全部暂存密文，与源内容逐项比对，再计算后端约定的 staging-manifest 摘要提交。恢复只写空账户；跨账户重新绑定 AAD，内容版本从 1 开始，TOTP 字段完整保留。提交后必须重新登录并用新文件解锁核对，不能将提交回执等同于恢复验收。
- 任务接管：首次 start 前自动下载不含秘密的 `vault-task.json`。刷新、会话撤销或响应丢失后，导入任务文件查状态。未提交时，重新提供源解锁材料、目标 AK/RK 和新主密码，经近期 Passkey 接管后继续；已接收的条目先回读，不覆盖重传。认证代次被撤销时只能取消。以服务端终态和回执判断提交结果，任务截止时间不因接管延长。

本地测试和截图保留在根忽略规则覆盖的测试目录内，不提交 Git。后端代码保持只读；浏览器契约测试不替代 Java 权限/事务验收或真实设备 Passkey 测试。

### 当前后端传输细节

普通 `/rotations/start` 明确不接受 `vaultId` 或 `itemIds`，这两个字段仅在 `/restores/start` 提交。start/resume/cancel 返回任务摘要，完整集合另查 status。当前后端 status 映射可能省略 `expectedItemCount`；客户端只在该字段缺失时使用显式 `expectedItems` 的长度，并继续严格校验去重、版本以及与源快照的逐项一致性，不据摘要数量跳过内容验证。

本次只读实连检查确认 `/vault-auth/options` 返回本地 Passkey 认证方式、CSRF 和 Secure/HttpOnly Cookie；匿名 `/meta` 返回 HTTP/JsonResult 401、`VAULT_SESSION_EXPIRED` 与 no-store。已登录写入、真实硬件 Passkey 和跨设备恢复仍需在测试账户完成，不能将契约模拟器通过记为这些真实环境验收完成。

### 本轮前端检查

2026-10-17：密码库 Biome、TypeScript、antd 专项检查、67 项单元测试、20 项 Chrome 浏览器用例及生产构建通过。覆盖独立 OpenSSL Argon2 secret 固定样本、RFC 6238 三种算法向量、旧 schema/未知结构、TOTP 编辑保留、备份篡改、跨账号重新加密、轮换暂存验证、任务密钥重新导入、真实 Worker/二维码、主密码修改、锁定、文件保管和三语窄屏。测试与辅助文件按根规则忽略，不加入 Git。

ERP 根项目 TypeScript 与生产构建通过；根 `npm run test` 未发现测试文件，不能记作业务测试通过。根 lint 仍被原有 49 项 SVG 无障碍错误阻止，antd 扫描保留原有 12 条用法警告。本次未修改这些无关代码。
