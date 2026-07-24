import pytest
from unittest.mock import MagicMock
from src.services.llm import LlmExtractionService

def test_multi_agent_extraction_flow():
    # Wir mocken die Instructor API Calls, um den Flow zu testen
    service = LlmExtractionService(api_key="dummy")
    service.instructor_client = MagicMock()
    
    # Mocking the two sequential responses
    from src.models.contract import ExtractedContractData
    
    mock_response_1 = MagicMock()
    # Wir simulieren die reinen Fakten (Agent 1)
    mock_response_1.provider = "Vodafone"
    mock_response_1.mainContractName = "Tarif XYZ"
    mock_response_1.durationMonths = 24
    mock_response_1.autoRenewalMonths = 1
    mock_response_1.cancellationPeriodMonths = 1
    mock_response_1.components = []
    
    mock_response_2 = MagicMock()
    # Wir simulieren die Beratung (Agent 2)
    mock_response_2.simpleSummary = "Guter Tarif"
    mock_response_2.targetAudienceGood = "Jeder"
    mock_response_2.targetAudienceBad = "Niemand"
    mock_response_2.revocationAdvice = "14 Tage"
    mock_response_2.contactHotline = "0800"
    mock_response_2.telephonyRisks = "Keine"
    mock_response_2.comparisonResult = None

    service.instructor_client.chat.completions.create.side_effect = [mock_response_1, mock_response_2]

    # Act
    result = service.extract_contract_data("dummy text")
    
    # Assert
    assert result.provider == "Vodafone"
    assert result.simpleSummary == "Guter Tarif"
    assert result.durationMonths == 24
    assert result.contactHotline == "0800"
    assert service.instructor_client.chat.completions.create.call_count == 2
