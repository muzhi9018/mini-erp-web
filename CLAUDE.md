# 项目开发规范

## 项目与运行环境

Ant Design Pro — 基于 Umi Max v4、antd v6 和 ProComponents v3 的 React 企业级项目脚手架。

- **TypeScript 严格模式**
- **Node ≥ 22**
- **使用 `package-lock.json`**，不使用 yarn/pnpm

## 修改边界与生成文件

- **禁止修改后端 Java 项目的代码** — 后端项目路径为 `/Users/muzhi/WorkSpace/PersonalProject/Java/mini-erp-api`
- **禁止编辑 `src/services/ant-design-pro/`** — 该目录由工具自动生成，请使用 `npm run openapi` 重新生成
- **`.umi` 目录由工具自动生成** — 如果开发服务器出现异常，删除 `src/.umi` 后重启

## 页面与国际化规范

### 页面文件与模拟数据

页面代码放在 `src/pages/` 中。每个页面目录以 `index.tsx` 为入口，可包含页面专属组件、样式、`_mock.ts` 和页面私有类型文件 `data.d.ts`。

模拟数据放在 `mock/`（全局）或 `src/pages/**/_mock.ts`（与页面放在同一目录），使用 Express 风格的处理函数。

### 国际化配置

国际化配置统一放在 `src/locales/` 中。

- 当前支持 3 种语言：`zh-CN`（简体中文）、`zh-TW`（繁体中文）、`en-US`（英语）。
- 每个页面都必须在这 3 种语言目录下分别配置对应的国际化文件，路径为 `src/locales/{语言编码}/{页面名称}.ts`，同一页面在各语言目录下的文件名保持一致。
- 例如：`src/pages/system-manage/user-manage/index.tsx` 对应 `src/locales/{语言编码}/systemUserManager.ts`。
- 新增或修改页面文案时，必须同步维护 3 种语言的配置，并保持国际化键一致。
- 新增配置文件后，需在对应的 `src/locales/{语言编码}.ts` 中导入并合并导出。
- 页面文案使用 `useIntl().formatMessage({ id, defaultMessage })`，其中 `id` 对应页面国际化配置文件中的键。

### 样式优先级

Tailwind CSS v4（布局）→ antd-style v4 / `createStyles`（主题设计令牌）→ CSS Modules → Less（仅限遗留代码）。

## 后端服务与接口类型规范

### 服务目录与模块划分

HTTP 后端接口调用文件及接口类型文件统一放在 `src/services/` 中。必须按业务模块创建目录，再按子模块拆分接口文件；接口调用及接口类型不放在页面目录中。

例如，系统管理模块使用 `src/services/system/` 目录：

```text
src/services/system/
├── locale.ts       # 调用后端 locale 相关接口
├── attachment.ts   # 调用后端附件相关接口
└── typings.d.ts    # 系统管理模块的接口类型定义
```

### HTTP 调用

**后端接口统一通过 `src/services/httpClient.ts` 调用**。业务服务文件从 `@/services/httpClient` 导入请求方法，不直接使用 `request`、`fetch` 或 axios 发起请求。

| 请求类型 | 方法 |
| --- | --- |
| GET 请求 | `doGet` |
| POST 请求 | `doPost` |
| 表单提交 | `doPostFrom`（沿用当前导出名称） |

底层基于 `@umijs/max` 的 `request`，全局请求配置位于 `src/requestErrorConfig.ts`。

### 接口类型与命名空间

各模块的接口类型统一放在该模块的 `typings.d.ts` 中，并使用与模块对应的命名空间。系统管理模块使用 `declare namespace System`，页面及服务通过 `System.Attachment`、`System.SystemLocale` 等名称引用类型。例如：

```ts
declare namespace System {
  type Attachment = {
    id: number | string;
    originalName: string;
    contentType: string;
    fileSize: number;
    objectKey: string;
    previewUrl: string;
  };

  type SystemLocale = {
    id: number;
    code: string;
    name: string;
    nativeName: string;
    defaultLocal: boolean;
  };
}
```

## 框架配置与运行机制

### 配置与约定文件

配置文件及 `src/` 下的约定文件：

| 文件 | 用途 |
| --- | --- |
| `config/config.ts` | 使用 defineConfig 定义项目配置 |
| `config/routes.ts` | 声明式路由 |
| `app.tsx` | 运行时配置 + `getInitialState` |
| `access.ts` | 权限 |
| `global.tsx` | 全局初始化，当前用于引入全局样式 |
| `loading.tsx` | 加载组件 |
| `typings.d.ts` | 类型声明 |

路由的 `name` 对应 `menu.xxx` 国际化键；`access` 字段控制可见性。

### 身份认证与权限

`getInitialState()` → `GET /api/currentUser`；返回 401 时跳转到登录页。`access.ts`：`canAdmin = currentUser.access === 'admin'`。模拟登录的账号/密码：`admin`/`ant.design` 或 `user`/`ant.design`。

### 状态管理

通过 `useModel('filename')` 使用全局 Hook（`src/models/`）。通过 `useModel('@@initialState')` 获取 currentUser/settings。大多数数据加载使用 ProTable 的 `request` 属性。复杂的服务端状态使用 `@tanstack/react-query`。

### Cloudflare Worker

`cloudflare-worker/` 是独立的 Hono 应用，有自己的 `package.json`，不属于 npm 工作区。

## 命令与提交要求

### 测试文件命名与 Git 管理

