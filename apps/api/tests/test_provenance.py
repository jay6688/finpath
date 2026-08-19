import pytest

from app.services.sec.provenance import build_filing_index_url


def test_builds_official_filing_index_url_without_primary_document_name() -> None:
    source_url = build_filing_index_url(
        "0000320193",
        "0000320193-25-000079",
    )

    assert source_url == (
        "https://www.sec.gov/Archives/edgar/data/320193/"
        "000032019325000079/0000320193-25-000079-index.htm"
    )
    assert "aapl-20250927.htm" not in source_url


def test_rejects_invalid_accession_before_building_url() -> None:
    with pytest.raises(ValueError, match="Invalid SEC accession"):
        build_filing_index_url("0000320193", "not-an-accession")
