import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.schemas.company import DataState
from app.services.sec.client import SecPayload


FIXTURE_ROOT = Path(__file__).parent / "fixtures" / "sec"
FIXED_RETRIEVED_AT = datetime(2026, 8, 19, tzinfo=timezone.utc)


def load_sec_fixture(filename: str) -> dict[str, Any]:
    with (FIXTURE_ROOT / filename).open(encoding="utf-8") as fixture_file:
        return json.load(fixture_file)


class FixtureSecDataSource:
    async def get_ticker_map(self) -> SecPayload:
        return SecPayload(
            payload=load_sec_fixture("company_tickers.json"),
            state=DataState.CACHED,
            retrieved_at=FIXED_RETRIEVED_AT,
        )

    async def get_company_facts(self, cik: str) -> SecPayload:
        fixtures = {
            "0000320193": "aapl_companyfacts.json",
            "0000789019": "msft_companyfacts.json",
            "0000104169": "wmt_companyfacts.json",
        }
        assert cik in fixtures
        return SecPayload(
            payload=load_sec_fixture(fixtures[cik]),
            state=DataState.CACHED,
            retrieved_at=FIXED_RETRIEVED_AT,
        )
