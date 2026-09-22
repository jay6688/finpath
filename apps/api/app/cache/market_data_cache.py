from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
import sqlite3


@dataclass(frozen=True)
class MarketDataCacheEntry:
    price: Decimal
    currency: str
    provider_exchange: str
    fetched_at: datetime

    def is_fresh(self, now: datetime, refresh_seconds: int) -> bool:
        return now - self.fetched_at <= timedelta(seconds=refresh_seconds)

    def can_serve_stale(self, now: datetime, stale_seconds: int) -> bool:
        return now - self.fetched_at <= timedelta(seconds=stale_seconds)


class MarketDataCache:
    """Normalized public market observations; never provider credentials."""

    def __init__(self, path: Path) -> None:
        self.path = path

    def initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS market_price_cache (
                    provider TEXT NOT NULL,
                    provider_symbol TEXT NOT NULL,
                    price_date TEXT NOT NULL,
                    price_type TEXT NOT NULL,
                    adjustment TEXT NOT NULL,
                    price TEXT NOT NULL,
                    currency TEXT NOT NULL,
                    provider_exchange TEXT NOT NULL,
                    fetched_at TEXT NOT NULL,
                    PRIMARY KEY (
                        provider,
                        provider_symbol,
                        price_date,
                        price_type,
                        adjustment
                    )
                )
                """
            )

    def get(
        self,
        *,
        provider: str,
        provider_symbol: str,
        price_date: date,
        price_type: str,
        adjustment: str,
    ) -> MarketDataCacheEntry | None:
        self.initialize()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT price, currency, provider_exchange, fetched_at
                FROM market_price_cache
                WHERE provider = ?
                  AND provider_symbol = ?
                  AND price_date = ?
                  AND price_type = ?
                  AND adjustment = ?
                """,
                (
                    provider,
                    provider_symbol,
                    price_date.isoformat(),
                    price_type,
                    adjustment,
                ),
            ).fetchone()
        if row is None:
            return None
        fetched_at = datetime.fromisoformat(row[3])
        if fetched_at.tzinfo is None:
            fetched_at = fetched_at.replace(tzinfo=timezone.utc)
        return MarketDataCacheEntry(
            price=Decimal(row[0]),
            currency=row[1],
            provider_exchange=row[2],
            fetched_at=fetched_at,
        )

    def set(
        self,
        *,
        provider: str,
        provider_symbol: str,
        price_date: date,
        price_type: str,
        adjustment: str,
        price: Decimal,
        currency: str,
        provider_exchange: str,
        fetched_at: datetime,
    ) -> None:
        self.initialize()
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO market_price_cache (
                    provider,
                    provider_symbol,
                    price_date,
                    price_type,
                    adjustment,
                    price,
                    currency,
                    provider_exchange,
                    fetched_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (
                    provider,
                    provider_symbol,
                    price_date,
                    price_type,
                    adjustment
                ) DO UPDATE SET
                    price = excluded.price,
                    currency = excluded.currency,
                    provider_exchange = excluded.provider_exchange,
                    fetched_at = excluded.fetched_at
                """,
                (
                    provider,
                    provider_symbol,
                    price_date.isoformat(),
                    price_type,
                    adjustment,
                    str(price),
                    currency,
                    provider_exchange,
                    fetched_at.astimezone(timezone.utc).isoformat(),
                ),
            )

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path, timeout=5)
