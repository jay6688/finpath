from datetime import date, datetime
from decimal import Decimal, InvalidOperation
import json
from typing import Any

import httpx

from app.domain.market_data import (
    MarketDataUnavailableError,
    MarketDataValidationError,
    MarketSecurityProfile,
    ProviderMarketPrice,
)


MARKETSTACK_EOD_URL = "https://api.marketstack.com/v2/eod"


class MarketstackProvider:
    name = "marketstack"

    def __init__(
        self,
        access_key: str,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._access_key = access_key
        self._transport = transport

    async def get_eod_close(
        self,
        profile: MarketSecurityProfile,
        price_date: date,
    ) -> ProviderMarketPrice:
        if profile.provider != self.name:
            raise MarketDataValidationError(
                "The reviewed security profile does not match this provider."
            )
        payload = await self._request_eod(profile.provider_symbol, price_date)
        return self._normalize_exact_close(payload, profile, price_date)

    async def _request_eod(
        self, provider_symbol: str, price_date: date
    ) -> dict[str, Any]:
        params = {
            "access_key": self._access_key,
            "symbols": provider_symbol,
            "date_from": price_date.isoformat(),
            "date_to": price_date.isoformat(),
            "limit": "100",
            "offset": "0",
        }
        timeout = httpx.Timeout(15.0, connect=10.0)
        try:
            async with httpx.AsyncClient(
                timeout=timeout,
                transport=self._transport,
            ) as client:
                response = await client.get(MARKETSTACK_EOD_URL, params=params)
        except httpx.HTTPError:
            raise MarketDataUnavailableError(
                "Marketstack could not provide the requested EOD observation."
            ) from None

        if response.status_code < 200 or response.status_code >= 300:
            raise MarketDataUnavailableError(
                f"Marketstack returned HTTP {response.status_code}."
            )
        try:
            payload = json.loads(
                response.content,
                parse_float=Decimal,
                parse_constant=Decimal,
            )
        except (json.JSONDecodeError, InvalidOperation, UnicodeDecodeError):
            raise MarketDataUnavailableError(
                "Marketstack returned invalid JSON."
            ) from None
        if not isinstance(payload, dict):
            raise MarketDataUnavailableError(
                "Marketstack returned an unexpected response shape."
            )
        if "error" in payload:
            raise MarketDataUnavailableError(
                "Marketstack rejected the EOD request."
            )
        return payload

    def _normalize_exact_close(
        self,
        payload: dict[str, Any],
        profile: MarketSecurityProfile,
        price_date: date,
    ) -> ProviderMarketPrice:
        records = payload.get("data")
        if not isinstance(records, list):
            raise MarketDataValidationError(
                "Marketstack EOD data must be a list."
            )
        matching_prices: set[Decimal] = set()
        found_exact_date = False
        for record in records:
            if not isinstance(record, dict):
                raise MarketDataValidationError(
                    "Marketstack returned a malformed EOD record."
                )
            record_date = _parse_provider_date(record.get("date"))
            if record_date != price_date:
                continue
            found_exact_date = True
            if record.get("symbol") != profile.provider_symbol:
                raise MarketDataValidationError(
                    "Marketstack returned the wrong security symbol."
                )
            if record.get("exchange") != profile.provider_exchange:
                raise MarketDataValidationError(
                    "Marketstack returned the wrong exchange identity."
                )
            matching_prices.add(_parse_positive_decimal(record.get("close")))

        if not found_exact_date:
            raise MarketDataUnavailableError(
                f"No exact EOD close is available for {price_date.isoformat()}."
            )
        if len(matching_prices) != 1:
            raise MarketDataValidationError(
                "Marketstack returned conflicting exact-date closes."
            )
        return ProviderMarketPrice(
            price_date=price_date,
            price=matching_prices.pop(),
            currency=profile.currency,
            price_type="close",
            adjustment="raw",
            provider="marketstack",
            provider_symbol=profile.provider_symbol,
            provider_exchange=profile.provider_exchange,
        )


def _parse_provider_date(value: object) -> date:
    if not isinstance(value, str):
        raise MarketDataValidationError("Marketstack EOD date is invalid.")
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        raise MarketDataValidationError("Marketstack EOD date is invalid.") from None


def _parse_positive_decimal(value: object) -> Decimal:
    if value is None or isinstance(value, bool):
        raise MarketDataValidationError("Marketstack raw close is missing or invalid.")
    try:
        price = value if isinstance(value, Decimal) else Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise MarketDataValidationError("Marketstack raw close is invalid.") from None
    if not price.is_finite() or price <= 0:
        raise MarketDataValidationError(
            "Marketstack raw close must be finite and greater than zero."
        )
    return price
