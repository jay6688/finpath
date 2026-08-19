from dataclasses import dataclass
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


@dataclass(frozen=True)
class Settings:
    sec_user_agent: str | None
    sec_requests_per_second: float
    sec_company_facts_ttl_seconds: int
    sec_ticker_map_ttl_seconds: int
    sec_stale_if_error_seconds: int
    sec_cache_path: Path

    @classmethod
    def from_environment(cls) -> "Settings":
        requested_rate = _read_float(
            "SEC_REQUESTS_PER_SECOND", DEFAULT_SEC_REQUESTS_PER_SECOND
        )
        safe_rate = min(max(requested_rate, 0.1), MAX_FINPATH_SEC_REQUESTS_PER_SECOND)

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
