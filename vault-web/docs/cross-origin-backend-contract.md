# 密码库跨域后端接入约定

前端生产包通过构建变量 `VAULT_API_BASE_URL` 直接访问独立 HTTPS API。真实地址只通过被 Git 忽略的本地环境文件或构建环境提供。本文描述 API 服务和部署网关需要满足的契约，不修改 Java 项目或正在运行的 NGINX。

## URL 与身份边界

- API Base URL 可以包含网关路径；完整请求为 Base URL 加 `/vault/auth/*` 或 `/vault/api/*`，不要在 Base URL 中重复添加 Controller 的 `/vault` 前缀。网关仅按部署约定处理额外网关路径，转发到 Java 时须保留 `/vault/auth/*` 和 `/vault/api/*`。
- `vault.origin` 必须等于浏览器中密码库页面的完整 HTTPS Origin；`vault.rp-id` 必须是该前端域名。二者不改成 API 地址。
- 继续使用独立密码库 Cookie 会话、Passkey 和 CSRF，不接受 ERP JWT 代替密码库认证。

Controller 路径迁移时，后端还须同步 `VaultPaths`、`VaultSecurityConfig` 的认证规则、`VaultSessionConfig` 的过滤器注册路径、`VaultHttpFilter` 的数据请求识别、`VaultFailureAuditServiceImpl` 的失败审计路径，以及 `reauth` 返回的 `optionsEndpoint`；只修改 Controller 注解不足以完成迁移。

## CORS

API 服务或网关应为两个密码库路径提供下列响应，并覆盖成功和错误响应：

| 项目 | 要求 |
| --- | --- |
| `Access-Control-Allow-Origin` | 仅允许已配置的密码库页面精确 Origin，不能为 `*`，也不能无条件反射任意 Origin |
| `Access-Control-Allow-Credentials` | `true` |
| 预检方法 | 无需登录或 CSRF 的 `OPTIONS`；只放行对应实际业务方法 `GET`、`POST` |
| 预检请求头 | 显式允许 `Content-Type`、`Accept-Language`、实际 CSRF header（当前为 `X-CSRF-TOKEN`）、`X-Vault-Item-Schema-Version` 和 `X-Vault-Lifecycle-Version` |
| 缓存区分 | 返回 `Vary: Origin`；预检按请求方法及请求头区分 |

携带凭据时，不能用 `Access-Control-Allow-Headers: *` 代替显式请求头列表。只有预检可以免认证，实际读写仍执行原有身份、MFA、近期认证、CSRF、Origin、归属和版本校验。保持原始业务 HTTP 状态，不把 401/403 错误重定向成 HTML。

后端现有安全链关闭了 Spring CORS，且一般密码库路径需要认证。因此需要由后端实现 CORS，或由严格配置的 API 网关处理预检和响应头；仅修改前端无法完成这个服务端步骤。

## Cookie 与前端 CSP

前端已设置 `withCredentials: true`，CSRF token 从 API 响应正文读取并随 POST 发送。

Cookie 应由 API 主机签发，保留 `__Host-` 前缀要求的 Secure、Path=/、不设置 Domain，并保留 HttpOnly。前端与 API 在同一站点的 HTTPS 子域间部署时可保留 SameSite=Lax；如果跨越不同站点，需单独核验 SameSite=None; Secure 和浏览器第三方 Cookie 策略，不能仅靠 CORS 保证会话可用。

前端服务器 CSP 的 `connect-src` 必须明确允许 API Origin，同时保持脚本、Worker 和 WASM 的原有来源限制。部署模板中的 API 占位值需按实际构建地址替换。

## 真实环境验证

1. 从密码库页面请求 options，确认浏览器接受 API Cookie 并能读取响应。
2. 检查登录、Passkey 和数据写入的预检，以及 Cookie、轮换后的 CSRF 和 schema header。
3. 对非法 Origin、错误 CSRF、未认证、旧会话和越权 ID 确认仍拒绝。
4. 验证认证提升与退出时的 Cookie 更新、Session ID 轮换和其他会话撤销。
5. 检查目标手机及浏览器的实际会话行为。自动化模拟 API 不能替代这些服务端验收。

参考：[MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)、[MDN connect-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src)。
