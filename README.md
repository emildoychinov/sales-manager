# CSV Data Ingestion Pipeline

## Prerequisites

- Docker and Docker Compose
- Ports `3000`, `5432`, `6379`, `8000` free
- The Kaggle "Sample Sales Data" CSV: https://www.kaggle.com/datasets/kyanyoga/sample-sales-data — download `sales_data_sample.csv` and upload it via the UI

## Setup

```bash
docker compose up -d --build
```

This starts Postgres, Redis, the FastAPI backend, a Celery worker, and the frontend (Nginx).

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000         |
| Backend  | http://localhost:8000         |
| Swagger  | http://localhost:8000/docs    |
| Health   | http://localhost:8000/api/health |

Useful commands:

```bash
docker compose ps              # check status
docker compose logs -f backend # backend logs
docker compose down            # stop
docker compose down -v         # stop + remove database volume
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | register (create) user |
| POST | `/api/auth/login` | login, JWT access token |
| GET | `/api/auth/me` | current user info - in the FE it's used to check if the user is authenticated upon entry |

### Datasets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/datasets` | user datasets (paginated) |
| GET | `/api/datasets/{id}` | dataset details |
| GET | `/api/datasets/{id}/records` | dataset records with sorting/filtering (paginated) |
| GET | `/api/datasets/{id}/aggregates` | sales aggregates (accepts filters) |
| GET | `/api/datasets/{id}/statuses` | statuses for filter dropdown |
| GET | `/api/datasets/{id}/product-lines` | product lines for filter dropdown |
| GET | `/api/datasets/{id}/countries` | countries for filter dropdown |
| GET | `/api/datasets/{id}/export?fmt=csv\|parquet` | export dataset |
| POST | `/api/datasets/upload` | upload CSV |
| DELETE | `/api/datasets/{id}` | delete CSV |

Full interactive docs at `/docs` (Swagger) or `/redoc`.

## Tests

### Frontend (Vitest)
| Library | Description |
|---------|-------------|
| vitest | test runner (replaces Jest for Vite) |
| @testing-library/react | render components, query DOM |
| @testing-library/user-event | user interactions |
| @testing-library/jest-dom | matchers |
| jsdom | DOM environment so Vitest can run component tests in Node |

### Backend (pytest)
| Library | Description |
|---------|-------------|
| pytest | test runner, fixtures, discovery |
| FastAPI TestClient (httpx) | in-process HTTP requests for API integration tests |
| unittest.mock | mock Celery tasks so no Redis/worker is required |

### How to run
```bash
./run_tests.sh   # runs backend + frontend tests
```


## Assumptions

- **Dedup strategy**: duplicates are identified by `ORDERNUMBER + PRODUCTCODE`. We keep the last (latest?) occurence.
- **Null handling**: numeric columns are filled with median and object columns with mode. Rows with null `ORDERNUMBER`, `PRODUCTCODE`, or unparseable `ORDERDATE` are dropped, since these are the most logical critical fields.
- **Derived column**: `TOTAL_SALES = QUANTITYORDERED * PRICEEACH`.
- **Filtering on aggregates**: the technical requirements specify that the paginated table must have filters but don't mention chart filtering. Filters (status, product line, country, date range) are applied to both records and aggregates so the charts stay consistent with what the table shows.
- **Country filter**: not mentioned in the technical requirements but added since the charts include sales-by-country, it's a neat filtering feature.
- **Dropdown data from actual records**: status, product line, and country filter dropdowns are populated from distinct values in the dataset's records rather than hardcoded. This ensures flexibility with different CSVs.
- **Asynchronous deletion**: the technical requirements do not mention the need of deletion of files, but as a managing app this is necessary. 
- **Export formats**: CSV / Parquet are described as possible export formats. Both are available.
- **Async operations**: it is not mentioned how to do them. They are implemented on upload / delete dataset, since it's most logical. Done with Celery via tasks under a Redis worker.