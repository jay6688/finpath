from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_company_service
from app.domain.cash_flow_statement import CashFlowStatementUnavailableError
from app.domain.company_registry import list_supported_companies
from app.domain.company_service import CompanyNotFoundError, CompanyOverviewService
from app.domain.income_statement import IncomeStatementUnavailableError
from app.domain.revenue import RevenueUnavailableError
from app.schemas.company import (
    CompanyCashFlowStatementResponse,
    CompanyIncomeStatementResponse,
    CompanyOverviewResponse,
    CompanyCapabilities,
    SupportedCompaniesResponse,
    SupportedCompanySummary,
)
from app.services.sec.client import SecConfigurationError, SecUpstreamError


router = APIRouter(prefix="/v1/companies", tags=["companies"])


@router.get("", response_model=SupportedCompaniesResponse)
async def supported_companies() -> SupportedCompaniesResponse:
    return SupportedCompaniesResponse(
        companies=[
            SupportedCompanySummary(
                slug=company.slug,
                ticker=company.ticker,
                name=company.display_name,
                cik=company.cik,
                reviewedFiscalYear=company.reviewed_fiscal_year,
                capabilities=CompanyCapabilities(
                    revenue=company.capabilities.revenue,
                    revenueGrowth=company.capabilities.revenue_growth,
                    incomeStatement=company.capabilities.income_statement,
                    cashFlow=company.capabilities.cash_flow,
                ),
            )
            for company in list_supported_companies()
        ]
    )


@router.get("/{ticker}/overview", response_model=CompanyOverviewResponse)
async def company_overview(
    ticker: str,
    service: CompanyOverviewService = Depends(get_company_service),
) -> CompanyOverviewResponse:
    try:
        return await service.get_overview(ticker)
    except CompanyNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    except RevenueUnavailableError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    except SecConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error
    except SecUpstreamError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="SEC data is temporarily unavailable.",
        ) from error


@router.get(
    "/{ticker}/income-statements/{fiscal_year}",
    response_model=CompanyIncomeStatementResponse,
)
async def company_income_statement(
    ticker: str,
    fiscal_year: int,
    service: CompanyOverviewService = Depends(get_company_service),
) -> CompanyIncomeStatementResponse:
    try:
        return await service.get_income_statement(ticker, fiscal_year)
    except CompanyNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    except IncomeStatementUnavailableError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    except SecConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error
    except SecUpstreamError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="SEC data is temporarily unavailable.",
        ) from error


@router.get(
    "/{ticker}/cash-flow-statements/{fiscal_year}",
    response_model=CompanyCashFlowStatementResponse,
)
async def company_cash_flow_statement(
    ticker: str,
    fiscal_year: int,
    service: CompanyOverviewService = Depends(get_company_service),
) -> CompanyCashFlowStatementResponse:
    try:
        return await service.get_cash_flow_statement(ticker, fiscal_year)
    except CompanyNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    except CashFlowStatementUnavailableError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    except SecConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error
    except SecUpstreamError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="SEC data is temporarily unavailable.",
        ) from error
