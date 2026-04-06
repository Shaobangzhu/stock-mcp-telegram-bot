# Stock MCP Telegram Bot

A U.S. stock unusual-movement monitoring bot built with NestJS, TypeScript, Prisma, PostgreSQL, and Docker.

## Knowledge Base

Project planning, MVP scope, architecture blueprint, database design, and phased implementation notes are documented here:

- [Project Knowledge Base](./docs/knowledge-base.md)

## MVP Direction

The first version focuses on a minimal end-to-end loop:

- manage a stock watchlist
- fetch quotes on a schedule
- detect simple anomalies
- persist quotes, alerts, and news
- send Telegram notifications

This version intentionally excludes dashboard UI, advanced indicators, pre-market/after-hours support, and Telegram command interactions.
