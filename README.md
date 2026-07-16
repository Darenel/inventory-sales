# Inventory Sales

Inventory Sales is a full-stack inventory, sales, and reporting system. This repository starts with a NestJS API, a React web app, and a local PostgreSQL database.

## Stack

- NestJS 11 and TypeScript for the API
- Vite, React 19, and TypeScript for the web app
- PostgreSQL 16 through Docker Compose

## Quickstart

Copy the example environment file and adjust values as needed.

```bash
cp .env.example .env
docker compose up -d
```

Install and run each app from its own folder.

```bash
cd api
npm install
npm run dev
```

```bash
cd web
npm install
npm run dev
```

## Project Layout

- `api/` contains the NestJS application.
- `web/` contains the Vite React application.
- `docker-compose.yml` runs the local PostgreSQL database.

