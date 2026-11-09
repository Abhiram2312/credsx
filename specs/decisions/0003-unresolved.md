# ADR 0003: Still open

## Status

Open. Do not treat these as decided.

## Google sign-in

Google Sign-In stays required. The server checks the identity and allows only one configured email. That email has not been provided. Do not invent one, and do not ship an open registration form.

## Hosting

Mobile and desktop access over HTTPS is required. The app is a private repository.

Not selected:

- Managed application host plus managed PostgreSQL. This is the recommendation, because the app is a web API and a database, with no WhatsApp process to keep alive.
- A single VPS that runs the API and Postgres.

Either choice must provide HTTPS, secret storage, backups, health checks, and a rollback. GitHub Actions runs lint, types, and tests on pull requests with synthetic data. Production deploy waits for a separate approval. No provider name is chosen here.

## Prototype files

`index.html`, `styles.css`, and `orbit.js` are a visual prototype of the orbit. They are not the application. The ring motion stays. The words describe this ledger.
