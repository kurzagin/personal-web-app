# kurzagin

Personal monorepo for the Kur Zagin platform, housing both the web client and mobile management applications.

> **Status:** 🚧 In Progress

- **Remote repository:** [github.com/kurzagin/personal-web-app](https://github.com/kurzagin/personal-web-app)

---

## Architecture Overview

This monorepo is organized under `apps/*`:

```text
kurzagin/
├── apps/
│   ├── web/        # Web client (consumer-only)
│   └── mobile/     # Android / Mobile app (auth & management)
├── assets/         # Shared media & static assets
├── content/        # Markdown / data content
└── scripts/        # Utility & migration scripts
```

### 1. Web (`apps/web`) — Consumer Client
- **Role:** Pure client / consumer interface.
- **Tech stack:** Next.js, React, Tailwind CSS, Turbopack.
- Designed to deliver fast, read-focused access to portfolio, writing, projects, and media without directly handling sensitive administration or user auth management.

### 2. Android / Mobile (`apps/mobile`) — Auth & Management
- **Role:** Administrative hub, authentication, and content management.
- **Tech stack:** React Native, Expo (SDK 58), TypeScript.
- Handles administrative controls, authentication flows, and operational management for the platform.

---

## Development

### Prerequisites
- Node.js >= 22.12.0
- npm (or compatible package manager)

### Commands

From the workspace root:

```bash
# Web development
npm run dev

# Mobile / Android development (Expo)
npm run mobile:start    # Start Expo Metro bundler
npm run mobile:android  # Launch Android runner

# Database & utility tasks
npm run d1:setup        # Apply schema to Cloudflare D1
npm run create-account  # Create admin account

```

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).
