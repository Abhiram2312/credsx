# Implementation

No application code is in progress. The orbit files in this folder are a static prototype only.

## Milestone 0: Specifications

Record the owner's decisions and the open items. This milestone is the markdown in this folder.

## Milestone 1: Visual shell

Replace the static prototype with the React app shell: light and dark, the orbit on the first screen, keyboard focus, and a reduced-motion fan. No accounts, no database. Sample figures are not used. Empty copy explains that cards are added later.

## Milestone 2: Domain API

FastAPI models for cards, statements, and payments. Paise math, calendar dates, and the rejection of an overpayment. pytest with a fixed clock. Still no Google login and no host.

## Milestone 3: Dashboard

The owner can add a card, a statement, and a payment against the API. Outstanding, known minimums, unpaid count, and next due come from those records. Empty, loading, and error states are real.

## Milestone 4: Sign-in

Google Sign-In for the one email the owner supplies. That email is still unknown, so this milestone cannot start.

## Milestone 5: Host and CI

After a provider is chosen: private repository, GitHub Actions on pull requests, secrets in the host, backups, and a manual production approval. This file is not approval to deploy.

## Explicitly later

CSV or PDF import. Anything that contacts a bank.
