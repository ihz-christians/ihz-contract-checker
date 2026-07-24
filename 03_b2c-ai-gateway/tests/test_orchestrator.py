import pytest
from unittest.mock import patch, MagicMock
from src.services.orchestrator import DocumentAnalysisOrchestrator

@patch("src.services.orchestrator.S3StorageService")
@patch("src.services.orchestrator.DocumentParser")
@patch("src.services.orchestrator.LlmExtractionService")
@patch("src.services.orchestrator.httpx.Client")
@patch("os.path.exists")
@patch("os.remove")
def test_run_pipeline_progress_webhooks(
    mock_remove,
    mock_exists,
    mock_httpx_client,
    mock_llm_service,
    mock_parser,
    mock_storage
):
    # Arrange
    task_id = "test-123"
    s3_url = "s3://test-bucket/doc.pdf"
    callback_url = "http://localhost:8080/api/webhook"
    tenant_id = "tenant-1"
    
    # Mocks konfigurieren
    mock_storage_instance = mock_storage.return_value
    mock_storage_instance.download_file.return_value = "/tmp/doc.pdf"
    
    mock_parser_instance = mock_parser.return_value
    mock_parser_instance.extract_layout_text.return_value = "Test Contract Data"
    
    mock_llm_instance = mock_llm_service.return_value
    mock_pydantic_model = MagicMock()
    mock_pydantic_model.model_dump.return_value = {"key": "value"}
    mock_llm_instance.extract_contract_data.return_value = mock_pydantic_model
    
    mock_exists.return_value = True
    
    # Httpx Mock für Webhooks
    mock_client_instance = MagicMock()
    mock_httpx_client.return_value.__enter__.return_value = mock_client_instance
    mock_response = MagicMock()
    mock_client_instance.post.return_value = mock_response

    # Act
    DocumentAnalysisOrchestrator.run_pipeline(task_id, s3_url, callback_url, tenant_id)

    # Assert
    # Wir erwarten genau 5 Webhook Aufrufe (10%, 25%, 50%, 75% und 100% COMPLETED)
    assert mock_client_instance.post.call_count == 5
    
    calls = mock_client_instance.post.call_args_list
    
    # 1. Call: 10%
    assert calls[0].kwargs['json']['progress'] == 10
    assert calls[0].kwargs['json']['status'] == "IN_PROGRESS"
    
    # 2. Call: 25%
    assert calls[1].kwargs['json']['progress'] == 25
    assert calls[1].kwargs['json']['status'] == "IN_PROGRESS"
    
    # 3. Call: 50%
    assert calls[2].kwargs['json']['progress'] == 50
    assert calls[2].kwargs['json']['status'] == "IN_PROGRESS"
    
    # 4. Call: 75%
    assert calls[3].kwargs['json']['progress'] == 75
    assert calls[3].kwargs['json']['status'] == "IN_PROGRESS"
    
    # 5. Call: COMPLETED
    assert calls[4].kwargs['json']['status'] == "COMPLETED"
    assert "extractedData" in calls[4].kwargs['json']
