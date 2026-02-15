# Feature test guide

How to run tests for all parts of the ERP platform.

## Quick run

```powershell
# Unit tests + Docker check (no builds)
.\test-all.ps1 -SkipBuild

# Full: unit tests + builds + Docker
.\test-all.ps1

# With live API smoke tests (services must be running)
.\test-all.ps1 -SkipBuild -Live
```

## What gets tested

| Area | How | Notes |
|------|-----|------|
| **erp-api** (NestJS) | `npm test` (Jest) | Uses `--passWithNoTests`; add `*.spec.ts` for real tests |
| **erp-accounting** (Spring Boot) | `mvn test` | JUnit + MockMvc; **requires Maven in PATH** |
| **erp-web** (Next.js) | `npm run build` | No test script; build verifies compile |
| **Docker** | `docker compose ps` | Full health checks: `.\test-docker.ps1` |
| **Live APIs** | Optional `-Live` | GET /health, /products (NestJS), /api/v1/health (Spring Boot) |

## Prerequisites

- **Node.js 18+** – for erp-api and erp-web
- **Maven** (optional) – for erp-accounting JUnit tests; without it, accounting tests are skipped
- **Docker** (optional) – for infra and `-Live` smoke tests

## Running services for live tests

```powershell
# Start infra + Spring Boot (no erp-api/erp-ml build)
docker compose up -d postgres keydb minio keycloak
docker compose up -d spring-boot   # needs image: build-and-run-accounting.ps1 first

# Start NestJS locally (needs DB)
cd erp-api; npm run start:dev

# Then run
.\test-all.ps1 -SkipBuild -Live
```

## Accounting tests (Maven)

The Spring Boot suite (`RestControllerTests`) covers:

- Tenants: list, get by ID, create
- Chart of accounts: list, filter by tenant, create
- Journal entries: list, filter, create
- General ledger: list, filter
- Invoices: list, filter
- Inventory: balance, movements
- Health endpoint
- 404 for invalid IDs

If you have Maven: `cd erp-accounting; mvn test`.

## Fixes applied

- **erp-api**: `npm test` now uses `--passWithNoTests` so it exits 0 when there are no `*.spec.ts` files.
- **erp-accounting**: Test class updated to use `BusinessType` and `AccountType` enums instead of strings in builders.
