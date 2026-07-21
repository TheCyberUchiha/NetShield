<div align="center">
  <img src="https://raw.githubusercontent.com/TheCyberUchiha/NetShield/main/public/Logo.png" alt="NetShield Logo" width="120" />

  <h1>🛡️ NetShield</h1>
  <p><strong>A production-grade, privacy-first website blocker built on Chrome's Manifest V3 platform.<br/>Intercepts network requests at the browser engine level — no page flash, no bypass.</strong></p>

  <br/>

  [![Built with React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
  [![Vite](https://img.shields.io/badge/Bundled_by-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
  [![Zustand](https://img.shields.io/badge/State-Zustand-FF6B35?style=for-the-badge)](https://zustand-demo.pmnd.rs)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

</div>

---

## 📖 Overview

**NetShield** is a high-performance Chrome extension engineered for deep-focus productivity and digital wellness. Unlike traditional content blockers that rely on CSS injection or DOM manipulation, NetShield operates at the **network request layer** using Chrome's native `declarativeNetRequest` API — meaning blocked sites are terminated before a single byte of content is ever loaded.

The extension is designed around three core principles:

- **Zero-trust enforcement** — A SHA-256 hashed master passkey gates all configuration changes. No passkey, no bypass.
- **Tamper resistance** — Brute-force lockout, session integrity checks, and tamper event logging prevent circumvention.
- **Minimal footprint** — The background service worker is event-driven and sleeps when idle, consuming zero CPU in standby.

---

## ✨ Feature Matrix

| Feature | Description |
|:---|:---|
| 🚫 **Declarative Blocking** | Uses Chrome's `declarativeNetRequest` engine to drop network requests natively — no page flash, no redirect loop. |
| 🔒 **Passkey Authentication** | SHA-256 hashed master passkey stored in `chrome.storage.sync`. All rule mutations require authentication. |
| 🛡️ **Brute-Force Lockout** | 5 consecutive failed auth attempts triggers a 60-second lockout — state persisted across popup reopens. |
| ⏳ **Timed Bypass Sessions** | Grant temporary, capped access windows (1–480 mins). An alarm-backed timer auto-revokes on expiry. |
| 🧩 **Bypass Timer Widget** | An injected, draggable Shadow DOM widget shows live countdown on bypassed sites with a "Lock Now" button. |
| 👻 **Event-Driven Service Worker** | Background worker is fully event-driven. Zero CPU/memory overhead when no rules are being evaluated. |
| 📋 **Structured Audit Log** | All security events (rule changes, bypass grants, failed auth, tamper attempts) are persisted to a capped event log. |
| 🔄 **Cross-Device Sync** | Domain rules and passkey hash are stored in `chrome.storage.sync` — available across all signed-in Chrome instances. |
| 🎨 **Dark-Mode UI** | A polished, dark-first popup interface built with React 18 and Tailwind CSS. |

---

## 🏗️ Architecture

NetShield follows the **Manifest V3 extension architecture** with a strict separation of responsibilities across four isolated execution contexts.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Browser                           │
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │   Popup UI      │    │   Background Service Worker      │   │
│  │  (React + TSX)  │◄──►│   (Event-driven, Manifest V3)   │   │
│  │                 │    │                                  │   │
│  │  ┌───────────┐  │    │  • declarativeNetRequest rules   │   │
│  │  │ SetupView │  │    │  • Bypass session management     │   │
│  │  │ AuthView  │  │    │  • Alarm-backed expiry timers    │   │
│  │  │ MainView  │  │    │  • Structured event logging      │   │
│  │  └───────────┘  │    │  • Message handler (IPC)         │   │
│  └────────┬────────┘    └──────────────┬───────────────────┘   │
│           │                            │                        │
│           │    chrome.storage API      │                        │
│           │    ┌───────┬───────┐       │                        │
│           └───►│ sync  │ local │◄──────┘                        │
│                │ rules │ state │                                │
│                └───────┴───────┘                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Content Script (timerWidget.ts)                        │  │
│  │   Injected into all HTTP/S pages                         │  │
│  │   • Queries bypass status via IPC                        │  │
│  │   • Injects draggable Shadow DOM countdown widget        │  │
│  │   • Handles "Lock Now" early-revoke action               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Design Patterns

| Pattern | Usage |
|:---|:---|
| **Event-Driven Architecture** | All background logic triggered by `onMessage`, `onAlarm`, and `storage.onChanged` listeners. |
| **Command Pattern** | Popup communicates with service worker via typed message objects (`addDomain`, `removeDomain`, `addBypass`). |
| **Reactive State (Zustand)** | UI state is kept in a Zustand store that subscribes to `storage.onChanged` for real-time sync. |
| **Shadow DOM Encapsulation** | The timer widget uses a closed Shadow DOM root to prevent host page styles from leaking in (or out). |
| **Defense in Depth** | Domain validation (RFC 1035 regex), scheme rejection, brute-force lockout, and audit logging form layered security. |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **UI Framework** | React 18 | Component-based popup interface |
| **Language** | TypeScript 5.5 | Full type safety across all contexts |
| **Styling** | Tailwind CSS 3 | Utility-first dark-mode design system |
| **State Management** | Zustand 4 | Lightweight reactive state synced with `chrome.storage` |
| **Build Tool** | Vite 8 + `@crxjs/vite-plugin` | HMR-enabled extension bundling with manifest injection |
| **Extension APIs** | Chrome Manifest V3 | `declarativeNetRequest`, `alarms`, `storage`, `scripting`, `tabs` |
| **Polyfill** | `webextension-polyfill` | W3C-standard browser API abstraction |
| **Crypto** | Web Crypto API (`SubtleCrypto`) | SHA-256 passkey hashing, zero external dependencies |
| **Linting** | ESLint 9 + TypeScript-ESLint | Strict code quality enforcement |

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0`
- **Google Chrome** (or any Chromium-based browser supporting Manifest V3)

### 1 — Clone the Repository

```bash
git clone https://github.com/TheCyberUchiha/NetShield.git
cd NetShield
```

### 2 — Install Dependencies

```bash
npm install
```

### 3 — Build the Extension

```bash
npm run build
```

This produces an optimized, production-ready extension bundle in the `dist/` directory.

### 4 — Load into Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder generated in the previous step

The NetShield icon will appear in your Chrome toolbar.

### 5 — Initial Setup

On first launch, NetShield will prompt you to create a **master passkey**:

- Minimum 8 characters required
- A real-time strength indicator guides you to a strong passkey
- The passkey hash is stored in `chrome.storage.sync` — **it cannot be recovered if lost**

---

## 🧑‍💻 Development

### Start Dev Server (with HMR)

```bash
npm run dev
```

The `@crxjs/vite-plugin` enables Hot Module Replacement for popup UI components during development. Reload the extension at `chrome://extensions/` after service worker changes.

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
# Report lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix
```

### Run Tests

```bash
npm test
```

### Project Structure

```
NetShield/
├── public/
│   └── Logo.png                  # Extension icon (16, 48, 128px)
├── src/
│   ├── background/
│   │   └── serviceWorker.ts      # MV3 service worker — DNR rules, IPC, logging
│   ├── block/
│   │   ├── BlockApp.tsx          # Blocked-page React component
│   │   ├── index.css
│   │   └── main.tsx
│   ├── content/
│   │   └── timerWidget.ts        # Injected bypass countdown (Shadow DOM)
│   ├── popup/
│   │   ├── App.tsx               # Root router — Setup / Auth / Main views
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── components/
│   │       ├── SetupView.tsx     # First-run passkey creation
│   │       ├── AuthView.tsx      # Passkey authentication gate
│   │       └── MainView.tsx      # Domain rule dashboard
│   ├── store/
│   │   └── useShieldStore.ts     # Zustand store with storage sync
│   └── utils/
│       ├── crypto.ts             # SHA-256 hashing + passkey strength scorer
│       ├── time.ts               # Time formatting utilities
│       └── validation.ts         # RFC 1035 domain parsing & validation
├── manifest.json                 # Chrome Extension Manifest V3 config
├── vite.config.ts                # Vite + CRXJS build configuration
├── tailwind.config.js            # Tailwind design tokens
├── tsconfig.json                 # TypeScript compiler options
└── package.json
```

---

## 🔐 Security Model

NetShield is designed with a layered security posture:

1. **Passkey Hashing**: The master passkey is never stored in plaintext. Only its `SHA-256` digest is persisted, computed entirely in-browser using the native `SubtleCrypto` API.

2. **Domain Validation**: All domain inputs are validated against an RFC 1035-compliant regex before being accepted. Dangerous schemes (`javascript:`, `data:`, `chrome://`, etc.) are explicitly rejected.

3. **Brute-Force Lockout**: After 5 consecutive failed authentication attempts, the extension enters a 60-second hard lockout. Lockout state is persisted in `chrome.storage.local` and survives popup close/reopen.

4. **Audit Trail**: All security-relevant events (rule additions, rule removals, bypass grants, failed authentication attempts) are written to a capped, structured event log (`eventLog` in `chrome.storage.local`), preserving the 500 most recent entries.

5. **Closed Shadow DOM**: The bypass timer widget is mounted inside a `{ mode: 'closed' }` Shadow DOM root, preventing host page JavaScript from accessing or manipulating the widget DOM.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feat/your-feature-name`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for all commit messages.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

<div align="center">
  <sub>Built with precision. Enforced with intent.</sub>
</div>
