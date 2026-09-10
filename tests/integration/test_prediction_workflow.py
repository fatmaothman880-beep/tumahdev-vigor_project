from datetime import datetime, timedelta, timezone

import pytest

from api_client import ApiClient


pytestmark = pytest.mark.integration


def test_core_operations_workflow_and_management_report(
    health_response: dict,
    api_client: ApiClient,
    seeded_ids: dict[str, str],
) -> None:
    scenario_start = datetime.now(timezone.utc).replace(microsecond=0) - timedelta(hours=2)
    visit = api_client.request_object(
        "POST",
        "/vessel-visits",
        {
            "vessel_id": seeded_ids["vessel_id"],
            "planned_arrival": (scenario_start - timedelta(hours=2)).isoformat(),
            "actual_arrival": (scenario_start - timedelta(hours=1)).isoformat(),
            "berth_id": seeded_ids["berth_id"],
            "cargo_tons": 1000,
            "unload_start": scenario_start.isoformat(),
            "status": "active",
        },
        expected_status=201,
    )
    visit_id = visit.get("id")
    assert visit_id, "Create-visit response must contain an id."

    readings = [
        {
            "timestamp": (scenario_start + timedelta(minutes=30)).isoformat(),
            "source": "qa-day3-test",
            "unloaded_tons": 100,
            "remaining_tons": 900,
            "observed_rate_tph": 200,
        },
        {
            "timestamp": (scenario_start + timedelta(hours=1)).isoformat(),
            "source": "qa-day3-test",
            "unloaded_tons": 300,
            "remaining_tons": 700,
            "observed_rate_tph": 200,
        },
    ]
    for reading in readings:
        created = api_client.request_object(
            "POST",
            f"/vessel-visits/{visit_id}/readings",
            reading,
            expected_status=201,
        )
        assert created.get("id"), "Create-reading response must contain an id."

    next_visit = api_client.request_object(
        "POST",
        "/vessel-visits",
        {
            "vessel_id": seeded_ids["next_vessel_id"],
            "planned_arrival": (scenario_start + timedelta(hours=2)).isoformat(),
            "berth_id": seeded_ids["berth_id"],
            "cargo_tons": 800,
            "status": "scheduled",
        },
        expected_status=201,
    )
    assert next_visit.get("id"), "Create-next-visit response must contain an id."

    delay_start = scenario_start + timedelta(minutes=40)
    delay = api_client.request_object(
        "POST",
        f"/vessel-visits/{visit_id}/delays",
        {
            "start": delay_start.isoformat(),
            "end": (delay_start + timedelta(minutes=30)).isoformat(),
            "category": "equipment",
            "cause": "Conveyor inspection",
            "equipment": "conveyor-demo-1",
            "responsible_area": "operations",
        },
        expected_status=201,
    )
    delay_id = delay.get("id")
    assert delay_id, "Create-delay response must contain an id."
    assert delay.get("duration_minutes") == pytest.approx(30.0)

    delays = api_client.request_list("GET", f"/vessel-visits/{visit_id}/delays")
    saved_delay = next((item for item in delays if str(item.get("id")) == str(delay_id)), None)
    assert saved_delay, "Created delay must appear in the visit delay list."
    assert saved_delay.get("cause") == "Conveyor inspection"
    assert saved_delay.get("category") == "equipment"

    dashboard = api_client.request_object("GET", "/dashboard/active")
    active_visit = dashboard.get("visit") or {}
    prediction = dashboard.get("prediction") or {}

    assert str(active_visit.get("id")) == str(visit_id)
    assert dashboard.get("progress_percent") == pytest.approx(30.0)
    assert dashboard.get("remaining_tons") == pytest.approx(700.0)
    assert dashboard.get("effective_rate_tph", 0) > 0
    assert prediction.get("target_time"), "A positive valid rate must produce an ETA."
    assert prediction.get("generated_at"), "Prediction must disclose when it was generated."
    assert prediction.get("data_quality"), "Prediction must disclose data quality."
    assert dashboard.get("next_vessel_eta"), "Dashboard must expose the next-vessel ETA."
    assert dashboard.get("expected_berth_release"), "Dashboard must expose berth release."
    assert dashboard.get("berth_conflict") is True

    final_reading = api_client.request_object(
        "POST",
        f"/vessel-visits/{visit_id}/readings",
        {
            "timestamp": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "source": "qa-day5-test",
            "unloaded_tons": 1000,
            "remaining_tons": 0,
            "observed_rate_tph": 200,
        },
        expected_status=201,
    )
    assert final_reading.get("id"), "Final reading response must contain an id."

    completed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    completed = api_client.request_object(
        "PATCH",
        f"/vessel-visits/{visit_id}",
        {
            "unload_end": completed_at,
            "departure": completed_at,
            "status": "completed",
        },
    )
    assert completed.get("status") == "completed"

    history = api_client.request_list("GET", "/vessel-visits?status=completed")
    history_visit = next(
        (item for item in history if str(item.get("id")) == str(visit_id)),
        None,
    )
    assert history_visit, "Completed visit must appear in history."

    report = api_client.request_object("GET", f"/reports/vessel/{visit_id}")
    assert str(report.get("visit_id")) == str(visit_id)
    assert report.get("status") == "completed"
    assert report.get("cargo_tons") == pytest.approx(1000.0)
    assert report.get("total_delay_minutes") == pytest.approx(30.0)
    assert report.get("planned_arrival")
    assert report.get("actual_arrival")
    assert report.get("unload_start")
    assert report.get("unload_end")