- 单元测试、组件测试和集成测试统一命名为 `<被测文件名>.test.<扩展名>`，例如 `httpClient.test.ts`、`CategoryForm.test.tsx`、`dev-processes.test.mjs`；扩展名与使用的语言和模块格式保持一致。
- 端到端测试统一命名为 `<业务场景名>.e2e.ts`，放在所属项目的 `tests/` 目录中，例如 `vault-web/tests/browser/vault.e2e.ts`。
- 新增测试不再使用 `.spec.*` 或其他临时命名。已有 `.spec.*` 文件由忽略规则兼容，修改时再按上述规范命名，并同步更新测试配置或命令中的路径。
- 测试辅助脚本、fixtures 等放在所属项目的 `tests/` 或 `__tests__/` 目录中；快照放在 `__snapshots__/` 中。
- **测试文件及其辅助文件、快照、覆盖率和测试报告仅保留在本地，不加入 Git 管理**。根目录 `.gitignore` 统一维护忽略规则，适用于子项目；禁止使用 `git add -f` 强制添加这些文件。
- 创建或重命名测试后，使用 `git check-ignore -v <文件路径>` 确认已被忽略。已跟踪的测试需要使用 `git rm --cached -- <文件路径>` 取消跟踪并保留本地文件，仅修改 `.gitignore` 不会取消已有跟踪。
- 测试运行配置和 npm 测试命令仍纳入 Git 管理。

### 开发与维护命令

| 命令 | 用途 |
| --- | --- |
| `npm start` | 开发模式 + 模拟数据 |
| `npm run dev` | 开发模式，不使用模拟数据 |
| `npm run build` | utoopack 构建 |
| `npm run openapi` | 重新生成 `src/services/` |
| `npm run simple` | **不可逆操作，执行前务必先提交或创建分支** |
| `npm run biome` | 自动修复 |

### 检查与提交

**仅使用 Biome**，不使用 ESLint 或 Prettier。

| 命令 | 用途与要求 |
| --- | --- |
| `npm run lint` | Biome + tsc 检查；**提交前必须通过** |
| `npx antd lint ./src` | antd 专项检查，检查已弃用或存在问题的用法；**提交前必须通过** |
| `npm run tsc` | 仅检查类型 |
| `npm run test` | Jest 测试 |

提交信息必须遵循 **Conventional Commits（约定式提交）** 规范，由 commitlint 强制检查。

## AI 技能

本项目内置两个 Claude Code 技能（`.claude/skills/`）。如果项目中已有这些技能，无需安装，直接运行即可。要更新到最新的技能定义，请执行 `npx skills add ant-design/ant-design-pro`。

### `/antd` — Ant Design 开发

处理任何 antd 相关任务时，在 Claude Code 中运行 `/antd`。它提供 `@ant-design/cli` 的使用能力，并包含 antd v3/v4/v5/v6 的离线元数据。

- **编写 antd 代码前，必须先执行 `npx antd info <Component>`** 查询属性/API，不要凭记忆猜测。
- `npx antd demo <Component> <demo>` — 获取可运行的代码示例。
- `npx antd migrate <from> <to>` — 获取跨主版本迁移的检查清单。

antd 专项检查及提交要求见“命令与提交要求”。

### `/pro-upgrade` — 项目升级

在 Claude Code 中运行 `/pro-upgrade`，可自动将项目升级到最新的 Ant Design Pro 版本。它会比较最新模板与当前项目的差异，在保留业务代码的同时合并框架变更。支持任意版本跨度（如 v5→v6、v6.x→最新版等）。

## 编码与执行原则

以下行为准则旨在减少大语言模型常见的编码错误，可与项目专属规范结合使用。**这些准则更重视谨慎，而非速度；对于简单任务，请自行判断。**

### 先思考，再编码

**不要擅自假设。不要隐瞒疑惑。明确说明取舍。**

实现之前：

- 明确说明你的假设。不确定时，先提问。
- 如果存在多种理解，请列出来，不要默默选定一种。
- 如果有更简单的方法，请说明。必要时提出异议。
- 如果有不清楚的地方，先停下来。指出疑惑，并提问。

### 简单优先

**用最少的代码解决问题。不做推测性的设计。**

- 不添加需求之外的功能。
- 不为只使用一次的代码引入抽象。
- 不添加未经要求的“灵活性”或“可配置性”。
- 不为不可能出现的场景添加错误处理。
- 如果写了 200 行，而 50 行就能实现，请重写。

问自己：“资深工程师会认为这过于复杂吗？”如果会，就简化。

### 精准修改

**只修改必要的部分。只清理自己造成的问题。**

编辑现有代码时：

- 不要顺手“改进”相邻的代码、注释或格式。
- 不要重构没有问题的代码。
- 遵循现有风格，即使你原本会采用不同写法。
- 如果发现无关的无用代码，请指出，不要删除。

当你的修改导致代码不再被使用时：

- 删除因你的修改而不再使用的导入、变量或函数。
- 除非用户要求，否则不要删除原本就存在的无用代码。

判断标准：每一行修改都应能直接对应用户的需求。

### 目标驱动执行

**定义成功标准。反复执行，直到验证通过。**

将任务转化为可验证的目标：

- “添加校验” → “为无效输入编写测试，然后让测试通过”
- “修复缺陷” → “编写能复现缺陷的测试，然后让测试通过”
- “重构 X” → “确保重构前后测试均通过”

对于多步骤任务，请列出简要计划：

```text
1. [步骤] → 验证：[检查项]
2. [步骤] → 验证：[检查项]
3. [步骤] → 验证：[检查项]
```

明确的成功标准能让你独立迭代。模糊的标准（如“让它能用”）则需要不断澄清。

**这些准则有效的表现是：** 差异中不必要的修改更少，因过度复杂而返工的情况更少，澄清问题发生在实现之前，而不是出错之后。
