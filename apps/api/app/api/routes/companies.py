from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_company_service
from app.domain.company_service import CompanyNotFoundError, CompanyOverviewService
from app.domain.revenue import RevenueUnavailableError
from app.schemas.company import CompanyOverviewResponse
from app.services.sec.client import SecConfigurationError, SecUpstreamError


router = APIRouter(prefix="/v1/companies", tags=["companies"])


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
