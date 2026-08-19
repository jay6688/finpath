from datetime import datetime, timedelta, timezone

from app.cache.sqlite_cache import SqliteJsonCache


NOW = datetime(2026, 8, 19, tzinfo=timezone.utc)


def test_sqlite_cache_round_trip_and_freshness(tmp_path) -> None:
    cache = SqliteJsonCache(tmp_path / "sec-cache.sqlite3")
    cache.set("company-facts", "0000320193", {"answer": 42}, NOW)

    entry = cache.get("company-facts", "0000320193")

    assert entry is not None
    assert entry.payload == {"answer": 42}
    assert entry.fetched_at == NOW
    assert entry.is_fresh(NOW + timedelta(hours=5), 6 * 60 * 60)
    assert not entry.is_fresh(NOW + timedelta(hours=7), 6 * 60 * 60)
    assert entry.can_serve_stale(NOW + timedelta(days=6), 7 * 24 * 60 * 60)
