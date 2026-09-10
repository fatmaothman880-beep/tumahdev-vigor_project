# Port Monitoring System — Data Dictionary

## Purpose

This document defines the shared database fields, data types, units and validation rules for the Port Monitoring System.

All cargo quantities use tonnes, operating rates use tonnes per hour, durations use minutes and timestamps include timezone information.

---

## 1. Vessels

Table name: `vessels`

| Field | PostgreSQL type | Required | Description | Validation |
|---|---|---:|---|---|
| `id` | UUID | Yes | Unique vessel identifier | Generated automatically |
| `name` | VARCHAR(150) | Yes | Vessel name | Must not be empty |
| `imo_reference` | VARCHAR(20) | No | IMO or other vessel reference | Unique when provided |
| `capacity_t` | NUMERIC(12,2) | No | Vessel capacity in tonnes | Must be greater than zero |
| `agent_name` | VARCHAR(150) | No | Vessel agent or contact person | Maximum 150 characters |
| `agent_phone` | VARCHAR(30) | No | Agent telephone number | Maximum 30 characters |
| `created_at` | TIMESTAMPTZ | Yes | Record creation time | Generated automatically |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification time | Updated automatically |

---

## 2. Berths

Table name: `berths`

| Field | PostgreSQL type | Required | Description | Validation |
|---|---|---:|---|---|
| `id` | UUID | Yes | Unique berth identifier | Generated automatically |
| `name` | VARCHAR(100) | Yes | Berth name or number | Must be unique |
| `status` | VARCHAR(20) | Yes | Current berth condition | `AVAILABLE`, `OCCUPIED`, `MAINTENANCE` |
| `created_at` | TIMESTAMPTZ | Yes | Record creation time | Generated automatically |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification time | Updated automatically |

---

## 3. Vessel Visits

Table name: `vessel_visits`

| Field | PostgreSQL type | Required | Description | Validation |
|---|---|---:|---|---|
| `id` | UUID | Yes | Unique visit identifier | Generated automatically |
| `vessel_id` | UUID | Yes | Vessel involved in the visit | Must reference `vessels.id` |
| `berth_id` | UUID | Yes | Assigned berth | Must reference `berths.id` |
| `cargo_type` | VARCHAR(100) | Yes | Type of cargo being unloaded | Must not be empty |
| `cargo_total_t` | NUMERIC(12,2) | Yes | Original cargo quantity | Must be greater than zero |
| `planned_arrival` | TIMESTAMPTZ | No | Scheduled vessel arrival | Must include timezone |
| `actual_arrival` | TIMESTAMPTZ | No | Actual vessel arrival | Must include timezone |
| `unload_start` | TIMESTAMPTZ | No | Actual unloading start time | Cannot precede actual arrival |
| `unload_end` | TIMESTAMPTZ | No | Actual unloading finish time | Must follow unloading start |
| `planned_departure` | TIMESTAMPTZ | No | Scheduled departure time | Must follow planned arrival |
| `actual_departure` | TIMESTAMPTZ | No | Actual departure time | Must follow actual arrival |
| `post_unloading_minutes` | INTEGER | Yes | Time needed after unloading before berth release | Must be zero or positive |
| `status` | VARCHAR(20) | Yes | Current visit status | `PLANNED`, `ARRIVED`, `UNLOADING`, `COMPLETED`, `DEPARTED`, `CANCELLED` |
| `notes` | TEXT | No | Additional visit information | — |
| `created_at` | TIMESTAMPTZ | Yes | Record creation time | Generated automatically |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification time | Updated automatically |

---

## 4. Operational Readings

Table name: `operational_readings`

| Field | PostgreSQL type | Required | Description | Validation |
|---|---|---:|---|---|
| `id` | UUID | Yes | Unique reading identifier | Generated automatically |
| `visit_id` | UUID | Yes | Related vessel visit | Must reference `vessel_visits.id` |
| `recorded_at` | TIMESTAMPTZ | Yes | Time of the operational reading | Must include timezone |
| `source` | VARCHAR(20) | Yes | Origin of the reading | `MANUAL`, `CSV`, `DEMO` |
| `unloaded_t` | NUMERIC(12,2) | Yes | Cumulative cargo unloaded | Between zero and total cargo |
| `observed_rate_tph` | NUMERIC(10,2) | No | Manually observed unloading rate | Must be zero or positive |
| `buffer_level_t` | NUMERIC(12,2) | No | Current storage-buffer level | Must be zero or positive |
| `buffer_capacity_t` | NUMERIC(12,2) | No | Maximum storage-buffer capacity | Must be greater than zero |
| `packaging_rate_tph` | NUMERIC(10,2) | No | Current packaging rate | Must be zero or positive |
| `unloading_status` | VARCHAR(20) | Yes | Current unloading state | `ACTIVE`, `STOPPED`, `COMPLETED` |
| `packaging_status` | VARCHAR(20) | No | Current packaging state | `ACTIVE`, `STOPPED`, `NOT_APPLICABLE` |
| `notes` | TEXT | No | Operator remarks | — |
| `created_at` | TIMESTAMPTZ | Yes | Record creation time | Generated automatically |

