import pytest

from app.core.settings import MAX_FINPATH_SEC_REQUESTS_PER_SECOND, Settings


def test_sec_rate_is_capped_below_the_upstream_limit(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("SEC_REQUESTS_PER_SECOND", "9")

    settings = Settings.from_environment()

    assert settings.sec_requests_per_second == MAX_FINPATH_SEC_REQUESTS_PER_SECOND
    assert settings.sec_requests_per_second == 2.0


def test_private_contact_is_not_required_until_sec_is_called(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("SEC_USER_AGENT", raising=False)
    settings = Settings.from_environment()

    assert settings.sec_user_agent is None
    with pytest.raises(RuntimeError, match="SEC_USER_AGENT is required"):
        settings.require_sec_user_agent()

