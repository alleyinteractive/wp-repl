# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

REPL for WordPress (https://repl.alley.dev) — an online REPL that runs PHP code snippets in a WordPress environment using WordPress Playground in the browser. Built with Laravel 12 (PHP 8.4) + React 19 + Inertia.js + Vite 6.

## Commands

### Development

```bash
composer run dev          # Full dev environment (Laravel server, queue, logs, Vite)
npm run dev               # Frontend only (Vite dev server)
php artisan serve         # Laravel server only (http://localhost:8000)
```

### Build

```bash
npm run build             # Client-side build
npm run build:ssr         # Client + SSR build
```

### Testing

```bash
composer run pest         # PHP tests (Pest)
composer run pest:watch   # PHP tests with watch mode
./vendor/bin/pest --filter=TestName  # Run a single test
npm run playwright        # E2E tests (Playwright, Chromium)
npm run playwright:prod   # E2E tests against production
```

### Linting & Formatting

```bash
composer run pint         # PHP code style (Laravel Pint)
npm run types             # TypeScript type checking (tsc --noEmit)
npm run lint              # ESLint
npm run format            # ESLint fix + Prettier write
npm run format:check      # Prettier check only
```

## Architecture

### Backend (Laravel)

- **Stateless**: Sessions and CSRF are explicitly disabled in `bootstrap/app.php`. No authentication.
- **Routes** (`routes/web.php`): Three routes — home (`/`), share store (`/share` POST), share show (`/{hash}` GET).
- **Share model** (`app/Models/Share.php`): Main model. Uses a unique 10-char `hash` as route key (not `id`). Stores code, PHP version, WordPress version, multisite flag, and JSON options.
- **ShareController** (`app/Http/Controllers/ShareController.php`): Handles creating and displaying shared code snippets.
- **Spam protection**: Uses `spatie/laravel-honeypot` on share creation.
- **Database**: SQLite by default. In-memory SQLite for tests.

### Frontend (React + TypeScript)

- **Entry points**: `resources/js/app.tsx` (client), `resources/js/ssr.tsx` (SSR)
- **Main component**: `resources/js/components/playground.tsx` — split view with editor (Monaco) and output panel
- **State management**: React Context + reducer pattern in `resources/js/context/` (context.ts, reducer.ts, actions.ts, provider.tsx, hook.ts via `usePlaygroundState`)
- **Code execution**: `resources/js/hooks/use-run-code.ts` — validates code starts with `<?php`, auto-injects `wp-load.php`, runs via WordPress Playground client, tracks execution time
- **WordPress Playground**: Runs in an iframe via `@wp-playground/client`. CLI SAPI mode, networking enabled, configurable PHP/WP versions, multisite support.
- **UI components**: shadcn/ui with Radix UI primitives in `resources/js/components/ui/`
- **Path alias**: `@/*` maps to `resources/js/*`
- **Ziggy**: Provides type-safe Laravel route helpers in TypeScript

### Key Conventions

- TypeScript strict mode with ESNext target
- Prettier: single quotes, semicolons, print width 150, tab width 4
- Prettier plugins: organize-imports, tailwindcss
- Tailwind CSS 4.0 with custom theme variables defined in `resources/css/app.css`
- ESLint flat config (ESLint 9+) with React/TypeScript/Prettier integration
- Pest for PHP tests, Playwright for E2E (60s timeout, Chromium only)
- Node 24, PHP 8.4