`remaining_t`, `progress_pct` and `effective_rate_tph` are calculated values. They should not be entered manually.

---

## 5. Delay Events

Table name: `delay_events`

| Field | PostgreSQL type | Required | Description | Validation |
|---|---|---:|---|---|
| `id` | UUID | Yes | Unique delay identifier | Generated automatically |
| `visit_id` | UUID | Yes | Related vessel visit | Must reference `vessel_visits.id` |
| `start_time` | TIMESTAMPTZ | Yes | Delay start time | Must include timezone |
| `end_time` | TIMESTAMPTZ | No | Delay end time | Must follow start time |
| `category` | VARCHAR(50) | Yes | General delay classification | Must not be empty |
| `cause` | VARCHAR(150) | Yes | Specific cause of delay | Must not be empty |
| `responsible_area` | VARCHAR(100) | No | Operational area responsible | — |
| `equipment` | VARCHAR(100) | No | Equipment related to delay | — |
| `description` | TEXT | No | Additional explanation | — |
| `created_at` | TIMESTAMPTZ | Yes | Record creation time | Generated automatically |

---

## 6. Predictions

Table name: `predictions`

| Field | PostgreSQL type | Required | Description | Validation |
|---|---|---:|---|---|
| `id` | UUID | Yes | Unique prediction identifier | Generated automatically |
| `visit_id` | UUID | Yes | Related vessel visit | Must reference `vessel_visits.id` |
| `generated_at` | TIMESTAMPTZ | Yes | Prediction generation time | Generated automatically |
| `remaining_t` | NUMERIC(12,2) | Yes | Calculated cargo remaining | Must be zero or positive |
| `progress_pct` | NUMERIC(5,2) | Yes | Calculated unloading progress | Between 0 and 100 |
| `effective_rate_tph` | NUMERIC(10,2) | No | Calculated effective unloading rate | Must be greater than zero when available |
| `estimated_unload_finish` | TIMESTAMPTZ | No | Predicted unloading completion | Null when data is insufficient |
| `expected_berth_release` | TIMESTAMPTZ | No | Predicted berth release time | Null when unloading ETA is unavailable |
| `method` | VARCHAR(50) | Yes | Prediction calculation method | Example: `RECENT_READINGS` |
| `data_quality` | VARCHAR(20) | Yes | Reliability of source data | `VALID`, `STALE`, `INSUFFICIENT`, `INVALID` |
| `created_at` | TIMESTAMPTZ | Yes | Record creation time | Generated automatically |

---

## 7. Upcoming Vessel Calls

Table name: `upcoming_vessel_calls`

| Field | PostgreSQL type | Required | Description | Validation |
|---|---|---:|---|---|
| `id` | UUID | Yes | Unique upcoming-call identifier | Generated automatically |
| `vessel_id` | UUID | Yes | Upcoming vessel | Must reference `vessels.id` |
| `berth_id` | UUID | Yes | Expected berth | Must reference `berths.id` |
| `expected_arrival` | TIMESTAMPTZ | Yes | Expected vessel arrival | Must include timezone |
| `cargo_type` | VARCHAR(100) | Yes | Expected cargo type | Must not be empty |
| `cargo_quantity_t` | NUMERIC(12,2) | Yes | Expected cargo quantity | Must be greater than zero |
| `expected_rate_tph` | NUMERIC(10,2) | No | Planned unloading rate | Must be greater than zero |
| `call_alert_at` | TIMESTAMPTZ | No | Time to remind users to contact agent | Must precede expected arrival |
| `confirmation_due_at` | TIMESTAMPTZ | No | Final ETA confirmation deadline | Must not follow arrival |
| `confirmed_at` | TIMESTAMPTZ | No | Time the ETA was confirmed | — |
| `berth_preparation_minutes` | INTEGER | Yes | Required berth preparation duration | Must be zero or positive |
| `status` | VARCHAR(20) | Yes | Upcoming-call status | `PLANNED`, `CONFIRMED`, `ARRIVED`, `CANCELLED` |
| `notes` | TEXT | No | Additional planning information | — |
| `created_at` | TIMESTAMPTZ | Yes | Record creation time | Generated automatically |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification time | Updated automatically |

---

## 8. Audit Records

Table name: `audit_records`

| Field | PostgreSQL type | Required | Description | Validation |
|---|---|---:|---|---|
| `id` | UUID | Yes | Unique audit-record identifier | Generated automatically |
| `user_id` | UUID | No | User who performed the action | Null only for system actions |
| `action` | VARCHAR(20) | Yes | Action performed | `CREATE`, `UPDATE`, `DELETE` |
| `entity_name` | VARCHAR(100) | Yes | Name of the affected entity | Must not be empty |
| `entity_id` | UUID | Yes | Identifier of the affected record | Must be a valid UUID |
| `old_value` | JSONB | No | Values before the change | — |
| `new_value` | JSONB | No | Values after the change | — |
| `created_at` | TIMESTAMPTZ | Yes | Time of the action | Generated automatically |

---

## Calculated Values

### Remaining cargo

```text
remaining_t = max(cargo_total_t - unloaded_t, 0)