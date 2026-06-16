# API Service

Go backend for Jingmu Map.

Phase one uses SQLite and only serves theatre data. The code also reserves API
contracts for visit records, theatre personal state, uploads, and calendar data,
but those endpoints intentionally return `501 planned_endpoint` until login,
storage, and user-specific data are introduced.

The theatre records are prepared for a default-plus-user-override model:

- `theatres` stores official default theatre content and default images.
- `user_theatre_profiles` stores a user's personal edits to a theatre.
- First-time users should see the default record. After they edit a theatre, the
  future authenticated API can merge their override on top of the default.

## Run Locally

From this directory:

```bash
go mod tidy
go run ./cmd/server
```

Default configuration:

- `JINGMU_API_ADDR`: `:8080`
- `JINGMU_DATABASE_PATH`: `data/jingmu.sqlite`
- `JINGMU_THEATRE_SEED_PATH`: `../../data/theatres/beijing-theatres.wgs84.json`

On first startup, the service creates the SQLite database and imports theatre
seed data when the `theatres` table is empty.

## Ready Endpoints

```http
GET /healthz
GET /api/v1/theatres
GET /api/v1/theatres?district=东城区
GET /api/v1/theatres/{id}

GET    /api/v1/visits
POST   /api/v1/visits
GET    /api/v1/visits/{id}
PATCH  /api/v1/visits/{id}
DELETE /api/v1/visits/{id}

GET /api/v1/visit-stats

POST /api/v1/uploads
GET  /api/v1/uploads/{id}
GET  /uploads/{file}

GET   /api/v1/calendar?month=2026-06
GET   /api/v1/calendar/days/2026-06-08
PATCH /api/v1/calendar/days/2026-06-08
```

The theatre list response keeps the same lightweight JSON shape currently used
by the web frontend, so the frontend can later replace its static import with:

```text
GET http://localhost:8080/api/v1/theatres
```

## Reserved Endpoints

The following endpoints are documented and routed, but not implemented yet:

```http
PATCH  /api/v1/theatres/{id}/profile
DELETE /api/v1/theatres/{id}/profile

GET   /api/v1/theatres/{id}/state
PATCH /api/v1/theatres/{id}/state

```

See `docs/api-contract.md` for request and response shapes.
