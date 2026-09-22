from dataclasses import dataclass, field
import os
from pathlib import Path

from dotenv import load_dotenv


DEFAULT_SEC_REQUESTS_PER_SECOND = 2.0
MAX_FINPATH_SEC_REQUESTS_PER_SECOND = 2.0
PROJECT_ROOT = Path(__file__).resolve().parents[4]
PROJECT_ENV_FILE = PROJECT_ROOT / ".env"


def load_project_environment(env_file: Path = PROJECT_ENV_FILE) -> None:
    """Load local project settings without replacing explicit process values."""
    load_dotenv(dotenv_path=env_file, override=False)


def _read_float(name: str, default: float) -> float:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        return float(raw_value)
    except ValueError as error:
        raise ValueError(f"{name} must be a number") from error


def _read_positive_int(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    try:
        value = default if raw_value is None else int(raw_value)
    except ValueError as error:
        raise ValueError(f"{name} must be a whole number") from error
    if value <= 0:
        raise ValueError(f"{name} must be greater than zero")
    return value


def _read_bool(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    normalized = raw_value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be true or false")


@dataclass(frozen=True)
class Settings:
    sec_user_agent: str | None
    sec_requests_per_second: float
    sec_company_facts_ttl_seconds: int
    sec_ticker_map_ttl_seconds: int
    sec_stale_if_error_seconds: int
    sec_cache_path: Path
    market_data_provider: str = "disabled"
    marketstack_access_key: str | None = field(default=None, repr=False)
    market_data_cache_path: Path = Path("apps/api/var/market-data-cache.sqlite3")
    market_data_refresh_seconds: int = 24 * 60 * 60
    market_data_stale_if_error_seconds: int = 7 * 24 * 60 * 60
    market_data_public_display_approved: bool = False

    @classmethod
    def from_environment(cls) -> "Settings":
        requested_rate = _read_float(
            "SEC_REQUESTS_PER_SECOND", DEFAULT_SEC_REQUESTS_PER_SECOND
        )
        safe_rate = min(max(requested_rate, 0.1), MAX_FINPATH_SEC_REQUESTS_PER_SECOND)
        market_data_provider = os.getenv("MARKET_DATA_PROVIDER", "disabled").strip().lower()
        if market_data_provider not in {"disabled", "marketstack"}:
            raise ValueError(
                "MARKET_DATA_PROVIDER must be disabled or marketstack"
            )

        return cls(
            sec_user_agent=os.getenv("SEC_USER_AGENT") or None,
            sec_requests_per_second=safe_rate,
            sec_company_facts_ttl_seconds=int(
                os.getenv("SEC_COMPANY_FACTS_TTL_SECONDS", "21600")
            ),
            sec_ticker_map_ttl_seconds=int(
                os.getenv("SEC_TICKER_MAP_TTL_SECONDS", "86400")
            ),
            sec_stale_if_error_seconds=int(
                os.getenv("SEC_STALE_IF_ERROR_SECONDS", "604800")
            ),
            sec_cache_path=Path(
                os.getenv("SEC_CACHE_PATH", "apps/api/var/sec-cache.sqlite3")
            ),
            market_data_provider=market_data_provider,
            marketstack_access_key=(
                os.getenv("MARKETSTACK_ACCESS_KEY", "").strip() or None
            ),
            market_data_cache_path=Path(
                os.getenv(
                    "MARKET_DATA_CACHE_PATH",
                    "apps/api/var/market-data-cache.sqlite3",
                )
            ),
            market_data_refresh_seconds=_read_positive_int(
                "MARKET_DATA_REFRESH_SECONDS", 24 * 60 * 60
            ),
            market_data_stale_if_error_seconds=_read_positive_int(
                "MARKET_DATA_STALE_IF_ERROR_SECONDS", 7 * 24 * 60 * 60
            ),
            market_data_public_display_approved=_read_bool(
                "MARKET_DATA_PUBLIC_DISPLAY_APPROVED", False
            ),
        )

    @classmethod
    def from_project_environment(
        cls, env_file: Path = PROJECT_ENV_FILE
    ) -> "Settings":
        # Local development reads one known file. Values already supplied by the
        # process take precedence, which keeps deployment configuration explicit.
        load_project_environment(env_file)
        return cls.from_environment()

    def require_sec_user_agent(self) -> str:
        if not self.sec_user_agent:
            raise RuntimeError(
                "SEC_USER_AGENT is required before FinPath can call SEC endpoints."
            )
        return self.sec_user_agent
