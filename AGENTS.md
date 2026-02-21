# AGENTS.md

Read **COMPASS_PRINCIPLE.md** to understand the principles of the system. That document outranks plans, tickets, and TODOs.

---

## Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Database:** PostgreSQL 16 via Docker (one container per worktree)
- **ORM:** Prisma 7 with `@prisma/adapter-pg`
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York style, Lucide icons)
- **AI:** Vercel AI SDK (`@ai-sdk/anthropic`, `@ai-sdk/openai`)

---

## Worktree Setup

Each git worktree gets its own isolated Postgres container on a unique port derived from the directory path. This prevents schema/data conflicts across branches.

### First-time setup

```bash
npm run setup
```

This will:
1. Start a Docker Postgres container unique to this worktree
2. Create `.env.local` with the correct `DATABASE_URL`
3. Install npm dependencies (`npm ci`)
4. Run Prisma migrations and generate the client

### Prerequisites

- **Node.js 24+** (see `.node-version`)
- **npm 11+**
- **Docker** (Docker Desktop must be running)

### Common commands

| Command              | Description                              |
|----------------------|------------------------------------------|
| `npm run setup`      | Bootstrap the worktree (idempotent)      |
| `npm run dev`        | Start Next.js dev server                 |
| `npm run build`      | Production build                         |
| `npm run lint`       | Run ESLint                               |
| `npm run db:migrate` | Create/apply a new Prisma migration      |
| `npm run db:deploy`  | Apply pending migrations (no prompt)     |
| `npm run db:studio`  | Open Prisma Studio                       |
| `npm run db:reset`   | Reset database (destructive)             |
| `npm run generate`   | Regenerate Prisma client                 |
| `npm run teardown`   | Stop and remove this worktree's Postgres |

### Teardown

```bash
npm run teardown          # remove container + data
npm run teardown -- --keep  # stop container but preserve data
```

---

## Project Structure

```
src/
  app/               # Next.js App Router pages + API routes
    api/             # Route handlers (REST endpoints)
    journal/         # Journal entry pages
    resolutions/     # Resolution pages
    dashboard/       # Dashboard page
    review/          # Review page
    settings/        # Settings page
  actions/           # Server actions
  components/
    ui/              # shadcn/ui primitives (button, card, input, badge, sheet, switch, etc.)
    features/        # Feature-specific components
    layout/          # Layout components (AppHeader)
  lib/
    ai/              # AI provider config, prompts, analysis
    db/              # Prisma client singleton
    queue/           # Background analysis queue
prisma/
  schema.prisma      # Database schema
  migrations/        # Migration history
scripts/
  setup.sh           # Worktree bootstrap
  teardown.sh        # Worktree cleanup
```

---

## Key Patterns

- **Database client:** Use `prisma` from `@/lib/db/client` — never instantiate `PrismaClient` directly.
- **Server actions:** Prefer server actions in `src/actions/` for mutations over API routes.
- **Path aliases:** `@/*` maps to `./src/*`.
- **Environment:** `.env.local` is the active env file (`.env.example` is the template).

---

## UI Components (shadcn/ui)

The project uses [shadcn/ui](https://ui.shadcn.com) for all UI primitives. Configuration lives in `components.json` (New York style, neutral base color, CSS variables enabled).

### Adding new components

```bash
npx shadcn@latest add <component-name>
```

This generates the component into `src/components/ui/`. Components are **owned code** — feel free to modify them.

### Installed components

`alert`, `badge`, `button`, `card`, `input`, `label`, `progress`, `radio-group`, `separator`, `sheet`, `slider`, `switch`, `textarea`

### Conventions

- **Import from lowercase files:** `import { Button } from '@/components/ui/button'`
- **Use `cn()` for class merging:** `import { cn } from '@/lib/utils'` — always use this instead of string concatenation for Tailwind classes.
- **Icons:** Use [Lucide React](https://lucide.dev) (`lucide-react`) — this is shadcn's default icon library. Do not use Material Icons in new code.
- **Color tokens:** Use CSS variable-based colors (`text-foreground`, `bg-card`, `text-muted-foreground`, `border-destructive`, etc.) instead of raw Tailwind colors (`text-gray-700`, `bg-white`, etc.). This ensures theme consistency.
- **Form fields:** Pair shadcn `Input`/`Textarea` with shadcn `Label`. For errors, use the `Alert` component with `variant="destructive"`.
- **Loading states:** Use the `Loader2` icon from Lucide with `animate-spin` inside buttons.
- **Mobile navigation:** The `AppHeader` uses shadcn `Sheet` for the mobile slide-out menu.
- **Toggles:** Use shadcn `Switch` for boolean settings — do not build custom toggle components.