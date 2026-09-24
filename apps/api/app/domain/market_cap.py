from dataclasses import dataclass
from datetime import date
from decimal import Decimal, localcontext
from typing import Literal

from app.domain.market_data import (
    MarketPriceSnapshot,
    MarketSecurityProfile,
    get_market_security_profile,
)
from app.domain.shares_outstanding import (
    ReportedSharesOutstanding,
    SharesOutstandingProfile,
    get_shares_outstanding_profile,
)
from app.services.sec.provenance import build_filing_index_url


class MarketCapAlignmentError(ValueError):
    pass


@dataclass(frozen=True)
class MarketCapProfile:
    ticker: str
    cik: str
    fiscal_year: int
    filing_accession: str
    expected_shares_date: date
    shares_outstanding_spec: SharesOutstandingProfile
    market_security_profile: MarketSecurityProfile


@dataclass(frozen=True)
class MarketCapSnapshot:
    evidence_kind: Literal["derived"]
    formula: Literal["shares outstanding × raw closing price"]
    ticker: str
    cik: str
    fiscal_year: int
    as_of_date: date
    currency: str
    shares_outstanding: ReportedSharesOutstanding
    market_price: MarketPriceSnapshot
    exact_value: Decimal
    limitations: tuple[str, ...]


def _profile(ticker: str, cik: str, fiscal_year: int) -> MarketCapProfile:
    shares = get_shares_outstanding_profile(cik, fiscal_year)
    return MarketCapProfile(
        ticker=ticker,
        cik=cik,
        fiscal_year=fiscal_year,
        filing_accession=shares.accession,
        expected_shares_date=shares.as_of_date,
        shares_outstanding_spec=shares,
        market_security_profile=get_market_security_profile(ticker),
    )


MARKET_CAP_PROFILES = {
    ("AAPL", 2025): _profile("AAPL", "0000320193", 2025),
    ("MSFT", 2026): _profile("MSFT", "0000789019", 2026),
    ("WMT", 2026): _profile("WMT", "0000104169", 2026),
}


def get_market_cap_profile(ticker: str, fiscal_year: int) -> MarketCapProfile:
    normalized = ticker.strip().upper()
    try:
        return MARKET_CAP_PROFILES[(normalized, fiscal_year)]
    except KeyError:
        raise MarketCapAlignmentError(
            f"Market Cap alignment profile for {normalized or 'empty ticker'} "
            f"FY{fiscal_year} is unavailable."
        ) from None


def calculate_exact_market_cap(shares: int, raw_close: Decimal) -> Decimal:
    if isinstance(shares, bool) or not isinstance(shares, int) or shares <= 0:
        raise MarketCapAlignmentError(
            "Market Cap requires a positive exact integer share count."
        )
    if not isinstance(raw_close, Decimal):
        raise MarketCapAlignmentError(
            "Market Cap requires a Decimal raw closing price."
        )
    if not raw_close.is_finite() or raw_close <= 0:
        raise MarketCapAlignmentError(
            "Market Cap requires a finite positive raw closing price."
        )

    required_precision = len(str(shares)) + len(raw_close.as_tuple().digits) + 4
    with localcontext() as context:
        context.prec = max(50, required_precision)
        return Decimal(shares) * raw_close


def derive_market_cap_snapshot(
    profile: MarketCapProfile,
    shares: ReportedSharesOutstanding,
    market_price: MarketPriceSnapshot,
) -> MarketCapSnapshot:
    _validate_sec_input(profile, shares)
    if market_price.price_date != shares.as_of_date:
        raise MarketCapAlignmentError(
            "Shares outstanding and raw closing price must use the same exact date."
        )

    expected_market = profile.market_security_profile.resolve(shares.as_of_date)
    if (
        market_price.ticker != expected_market.ticker
        or market_price.provider != expected_market.provider
        or market_price.provider_symbol != expected_market.provider_symbol
        or market_price.provider_exchange != expected_market.provider_exchange
        or market_price.currency != expected_market.currency
    ):
        raise MarketCapAlignmentError(
            "The market-price identity does not match the reviewed security and venue."
        )
    if market_price.price_type != "close" or market_price.adjustment != "raw":
        raise MarketCapAlignmentError(
            "Market Cap requires an exact-date raw closing price."
        )

    exact_value = calculate_exact_market_cap(shares.value, market_price.price)
    return MarketCapSnapshot(
        evidence_kind="derived",
        formula="shares outstanding × raw closing price",
        ticker=profile.ticker,
        cik=profile.cik,
        fiscal_year=profile.fiscal_year,
        as_of_date=shares.as_of_date,
        currency=market_price.currency,
        shares_outstanding=shares,
        market_price=market_price,
        exact_value=exact_value,
        limitations=(
            "Point-in-time snapshot using shares and raw close from the same date.",
            "FinPath-derived; not company-reported and not enterprise value.",
            "Market prices change over time.",
        ),
    )


def _validate_sec_input(
    profile: MarketCapProfile, shares: ReportedSharesOutstanding
) -> None:
    expected = profile.shares_outstanding_spec
    expected_source_url = build_filing_index_url(
        profile.cik, profile.filing_accession
    )
    if (
        shares.evidence_kind != "reported"
        or shares.id != "common-shares-outstanding"
        or shares.cik != profile.cik
        or shares.fiscal_year != profile.fiscal_year
        or shares.form != expected.form
        or shares.filed_at != expected.filed_at
        or shares.accession != profile.filing_accession
        or shares.source_url != expected_source_url
        or shares.as_of_date != profile.expected_shares_date
        or shares.taxonomy_namespace != expected.taxonomy_namespace
        or shares.taxonomy_tag != expected.taxonomy_tag
        or shares.unit != expected.unit
        or shares.value != expected.expected_value
    ):
        raise MarketCapAlignmentError(
            "The SEC share-count identity does not match the reviewed Market Cap profile."
        )
