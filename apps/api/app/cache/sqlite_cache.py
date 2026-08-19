from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sqlite3
from typing import Any


@dataclass(frozen=True)
class CacheEntry:
    payload: dict[str, Any]
    fetched_at: datetime

    def age(self, now: datetime) -> timedelta:
        return now - self.fetched_at

    def is_fresh(self, now: datetime, ttl_seconds: int) -> bool:
        return self.age(now) <= timedelta(seconds=ttl_seconds)

    def can_serve_stale(self, now: datetime, stale_seconds: int) -> bool:
        return self.age(now) <= timedelta(seconds=stale_seconds)


class SqliteJsonCache:
    """Small process-safe cache for public SEC JSON responses.

    Each operation opens its own SQLite connection so FastAPI requests do not
    share connection objects across threads. This cache must never contain user
    information during V0.
    """

    def __init__(self, path: Path) -> None:
        self.path = path

    def initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS sec_json_cache (
                    namespace TEXT NOT NULL,
                    cache_key TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    fetched_at TEXT NOT NULL,
                    PRIMARY KEY (namespace, cache_key)
                )
                """
            )

    def get(self, namespace: str, cache_key: str) -> CacheEntry | None:
        self.initialize()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT payload, fetched_at
                FROM sec_json_cache
                WHERE namespace = ? AND cache_key = ?
                """,
                (namespace, cache_key),
            ).fetchone()

        if row is None:
            return None

        fetched_at = datetime.fromisoformat(row[1])
        if fetched_at.tzinfo is None:
            fetched_at = fetched_at.replace(tzinfo=timezone.utc)

        return CacheEntry(payload=json.loads(row[0]), fetched_at=fetched_at)

    def set(
        self,
        namespace: str,
        cache_key: str,
        payload: dict[str, Any],
        fetched_at: datetime,
    ) -> None:
        self.initialize()
        normalized_time = fetched_at.astimezone(timezone.utc)
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO sec_json_cache (namespace, cache_key, payload, fetched_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(namespace, cache_key) DO UPDATE SET
                    payload = excluded.payload,
                    fetched_at = excluded.fetched_at
                """,
                (
                    namespace,
                    cache_key,
                    json.dumps(payload, separators=(",", ":")),
                    normalized_time.isoformat(),
                ),
            )

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path, timeout=5)
