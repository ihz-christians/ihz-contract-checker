import pytest
from unittest.mock import MagicMock
from src.services.chat import LlmChatService

def test_chat_uses_provider_knowledge():
    # Mock genai client to prevent actual API calls during test
    service = LlmChatService(api_key="dummy_key")
    
    # We mock the generate_content to simply return what prompt it was sent
    mock_response = MagicMock()
    mock_response.text = "Dummy response containing Wechselgarantie"
    service.genai_client.models.generate_content = MagicMock(return_value=mock_response)

    # We pass a JSON context that CLEARLY indicates Vodafone
    context_json = '{"metadata":{"contractType":"Vodafone GmbH - Internet"}}'
    
    # Act
    service.ask_question("kann man den vertrag runterstufen?", context_json)
    
    # Assert
    # We check if the generated user_prompt contains the fetched provider knowledge
    call_args = service.genai_client.models.generate_content.call_args[1]
    prompt_used = call_args["contents"]
    
    assert "HINTERGRUNDWISSEN ZU VODAFONE KABEL" in prompt_used
    assert "Wechselgarantie" in prompt_used

