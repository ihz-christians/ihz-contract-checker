import os
import json
import logging
from google import genai
from google.genai import types
from langfuse import observe
from src.services.provider_knowledge import ProviderKnowledgeService
from src.services.agent_tools import execute_legal_action

logger = logging.getLogger(__name__)

class LlmChatService:
    """
    RAG Chat-Service. Verbindet Prompt Engineering mit dem injizierten JSON-Kontext aus Java.
    """

    def __init__(self, api_key: str = None, model_name: str = "gemini-2.5-flash"):
        self.model_name = model_name
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("Kein Gemini API Key gefunden!")

        # Wir nutzen hier den puren genai Client, kein Instructor (da wir freien Chat-Text wollen, kein JSON)
        self.genai_client = genai.Client(api_key=self.api_key)
        self.knowledge_service = ProviderKnowledgeService()

    @observe(as_type="generation")
    def ask_question(self, question: str, context_json: str) -> str:
        """
        Beantwortet die Nutzerfrage basierend auf dem harten JSON-Kontext.
        """
        # PROMPT ENGINEERING: Die perfekte System-Instruktion für den 12-jährigen Laien (Verbraucherschutz)
        system_instruction = (
            "Du bist ein ehrenamtlicher Verbraucherschützer und Berater für Privatkunden. "
            "Deine Aufgabe ist es, Fragen von normalen Menschen zu ihrem Internet-, Strom- oder Handyvertrag zu beantworten, "
            "besonders bei Haustürgeschäften oder komplexen Tarifstrukturen.\n\n"
            "<RULES>\n"
            "1. CONTEXT IS KING: Beantworte die Frage AUSSCHLIESSLICH basierend auf den Daten im bereitgestellten <CONTEXT_JSON>, dem darin enthaltenen Rohtext ('extractedRawText') und den <PROVIDER_FACTS>. Wenn die Information in keinem der drei Bereiche steht, sage höflich, dass du es nicht weißt.\n"
            "2. NO HALLUCINATION: Erfinde niemals rechtliche Fakten, Preise oder Fristen, außer sie stehen in den <PROVIDER_FACTS>.\n"
            "3. TONE & LANGUAGE: Erkläre alles so einfach, dass es ein 12-Jähriger sofort versteht. Benutze kurze Sätze, keine Fremdwörter, kein juristisches Kauderwelsch. Sei wie ein guter Freund.\n"
            "4. EMPOWERMENT & RECHTE: Wenn der Nutzer fragt, ob er etwas 'darf' (Preis reduzieren, kündigen, downgraden), prüfe die Fakten (z.B. Wechselgarantien, § 68 TKG) und erkläre ihm proaktiv seine Rechte.\n"
            "5. HAUSTÜRGESCHÄFTE: Erinnere Nutzer bei Fragen zum Widerruf oder 'ich habe gerade unterschrieben' immer an das 14-tägige Widerrufsrecht bei Haustürgeschäften / Fernabsatz.\n"
            "6. FARBLICHE HERVORHEBUNGEN (WICHTIG): \n"
            "   - Verwende !!Text!! (mit zwei Ausrufezeichen) für rote, kritische Warnungen (z.B. !!Achtung Kostenfalle!! oder !!Minderung möglich!!).\n"
            "   - Verwende __Text__ (mit zwei Unterstrichen) für gelbe Hervorhebungen (z.B. __wichtig zu wissen__).\n"
            "   - Verwende **Text** (mit zwei Sternchen) für normale Hervorhebungen in Grün (z.B. **Zusammenfassung**).\n"
            "</RULES>"
        )

        provider_facts_str = "Keine zusätzlichen Hintergrundinformationen für diesen Anbieter vorhanden."
        
        # Versuche den Provider aus dem JSON zu lesen, um Sonderwissen (Provider Knowledge Base) zu laden
        try:
            data = json.loads(context_json)
            contract_type = data.get("metadata", {}).get("contractType", "")
            # contractType enthält meist "ProviderName - Tarifname" (z.B. "Vodafone GmbH - GigaZuhause")
            if contract_type:
                facts = self.knowledge_service.get_provider_facts(contract_type)
                if facts:
                    provider_facts_str = facts
        except Exception as e:
            logger.warning(f"Konnte Kontext-JSON für Provider-Suche nicht parsen: {e}")

        # CONTEXT ENGINEERING: Die Frage wird mit der sauberen Datenstruktur gepaart
        user_prompt = f"""
        <PROVIDER_FACTS>
        {provider_facts_str}
        </PROVIDER_FACTS>

        <CONTEXT_JSON>
        {context_json}
        </CONTEXT_JSON>

        FRAGE DES NUTZERS:
        {question}
        """

        try:
            response = self.genai_client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2, # Niedrige Temperatur = Faktenbasierter, weniger kreativ (wichtig für Recht & Zahlen)
                    tools=[execute_legal_action]
                )
            )
            
            # Check if LLM decided to call our tool
            if response.function_calls:
                for function_call in response.function_calls:
                    if function_call.name == "execute_legal_action":
                        args = function_call.args
                        # If data is missing, we return the prompt generated by LLM
                        if not args.get("is_complete", False):
                            return args.get("missing_info_prompt", "Bitte teile mir noch deine Kundennummer mit.")
                        
                        # If complete, we return a special JSON string that the frontend can parse
                        # to show the confirmation button for the legal action.
                        action_data = {
                            "type": "ACTION_READY",
                            "intent": args.get("intent"),
                            "provider": args.get("provider_name"),
                            "customer_number": args.get("customer_number"),
                            "action_date": args.get("action_date")
                        }
                        return json.dumps(action_data)

            return response.text

        except Exception as e:
            logger.error(f"Chat generation failed: {str(e)}")
            return "Entschuldigung, meine KI-Verbindung ist gerade unterbrochen. Bitte versuchen Sie es später noch einmal."
