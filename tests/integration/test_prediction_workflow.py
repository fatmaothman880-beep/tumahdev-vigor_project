from datetime import datetime, timedelta, timezone

import pytest

from api_client import ApiClient


pytestmark = pytest.mark.integration


def test_readings_update_active_dashboard_prediction(
    health_response: dict,
    api_client: ApiClient,
    seeded_ids: dict[str, str],
) -> None:
    scenario_start = datetime.now(timezone.utc).replace(microsecond=0)
    visit = api_client.request(
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
        created = api_client.request(
            "POST",
            f"/vessel-visits/{visit_id}/readings",
            reading,
            expected_status=201,
        )
        assert created.get("id"), "Create-reading response must contain an id."

    dashboard = api_client.request("GET", "/dashboard/active")
    active_visit = dashboard.get("visit") or {}
    prediction = dashboard.get("prediction") or {}

    assert str(active_visit.get("id")) == str(visit_id)
    assert dashboard.get("progress_percent") == pytest.approx(30.0)
    assert dashboard.get("remaining_tons") == pytest.approx(700.0)
    assert dashboard.get("effective_rate_tph", 0) > 0
    assert prediction.get("target_time"), "A positive valid rate must produce an ETA."
    assert prediction.get("generated_at"), "Prediction must disclose when it was generated."
    assert prediction.get("data_quality"), "Prediction must disclose data quality."
