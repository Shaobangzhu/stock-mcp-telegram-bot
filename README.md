# Stock MCP Telegram Bot

A U.S. stock unusual-movement monitoring bot built with NestJS, Prisma, PostgreSQL, and Docker.

## Project Status

This project is currently in MVP bootstrap phase.

Phase 0 has established:

- NestJS project skeleton
- environment variable loading and validation
- Dockerized PostgreSQL
- Prisma initialization and first migration
- Prisma module integration
- `/health` endpoint with database connectivity check

## Tech Stack

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Docker Compose

## Prerequisites

Make sure you have installed:

- Node.js
- npm
- Docker Desktop

## Environment Variables

Create a local `.env` file based on `.env.example`.

Example:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/stock_agent?schema=public
```

## Start PostgreSQL

```bash
docker compose up -d
```

Check container status:

```bash
docker compose ps
```

## Start the Application

```bash
npm install
npm run start:dev
```

The app should start on:

```bash
http://localhost:3000
```

## Health Check

Verify the service health

```bash
http://localhost:3000/health
```

Expected response example

```json
{
  "status": "ok",
  "timestamp": "2026-04-14T21:44:01.270Z",
  "database": "up"
}
```

## Prisma Commands

Generate Prisma client:

```bash
npx prisma generate
```

Run database migration:

```bash
npx prisma migrate dev --name init
```

## Current Scope

Current Phase 0 scope includes only the project foundation.

Not included yet:

- watchlist management
- quote ingestion
- anomaly detection
- Telegram notification
- news ingestion
- scheduler jobs
