# ADR 0001: No WhatsApp

## Status

Accepted. The owner said WhatsApp is not needed, overriding the earlier request for OpenWA.

## Decision

The app does not integrate OpenWA or any other messaging gateway. Reminders, message preview, and no-send test mode are not features.

## Consequences

The host does not need a long-running WhatsApp session, a linked phone number, or a persistent browser profile. Tests do not mock a messaging API.
