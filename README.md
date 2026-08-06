# Weather Report Engine

Weather Report Engine is an asynchronous job-processing system that generates historical weather reports for a city and date range.
The API receives report requests, stores report state in PostgreSQL, enqueues jobs in Redis, and a separate worker resolves geocoding + weather data from Open-Meteo and writes CSV output.

## Architecture

The application runs as two independent processes (Producer API and Worker) connected through Redis/BullMQ.

```mermaid
flowchart LR
    Client[Client] --> API[API Producer\nsrc/index.js + src/app.js]
    API -->|enqueue report job| Queue[(Redis / BullMQ)]
    Queue -->|consume job| Worker[Worker\nsrc/worker.js]
    Worker -->|read/update report| DB[(PostgreSQL / Prisma)]
    Worker -->|generate CSV| FS[(reports/*.csv)]
    Worker -->|call external APIs| Meteo[Open-Meteo]
```

## Requirements

Detailed project requirements are documented in [docs/requirements.md](docs/requirements.md).

## Stack

- Node.js + Express
- PostgreSQL + Prisma
- Redis + BullMQ + ioredis
- Open-Meteo public APIs
- Vitest + Supertest

## Data Model

The Prisma schema defines one persistent model: `Report`.

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary key (`uuid()`). |
| `city` | `String` | Yes | Requested city. |
| `startDate` | `DateTime` | Yes | Start date for historical range. |
| `endDate` | `DateTime` | Yes | End date for historical range. |
| `status` | `String` | Yes | Current report status (default `pending`). |
| `filePath` | `String?` | No | CSV file location after completion. |
| `errorMessage` | `String?` | No | Error details when processing fails. |
| `createdAt` | `DateTime` | Yes | Created timestamp. |
| `updatedAt` | `DateTime` | Yes | Auto-updated timestamp. |

## Environment Variables

| Variable | Used in | Expected format |
| --- | --- | --- |
| `DATABASE_URL` | `prisma/schema.prisma` | `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public` |
| `REDIS_URL` | `src/queues/connection.js` | `redis://...` or `rediss://...` |

The API port is currently hardcoded to `3000` in `src/index.js`.

<!-- TODO: consider making HTTP port configurable via environment variable. -->

## Prerequisites

- Node.js
- PostgreSQL
- Redis

## Installation

1. Clone the repository.

```bash
git clone <your-repo-url>
cd weather-report-engine
```

2. Install dependencies.

```bash
npm install
```

3. Create a `.env` file in the project root.

```env
DATABASE_URL="your-postgres-connection-string"
REDIS_URL="your-redis-connection-string"
```

4. Generate Prisma Client.

```bash
npx prisma generate
```

5. Run database migrations.

```bash
npx prisma migrate dev
```

## Usage

Run API (terminal 1):

```bash
npm start
```

Run Worker (terminal 2):

```bash
npm run worker
```

## reports Directory

`/reports` is the local output directory where generated CSV files are stored.

- Files are created by the worker after successful processing.
- The file path is persisted in the `Report.filePath` field.
- `GET /reports/:id/download` serves the file only when the report is `completed` and the file exists.
- This folder is generated/used at runtime, so its contents depend on executed jobs.

## Testing

```bash
npm test
```

## API Endpoints

| Method | Path | Body example | Success response | Other responses |
| --- | --- | --- | --- | --- |
| `POST` | `/reports` | `{"city":"Rio Cuarto","startDate":"2024-01-01","endDate":"2024-01-07"}` | `201` with `{ "id": "<uuid>", "status": "pending" }` | `400`, `500` |
| `GET` | `/reports/:id` | None | `200` with full report record | `404`, `500` |
| `GET` | `/reports` | None | `200` with list ordered by `createdAt desc` | `500` |
| `POST` | `/reports/:id/retry` | None | `202` with updated report | `404`, `409`, `500` |
| `GET` | `/reports/:id/download` | None | `200` CSV download (`weather-report-<id>.csv`) | `404`, `409`, `500` |

## Design Decisions

### Why API and Worker are separate processes

The API process handles fast HTTP request/response work. The worker process handles long-running tasks (geocoding, weather fetch, CSV generation). This keeps API latency low and isolates background processing.

### Why `UnrecoverableError` is used for unresolved cities

In `src/workers/reportProcessor.js`, missing report or unresolved city is treated as a non-transient failure (`UnrecoverableError`), because retries will not fix invalid business input.
Transient failures (like external API/network issues) are thrown as regular errors and can follow queue retry behavior.

### Why `filePath` is not created during HTTP request

`filePath` only exists after asynchronous job completion. The API creates a `pending` report and enqueues work; the worker later writes CSV and stores the resulting file path.

## External APIs

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Historical weather: `https://archive-api.open-meteo.com/v1/archive`
