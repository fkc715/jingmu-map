# Jingmu Map

Jingmu Map is a personal theatre discovery and theatre-going journal project focused on Beijing.

The first goal is to build a minimal map of Beijing districts, mark theatre locations, and let users explore theatres through simple interactions. Later versions will add private theatre-going records, ticket or poster uploads, theatre visit statistics, and yearly summary reports.

## Product Direction

This project is not intended to be a ticketing platform, public review community, or event aggregation service. The early product direction is:

- A lightweight Beijing theatre map
- A private theatre-going journal
- A personal archive for tickets, posters, notes, and visit counts
- A future basis for yearly theatre reports

Keeping the product personal and record-oriented should make the first versions easier to build, review, and maintain.

## Planned Stack

- Backend: Go
- Web and mini program frontend: Node.js ecosystem
- Initial frontend direction: Taro + React, or separate React web and WeChat mini program if needed
- Database: SQLite for early local development, PostgreSQL or MySQL for production
- Image storage: object storage such as Tencent Cloud COS or similar

## Repository Plan

The repository may evolve toward this structure:

```text
apps/
  web/
  miniprogram/
services/
  api/
packages/
  shared/
docs/
  product.md
  roadmap.md
```

## Current Status

This repository is at the planning stage. The first milestone is to create a simple clickable Beijing theatre map prototype and use it to validate the core experience.

