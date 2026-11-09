# Tech stack

Approved only where this file says accepted. Nothing here is installed yet.

## Accepted

| Layer | Choice | Why |
| --- | --- | --- |
| UI | React, TypeScript, Vite | The dashboard is a web app used from a phone and a computer. |
| Style | Tailwind CSS | Shared spacing, type, and both themes. |
| Motion | `motion` imported from `motion/react` | The orbit and later expand/press motion. Install name is `motion`. |
| Forms | React Hook Form and Zod | Inline validation before a statement or payment is saved. |
| API | Python, FastAPI | Money logic stays on the server in `Decimal`. |
| Database | PostgreSQL | Hosted, multi-device, backed up. Not SQLite. |
| Money | Integer paise in the database | Avoids binary float error. |
| Tests | Vitest, React Testing Library, pytest | Synthetic fixtures only. Playwright is optional and not approved yet. |
| Lint | TypeScript strict, ESLint, Ruff | Catch type and style issues in CI. |

## Not accepted yet

- Hosting provider.
- Icon set. Lucide was proposed. It is a common default, so it waits for a written reason in the design notes before it is added.
- ORM and migrations. SQLAlchemy and Alembic are the likely pair once the schema in `specs/data-model.md` is approved.

## Rejected

- Browser-only storage as the real database.
- Payment gateway SDKs.
- OpenWA and any WhatsApp client.
- Putting secrets in `VITE_` variables.
