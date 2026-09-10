# MVP 1 Demo Script

Target duration: 5-8 minutes. Status: integrated and prepared; rehearsal awaits a workstation with a running Docker engine.

## Before the audience joins

- Record the demonstrated commit and environment URL in `docs/release-checklist.md`.
- Confirm API and frontend smoke checks pass.
- Confirm the seeded active vessel, next vessel, berth and delay scenario are present.
- Open the active operations board and completed-history screen in separate tabs.
- Do not alter source code or database records during the demonstration.

## 1. Active operations board (45 seconds)

Open the dashboard and identify the active vessel, berth, cargo total, current progress, remaining cargo and last-reading timestamp.

State that MVP 1 uses manual/seeded operational records and provides decision support only.

## 2. Vessel visit record (45 seconds)

Open the active visit. Point out planned and actual arrival, berth assignment, cargo quantity, unload start and current status.

Explain that these values form one traceable operational record instead of disconnected manual calculations.

## 3. Unloading update and ETA (90 seconds)

Enter a valid unloading reading with timestamp, source, unloaded/remaining tons and observed rate. Save it and return to the dashboard.

Show the updated progress, remaining cargo, effective rate and completion ETA. Point out the prediction timestamp and data-quality state. Explain the transparent baseline: remaining cargo divided by a valid effective rate.

## 4. Delay visibility (60 seconds)

Open the delay log and show the equipment delay, start/end time, 30-minute duration, category and cause.

Explain that delays remain attached to the vessel visit and flow into the management report.

## 5. Berth conflict (60 seconds)

Show expected berth release and the next-vessel ETA. Highlight the conflict state where the next vessel arrives before expected release.

State that post-unloading duration and warning thresholds are configurable demo assumptions, not verified site facts.

## 6. Completion, history and report (90 seconds)

Open completed history and select the prepared completed visit. Show the vessel summary, cargo, operational timestamps and delay total.

Export the report and confirm it comes from stored system records rather than a manually rebuilt document.

## 7. Scope boundary and close (45 seconds)

State what is deliberately deferred: live PLC/SCADA/ERP integration, machinery control, machine learning, optimization, production security hardening and site-validated operating thresholds.

Close by identifying the exact demonstrated commit and clarifying that this is a presentation-ready prototype, not a production industrial system.

## Rehearsal record

| Field | Value |
| --- | --- |
| Status | Blocked |
| Rehearsed commit | Not available |
| Environment | Not available |
| Participants | Not executed |
| Duration | Not measured |
| Issues found | Integrated frontend/demo data unavailable |
