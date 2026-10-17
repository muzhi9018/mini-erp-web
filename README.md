<h1 align="center">Ant Design Pro</h1>

<div align="center">

An out-of-box UI solution for enterprise applications as a React boilerplate.

[![CI](https://github.com/ant-design/ant-design-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/ant-design/ant-design-pro/actions/workflows/ci.yml)
[![GitHub release](https://img.shields.io/github/v/release/ant-design/ant-design-pro.svg)](https://github.com/ant-design/ant-design-pro/releases)
[![Build With Utoo](https://img.shields.io/badge/build%20with-utoo-028fe4.svg)](https://utoo.land)
[![Build With Umi](https://img.shields.io/badge/build%20with-umi-028fe4.svg)](https://umijs.org/)
[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)
[![Ant Design](https://badgen.net/badge/icon/Ant%20Design?icon=https://gw.alipayobjects.com/zos/antfincdn/Pp4WPgVDB3/KDpgvguMpGfqaHPjicRK.svg&label)](https://ant.design/)

Language: English | [简体中文](./README.zh-CN.md)

<img width="1718" height="1191" alt="light theme preview" src="https://github.com/user-attachments/assets/74ad0b4a-e086-4955-8edd-9f2cff31aee8" />
<img width="1718" height="1191" alt="dark theme preview" src="https://github.com/user-attachments/assets/d4bcb7c1-42c7-4c0f-b130-1193a931f9f7" />

</div>

- Preview: https://preview.pro.ant.design
- Documentation: [docs/cheatsheet.en-US.md](./docs/cheatsheet.en-US.md)
- ChangeLog: https://github.com/ant-design/ant-design-pro/releases
- FAQ: [docs/cheatsheet.en-US.md#faq](./docs/cheatsheet.en-US.md#faq)
- **v6 Released!** — [What's new in v6](https://github.com/ant-design/ant-design-pro/releases/tag/v6.0.0)

## Features

- :bulb: **TypeScript**: A language for application-scale JavaScript
- :scroll: **Blocks**: Build page with block template
- :gem: **Neat Design**: Built on [Ant Design 6](https://ant.design/) specification
- :triangular_ruler: **Common Templates**: Typical templates for enterprise applications
- :rocket: **State of The Art Development**: Newest development stack of React 19/[Umi Max 4](https://umijs.org/)/[antd 6](https://ant.design/)/[utoopack](https://utoo.land)
- :iphone: **Responsive**: Designed for variable screen sizes
- :art: **Theming**: Customizable theme with [Tailwind CSS v4](https://tailwindcss.com/) + [antd-style](https://github.com/ant-design/antd-style)
- :globe_with_meridians: **International**: Built-in i18n solution
- :gear: **Best Practices**: Solid workflow to make your code healthy
- :1234: **Mock development**: Easy to use mock development solution
- :robot: **AI Assistant**: Built-in AI chatbot page powered by [Ant Design X](https://x.ant.design/)
- :white_check_mark: **UI Test**: Fly safely with unit and e2e tests

## Templates

```
- Welcome
- Dashboard
  - Analysis
  - Monitor
  - Workplace
- Form
  - Basic Form
  - Step Form
  - Advanced Form
- List
  - Search List (Articles/Projects/Applications)
  - Table List
  - Basic List
  - Card List
- Profile
  - Basic Profile
  - Advanced Profile
- Result
  - Success
  - Fail
- Exception
  - 403
  - 404
  - 500
- Account
  - Account Center
  - Account Settings
- AI Assistant
- User
  - Login
  - Register
  - Register Result
```

## Usage

### Get Started

Clone or download this repository to your local machine:

```bash
git clone --depth=1 https://github.com/ant-design/ant-design-pro.git myapp
cd myapp
```

### Installation

```bash
npm install
```

### Backend addresses

Copy the address-free template before starting the app:

```bash
cp .env.example .env.local
```

Set actual addresses only in `.env.local` or your CI environment. All `.env` files are ignored by Git except `.env.example`. Umi loads `.env` and `.env.local`; this project uses separate variables for development and production:

| Variable | Purpose |
| --- | --- |
| `DEV_API_BASE_URL` | ERP API base URL during development, including any gateway path |
| `API_BASE_URL` | ERP API base URL for production builds |
| `CHAT_API_URL` | Chat API endpoint |
| `DEV_VAULT_SITE_URL` / `VAULT_SITE_URL` | Independent vault HTTPS site in development / production |
| `TEST_API_PROXY_TARGET` / `PRE_API_PROXY_TARGET` | Optional proxies for `start:test` / `start:pre` |
| `DEV_CLIENT_ID` / `DEV_CLIENT_BASIC_TOKEN` | Optional development client values; browser configuration cannot protect secrets |
| `ANALYTICS_ID` | Optional Google Analytics ID; analytics is disabled when empty |

An explicitly empty API base URL uses same-origin requests; configure your web server to forward the API paths. Production builds reject a missing `API_BASE_URL` rather than using a development address. Set `DEV_API_BASE_URL` to empty when using the test/pre proxy. The vault app has its own [environment template](./vault-web/.env.example) and [setup instructions](./vault-web/README.md).

Restart the development server or rebuild after changing variables. For CI builds, inject the production variables through the CI platform and do not copy local development environment files. Umi's local files override variables with the same names. Browser requests and bundled addresses remain visible to site visitors; environment files keep real addresses out of the repository. Earlier commits retain previously committed values unless Git history is separately cleaned.

### Development

```bash
# Start development server (full version by default)
npm start
```

在本仓库根目录也可以启动 ERP 和个人密码库：

```bash
# 同时启动 ERP（8000）和密码库（8002），Ctrl+C 同时停止
npm run dev:all

# 或分开启动（使用两个终端）
npm run dev
npm run dev:vault
```

ERP 访问 `http://localhost:8000`，开发环境中的“个人密码库”入口由 `.env.local` 的 `DEV_VAULT_SITE_URL` 配置。ERP 的 Utoopack 开发服务使用 `8000` 和内部端口 `8001`，密码库使用 `8002`。密码库通过现有 NGINX 提供 HTTPS，首次配置和独立依赖安装见 [vault-web/README.md](./vault-web/README.md)。启动 `dev:all` 前先停止已在运行的 ERP 或密码库服务；任一服务退出时，启动脚本会同时停止另一项服务。

Ctrl+C 会清理本次启动的全部 Umi 子进程，包括配置热重启后派生的服务；仍未退出的进程会在 3 秒后强制结束。

若 ERP 启动时报 `TurbopackInternalError`，并包含 `tailwind.css.css`、`read was canceled`，可能是旧的 Umi / Utoopack 构建缓存恢复了已取消的任务。先停止所有前端开发进程，再在项目根目录清理生成缓存并重新启动：

```bash
rm -rf .turbopack src/.umi
npm run dev:all
```

清理后首次启动需要重新编译。只有遇到该缓存错误时才需要清理。

### Simplify to Simple Version

This project includes all blocks by default. If you need a minimal version, run:

```bash
npm run simple
```

This will:
- Remove extra page directories (dashboard, form, list/*, profile, result, exception, account, etc.)
- Remove extra mock files
- Replace routes with simple version
- Remove extra dependencies from package.json

**Note**: This operation is irreversible and will permanently delete files.

### Build

```bash
npm run build
```

## AI Skills (Claude Code)

This project ships with two built-in [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills) in `.claude/skills/`:

| Skill | Trigger | Description |
|---|---|---|
| `/pro-upgrade` | "upgrade pro", "update to latest" | Auto-upgrade to the latest Ant Design Pro version. Diffs the latest template, merges framework changes while preserving your business code. |
| `/antd` | antd-related code or questions | Query antd component APIs, props, tokens, demos; lint for deprecated usage; migrate between versions — all via `@ant-design/cli`. |

**Usage in Claude Code:**

```bash
# Upgrade the project to latest Pro version
/pro-upgrade

# Query antd component info, debug issues, run lint, etc.
/antd
```

> 💡 If your project was cloned from this repo, these skills are already included — no installation needed. To get the latest skill definitions, pull the updates from the template or run `npx skills add ant-design/ant-design-pro` to refresh them.

## Browsers support

Modern browsers.

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari |
| --- | --- | --- | --- |
| Edge | last 2 versions | last 2 versions | last 2 versions |

## Contributing

Any type of contribution is welcome, here are some examples of how you may contribute to this project:

- Use Ant Design Pro in your daily work.
- Submit [issues](http://github.com/ant-design/ant-design-pro/issues) to report bugs or ask questions.
- Propose [pull requests](http://github.com/ant-design/ant-design-pro/pulls) to improve our code.

<a href="https://openomy.app/github/ant-design/ant-design-pro" target="_blank" style="display: block; width: 100%;" align="center">
  <img src="https://openomy.app/svg?repo=ant-design/ant-design-pro&chart=bubble&latestMonth=3" target="_blank" alt="Contribution Leaderboard" style="display: block; width: 100%;" />
</a>
