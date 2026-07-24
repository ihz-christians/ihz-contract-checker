import pytest
from unittest.mock import MagicMock
from src.services.llm import LlmExtractionService
from src.models.contract import ExtractedContractData
from src.models.contract_agents import Agent1Facts, Agent2Advice

def test_extract_contract_data_success():
    # Setup
    mock_client = MagicMock()
    mock_response_1 = Agent1Facts(provider="Test Provider", mainContractName="Tarif X", components=[])
    mock_response_2 = Agent2Advice(simpleSummary="Test Zusammenfassung")
    mock_client.chat.completions.create.side_effect = [mock_response_1, mock_response_2]
    
    service = LlmExtractionService(api_key="dummy_key", instructor_client=mock_client)
    
    # Execute
    result = service.extract_contract_data("dummy text")
    
    # Assert
    assert mock_client.chat.completions.create.call_count == 2
    assert result.provider == "Test Provider"
    assert result.simpleSummary == "Test Zusammenfassung"

def test_extract_contract_data_failure():
    # Setup
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = Exception("API Error")
    
    service = LlmExtractionService(api_key="dummy_key", instructor_client=mock_client)
    
    # Execute & Assert
    with pytest.raises(RuntimeError) as exc_info:
        service.extract_contract_data("dummy text")
    
    assert "Fehler bei der Multi-Agent-Datenextraktion" in str(exc_info.value)
