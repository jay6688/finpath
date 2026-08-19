from datetime import date, datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class CompanyIdentity(ApiModel):
    ticker: str
    name: str
    cik: str

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("cik")
    @classmethod
    def validate_cik(cls, value: str) -> str:
        normalized = value.strip().zfill(10)
        if not normalized.isdigit() or len(normalized) != 10:
            raise ValueError("CIK must contain ten digits")
        return normalized


class MetricMetadata(ApiModel):
    id: Literal["revenue"]
    label: Literal["Revenue"]
    currency: Literal["USD"]
    taxonomy_tag: str = Field(alias="taxonomyTag")


class AnnualFinancialFact(ApiModel):
    fiscal_year: int = Field(alias="fiscalYear")
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    value: int
    form: Literal["10-K", "10-K/A"]
    filed_at: date = Field(alias="filedAt")
    accession: str
    source_url: HttpUrl = Field(alias="sourceUrl")

    @field_validator("source_url")
    @classmethod
    def require_sec_filing_url(cls, value: HttpUrl) -> HttpUrl:
        if value.host not in {"sec.gov", "www.sec.gov"}:
            raise ValueError("sourceUrl must point to an SEC host")
        if "/Archives/edgar/data/" not in value.path:
            raise ValueError("sourceUrl must point to an EDGAR filing")
        return value


class DataState(StrEnum):
    LIVE = "live"
    CACHED = "cached"
    STALE = "stale"


class DataStatus(ApiModel):
    state: DataState
    retrieved_at: datetime = Field(alias="retrievedAt")


class CompanyOverviewResponse(ApiModel):
    company: CompanyIdentity
    metric: MetricMetadata
    series: list[AnnualFinancialFact]
    data_status: DataStatus = Field(alias="dataStatus")
