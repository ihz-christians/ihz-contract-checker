import pytest
from pydantic import ValidationError
from src.models.actions import LegalActionData

def test_legal_action_data_valid():
    data = LegalActionData(
        intent="cancellation",
        provider_name="Vodafone",
        customer_number="12345",
        is_complete=True
    )
    assert data.intent == "cancellation"
    assert data.provider_name == "Vodafone"
    assert data.customer_number == "12345"
    assert data.action_date == "zum nächstmöglichen Zeitpunkt"
    assert data.is_complete is True

def test_legal_action_data_incomplete():
    data = LegalActionData(
        intent="revocation",
        provider_name="Telekom",
        is_complete=False,
        missing_info_prompt="Mir fehlt noch die Kundennummer."
    )
    assert data.is_complete is False
    assert data.customer_number is None

def test_legal_action_data_missing_required():
    with pytest.raises(ValidationError):
        LegalActionData(
            intent="cancellation"
            # Missing provider_name
        )
