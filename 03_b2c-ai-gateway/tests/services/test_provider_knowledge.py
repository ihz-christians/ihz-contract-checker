import pytest
from src.services.provider_knowledge import ProviderKnowledgeService

def test_get_vodafone_knowledge_returns_wechselgarantie():
    service = ProviderKnowledgeService()
    facts = service.get_provider_facts("Vodafone Deutschland GmbH")
    
    assert facts is not None
    assert "Wechselgarantie" in facts
    assert "9 Monaten" in facts

def test_get_unknown_provider_returns_none():
    service = ProviderKnowledgeService()
    facts = service.get_provider_facts("Unbekannter Stromanbieter XYZ")
    
    assert facts is None
