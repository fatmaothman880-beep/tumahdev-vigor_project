````markdown
# Port Monitoring System — ER Diagram

## Entity Relationship Diagram

```mermaid
erDiagram
    VESSELS ||--o{ VESSEL_VISITS : makes
    BERTHS ||--o{ VESSEL_VISITS : hosts
    VESSEL_VISITS ||--o{ OPERATIONAL_READINGS : contains
    VESSEL_VISITS ||--o{ DELAY_EVENTS : records
    VESSEL_VISITS ||--o{ PREDICTIONS : produces
    VESSELS ||--o{ UPCOMING_VESSEL_CALLS : schedules
    BERTHS ||--o{ UPCOMING_VESSEL_CALLS : receives

    VESSELS {
        uuid id PK
        varchar name
        varchar imo_reference UK
        numeric capacity_t
        varchar agent_name
        varchar agent_phone
        timestamptz created_at
        timestamptz updated_at
    }

    BERTHS {
        uuid id PK
        varchar name UK
        varchar status
        timestamptz created_at
        timestamptz updated_at
    }

    VESSEL_VISITS {
        uuid id PK
        uuid vessel_id FK
        uuid berth_id FK
        varchar cargo_type
        numeric cargo_total_t
        timestamptz planned_arrival
        timestamptz actual_arrival
        timestamptz unload_start
        timestamptz unload_end
        timestamptz planned_departure
        timestamptz actual_departure
        integer post_unloading_minutes
        varchar status
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    OPERATIONAL_READINGS {
        uuid id PK
        uuid visit_id FK
        timestamptz recorded_at
        varchar source
        numeric unloaded_t
        numeric observed_rate_tph
        numeric buffer_level_t
        numeric buffer_capacity_t
        numeric packaging_rate_tph
        varchar unloading_status
        varchar packaging_status
        text notes
        timestamptz created_at
    }

    DELAY_EVENTS {
        uuid id PK
        uuid visit_id FK
        timestamptz start_time
        timestamptz end_time
        varchar category
        varchar cause
        varchar responsible_area
        varchar equipment
        text description
        timestamptz created_at
    }

    PREDICTIONS {
        uuid id PK
        uuid visit_id FK
        timestamptz generated_at
        numeric remaining_t
        numeric progress_pct
        numeric effective_rate_tph
        timestamptz estimated_unload_finish
        timestamptz expected_berth_release
        varchar method
        varchar data_quality
        timestamptz created_at
    }

    UPCOMING_VESSEL_CALLS {
        uuid id PK
        uuid vessel_id FK
        uuid berth_id FK
        timestamptz expected_arrival
        varchar cargo_type
        numeric cargo_quantity_t
        numeric expected_rate_tph
        timestamptz call_alert_at
        timestamptz confirmation_due_at
        timestamptz confirmed_at
        integer berth_preparation_minutes
        varchar status
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    AUDIT_RECORDS {
        uuid id PK
        uuid user_id
        varchar action
        varchar entity_name
        uuid entity_id
        jsonb old_value
        jsonb new_value
        timestamptz created_at
    }