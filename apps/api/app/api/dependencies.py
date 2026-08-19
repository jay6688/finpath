from functools import lru_cache

from app.cache.sqlite_cache import SqliteJsonCache
from app.core.settings import Settings
from app.domain.company_service import CompanyOverviewService
from app.services.sec.client import SecClient


@lru_cache
def get_settings() -> Settings:
    return Settings.from_project_environment()


@lru_cache
def get_company_service() -> CompanyOverviewService:
    settings = get_settings()
    cache = SqliteJsonCache(settings.sec_cache_path)
    sec_client = SecClient(settings=settings, cache=cache)
    return CompanyOverviewService(sec_client)
