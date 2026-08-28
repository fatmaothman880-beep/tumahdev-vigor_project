# Port Monitoring System — Database Schema Design

## 1. Overview

The Port Monitoring System uses PostgreSQL to store vessel information, vessel visits, operational readings, delays, predictions, upcoming vessel calls and audit records.

The database supports this operational flow:

```text
Vessel registration
→ Vessel visit
→ Operational readings
→ Rate and progress calculation
→ Completion prediction
→ Berth-release prediction
→ Upcoming-vessel conflict check