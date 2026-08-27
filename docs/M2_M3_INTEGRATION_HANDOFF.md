# Member 2 and Member 3 Integration Handoff

## 1. Integration Overview

The Port Monitoring System backend is divided into two connected areas.

### Member 2 — Backend and API

Member 2 is responsible for:

- FastAPI application setup
- API routing
- Request and response schemas
- Input handling
- HTTP error handling
- Calling database and prediction services
- Providing data to the frontend
- API documentation and tests

### Member 3 — Database, Data Quality and Prediction

Member 3 is responsible for:

- PostgreSQL database design
- SQLAlchemy models
- Alembic migrations
- Database constraints and indexes
- Seed data
- Data-quality validation
- Formula-based prediction
- Buffer-risk rules
- Berth-conflict rules
- Dashboard query service
- Calculation and service tests

## 2. Shared Database Connection

Member 2 imports the database dependency from:

```python
from app.database.session import get_db