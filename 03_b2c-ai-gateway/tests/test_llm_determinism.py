import pytest
from unittest.mock import patch, MagicMock
from src.services.llm import LlmExtractionService

@patch("src.services.llm.instructor.from_gemini")
@patch("src.services.llm.genai_old.GenerativeModel")
@patch("src.services.llm.genai_old.configure")
@patch.dict('os.environ', {'GEMINI_API_KEY': 'test_key'})
def test_llm_uses_zero_temperature(mock_configure, mock_model, mock_instructor):
    mock_instructor_client = MagicMock()
    mock_instructor.return_value = mock_instructor_client
    
    llm_service = LlmExtractionService()
    
    # Assert
    assert mock_model.call_count == 1
    model_kwargs = mock_model.call_args.kwargs
    
    # Verify that generation_config is passed with temperature 0.0
    assert 'generation_config' in model_kwargs
    config = model_kwargs['generation_config']
    assert config.temperature == 0.0, "Model MUST be instantiated with temperature=0.0 for deterministic outputs!"
