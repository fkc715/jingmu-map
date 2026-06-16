# Jingmu API Contract

The first backend phase serves theatre data from SQLite. Personal records,
states, uploads, and calendar endpoints are reserved so the frontend can prepare
integration points without requiring login or object storage yet.

The theatre data model is split into two layers:

- `theatres`: official default theatre records, including default images.
- `user_theatre_profiles`: per-user overrides for editable theatre fields.

After login is introduced, a first-time user should read the default theatre
record. Once they edit a theatre, the API should merge their personal override on
top of the default record.

Base URL for local development:

```text
http://localhost:8080
```

## Ready Endpoints

### GET /healthz

Returns service health.

```json
{ "status": "ok" }
```

### GET /api/v1/theatres

Returns theatre points in the same lightweight shape currently used by the web
map JSON.

Query parameters:

- `district`: optional district name, for example `东城区`.

Response:

```json
{
  "version": "db",
  "coordinateSystem": "WGS84",
  "theatres": [
    {
      "id": "capital-theatre",
      "name": "首都剧场",
      "district": "东城区",
      "address": "北京市东城区王府井大街22号",
      "value": [116.4111, 39.9228],
      "sourceCoordinateSystem": "WGS84",
      "size": 12,
      "intro": "北京人民艺术剧院重要演出场所，以话剧演出和经典剧目闻名。",
      "image": "",
      "source": "WGS84 seed, verify with compliant coordinate source before production."
    }
  ]
}
```

### GET /api/v1/theatres/{id}

Returns one theatre in the same shape as a list item.

## Reserved Endpoints

These endpoints return `501 planned_endpoint` for now. They document the future
contract but intentionally avoid login, upload storage, and user-specific logic
in phase one.

### User Theatre Profile Overrides

```http
PATCH /api/v1/theatres/{id}/profile
DELETE /api/v1/theatres/{id}/profile
```

Planned request shape:

```json
{
  "name": "我常去的首都剧场",
  "district": "东城区",
  "address": "北京市东城区王府井大街22号",
  "value": [116.4111, 39.9228],
  "sourceCoordinateSystem": "WGS84",
  "size": 12,
  "intro": "自己的备注版本",
  "image": "https://example.com/my-capital-theatre.jpg"
}
```

Fields should be optional. Missing fields continue to fall back to the official
default theatre record. `DELETE` removes the user's override and restores the
default name, intro, address, coordinates, marker size, and image.

Planned merged response shape:

```json
{
  "id": "capital-theatre",
  "name": "我常去的首都剧场",
  "district": "东城区",
  "address": "北京市东城区王府井大街22号",
  "value": [116.4111, 39.9228],
  "sourceCoordinateSystem": "WGS84",
  "size": 12,
  "intro": "自己的备注版本",
  "image": "https://example.com/my-capital-theatre.jpg",
  "source": "user override",
  "profileSource": "user"
}
```

For users without an override, `profileSource` should be `default`.

### Theatre State

```http
GET /api/v1/theatres/{id}/state
PATCH /api/v1/theatres/{id}/state
```

Planned state shape:

```json
{
  "theatreId": "capital-theatre",
  "visitedCount": 6,
  "favorite": true,
  "wantToGo": false,
  "note": "常看话剧"
}
```

### Visit Records

```http
GET /api/v1/visits
POST /api/v1/visits
GET /api/v1/visits/{id}
PATCH /api/v1/visits/{id}
DELETE /api/v1/visits/{id}
```

Planned visit shape:

```json
{
  "id": "visit_20260608_chaguan",
  "theatreId": "beijing-poly-theatre",
  "title": "茶馆",
  "visitedAt": "2026-06-08",
  "seat": "二层中区",
  "rating": "好",
  "note": "视野稳定，散场后东四十条方向更顺。",
  "status": "complete"
}
```

`rating` currently uses text placeholders: `好`, `一般`, `不好`. The frontend
marks this code path so the placeholders can later be replaced by emoji assets.

### Visit Stats

```http
GET /api/v1/visit-stats
```

Response:

```json
{
  "totalRecords": 3,
  "linkedTheatres": 2,
  "todoRecords": 1,
  "uploadedImages": 2,
  "theatreVisitCount": {
    "capital-theatre": 1
  }
}
```

### Uploads

```http
POST /api/v1/uploads
GET /api/v1/uploads/{id}
GET /uploads/{file}
```

Planned upload metadata shape:

```json
{
  "id": "upload_01",
  "visitId": "visit_20260608_chaguan",
  "theatreId": "beijing-poly-theatre",
  "fileName": "ticket.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 245760,
  "publicUrl": "/uploads/upload_01.jpg",
  "status": "pending"
}
```

The actual binary storage target is intentionally deferred. Later versions can
switch this to object storage pre-signed URLs and content safety checks.

### Calendar

```http
GET /api/v1/calendar?month=2026-06
GET /api/v1/calendar/days/2026-06-08
PATCH /api/v1/calendar/days/2026-06-08
```

Planned calendar shape:

```json
{
  "month": "2026-06",
  "days": [
    {
      "date": "2026-06-08",
      "visits": [
        {
          "id": "visit_20260608_chaguan",
          "title": "茶馆",
          "theatreId": "beijing-poly-theatre",
          "theatreName": "北京保利剧院"
        }
      ]
    }
  ]
}
```
