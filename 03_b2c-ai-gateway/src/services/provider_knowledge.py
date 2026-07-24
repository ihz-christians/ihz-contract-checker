import json
import os
import logging

logger = logging.getLogger(__name__)

class ProviderKnowledgeService:
    def __init__(self, data_path: str = None):
        if data_path is None:
            # Resolves dynamically to 03_b2c-ai-gateway/src/data/providers.json
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.data_path = os.path.join(base_dir, "data", "providers.json")
        else:
            self.data_path = data_path
            
        self.knowledge_base = self._load_knowledge()

    def _load_knowledge(self) -> dict:
        if not os.path.exists(self.data_path):
            logger.warning(f"Provider knowledge file not found at {self.data_path}")
            return {}
        
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load provider knowledge: {e}")
            return {}

    def get_provider_facts(self, provider_name: str) -> str | None:
        if not provider_name:
            return None
        
        normalized_name = provider_name.lower().strip()
        
        # Einfacher Substring-Match: Findet "vodafone" in "Vodafone Deutschland GmbH"
        for key, facts in self.knowledge_base.items():
            if key in normalized_name or normalized_name in key:
                return facts
                
        return None
