from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace

from app.models.models import DataQuality, VisitStatus
from app.services.prediction_service import calculate_visit_prediction


def test_forecast_stays_anchored_to_reading_and_expires():
    measured = datetime(2026, 9, 16, 12, tzinfo=timezone.utc)
    def reading(at, tonnes):
        return SimpleNamespace(
            recorded_at=at, unloaded_t=Decimal(tonnes),
            observed_rate_tph=Decimal('999'), buffer_level_t=None,
            buffer_capacity_t=None, unloading_status=SimpleNamespace(value='ACTIVE'),
        )
    visit = SimpleNamespace(
        readings=[reading(measured - timedelta(hours=4), '1000'), reading(measured, '3000')],
        cargo_total_t=Decimal('6000'), post_unloading_minutes=90,
        status=VisitStatus.UNLOADING,
    )
    first = calculate_visit_prediction(visit, measured)
    later = calculate_visit_prediction(visit, measured + timedelta(hours=1))
    assert first == later
    assert first['effective_rate_tph'] == Decimal('500')
    assert first['estimated_unload_finish'] == measured + timedelta(hours=6)
    assert first['expected_berth_release'] == measured + timedelta(hours=7, minutes=30)
    stale = calculate_visit_prediction(visit, measured + timedelta(hours=3))
    assert stale['data_quality'] == DataQuality.STALE
    assert stale['estimated_unload_finish'] is None
    assert stale['expected_berth_release'] is None
    visit.readings[-1].unloading_status.value = 'STOPPED'
    assert calculate_visit_prediction(visit, measured)['estimated_unload_finish'] is None
    visit.status = VisitStatus.COMPLETED
    visit.unload_end = measured
    assert calculate_visit_prediction(visit, measured)['estimated_unload_finish'] == measured
