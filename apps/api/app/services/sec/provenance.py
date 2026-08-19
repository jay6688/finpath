import re


ACCESSION_PATTERN = re.compile(r"^\d{10}-\d{2}-\d{6}$")


def build_filing_index_url(cik: str, accession: str) -> str:
    """Build the stable EDGAR filing index URL from identifiers only.

    The URL deliberately does not guess the primary document filename, which is
    company-controlled and cannot be derived reliably from ticker or form type.
    """

    normalized_cik = cik.strip().zfill(10)
    if not normalized_cik.isdigit() or len(normalized_cik) != 10:
        raise ValueError("CIK must contain ten digits")
    if not ACCESSION_PATTERN.fullmatch(accession):
        raise ValueError(
            "Invalid SEC accession; expected ##########-##-######"
        )

    cik_directory = str(int(normalized_cik))
    accession_directory = accession.replace("-", "")
    return (
        "https://www.sec.gov/Archives/edgar/data/"
        f"{cik_directory}/{accession_directory}/{accession}-index.htm"
    )
