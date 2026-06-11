# Architecture

## Development Order

The project will follow a web-first workflow:

1. Build and debug the core interaction on the web.
2. Stabilize theatre data, map interaction, and API contracts.
3. Port or compile the stable experience to the WeChat mini program.

This keeps early iteration fast while still preserving the mini program as a first-class target.

## Frontend Direction

The frontend direction is Taro + React.

Taro is chosen because the project needs both a web version and a WeChat mini program version. React keeps the UI component model familiar and makes it easier to reuse map, theatre card, and calendar components across targets.

The early frontend structure is split into:

- `apps/web`: web-first debugging and preview surface
- `apps/miniprogram`: WeChat mini program target
- `packages/shared`: shared types, constants, and cross-platform contracts

The exact Taro workspace setup will be initialized later when code work begins.

## Backend Direction

The backend will use Go.

Early development will use SQLite because it is simple, local, and easy to version during prototype work. If the project later needs multi-user production deployment, the database can move to PostgreSQL or MySQL.

The backend service is planned under `services/api` and will eventually provide:

- Theatre data API
- User identity integration
- Personal theatre visit records
- Image upload metadata
- Content safety workflow for uploaded images
- Report data aggregation

## Map Data Direction

The Beijing district map will use simplified GeoJSON.

Simplified GeoJSON is preferred because it can represent district boundaries in a structured way, can be rendered on web and mini program surfaces, and is easier to update or transform than a hand-drawn static image.

The initial GeoJSON should be intentionally lightweight. It only needs enough detail to support a clean minimal district map, not precise cartographic rendering.

## Data Ownership

Static theatre and map seed data should live under `data`.

Application code should consume structured data instead of hard-coding theatre lists or district boundaries into UI components. This will make later updates safer and easier to review.

