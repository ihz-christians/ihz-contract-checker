import os
import json
import logging
import instructor
import google.generativeai as genai_old
from src.models.contract import ExtractedContractData
from src.models.contract_agents import Agent1Facts, Agent2Advice
from src.services.provider_knowledge import ProviderKnowledgeService
from langfuse import observe

logger = logging.getLogger(__name__)

class LlmExtractionService:
    def __init__(self, api_key: str = None, model_name: str = "gemini-2.5-flash", instructor_client=None):
        self.model_name = model_name
        self.knowledge_service = ProviderKnowledgeService()

        if instructor_client:
            self.instructor_client = instructor_client
        else:
            self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
            if not self.api_key:
                raise ValueError("Kein Gemini API Key gefunden! Setze GEMINI_API_KEY als Umgebungsvariable.")

            genai_old.configure(api_key=self.api_key)
            model = genai_old.GenerativeModel(
                self.model_name,
                generation_config=genai_old.types.GenerationConfig(
                    temperature=0.0
                )
            )

            self.instructor_client = instructor.from_gemini(
                model,
                mode=instructor.Mode.GEMINI_JSON
            )

    @observe(as_type="generation")
    def extract_contract_data(self, text: str, compare_text: str = None) -> ExtractedContractData:
        try:
            agent1_prompt = (
                "Du bist ein hochpräziser B2C-Vertrags-Parser, spezialisiert auf Telekommunikation und Energie.\n"
                "Deine Aufgabe ist es, deutsche OCR-Texte deterministisch und absolut fehlerfrei in das JSON-Schema zu mappen.\n\n"
                "<STRICT_RULES>\n"
                "1. NO HALLUCINATION: Fehlen Daten, setze null oder leere Listen.\n"
                "2. CATEGORIES: 'category' MUSS exakt 'Haupttarif', 'Hardware', 'Zusatzoption' oder 'Rabatt' sein.\n"
                "3. NEGATIVE VALUES: Cashback, Gutschriften und Rabatte = negativer Wert (z.B. -50.00).\n"
                "4. POSITIVE VALUES: Einmalige Bereitstellungsentgelte/Versandkosten oder monatliche Grundgebühren = positiver Wert.\n"
                "5. KOMBINIERTE PAKETE (TV + Internet): Wenn der Vertrag mehrere Haupttarife (z.B. Kabel Internet + TV Paket) hat, MUSST du BEIDE als separate 'Haupttarif'-Komponenten anlegen, z.B. 'GigaZuhause 50' und 'Vodafone TV Connect'.\n"
                "6. PREISSPRÜNGE (Sehr wichtig!): Wenn ein Tarif gestaffelt ist (z.B. 'Monate 1-6: 19,99€, ab dem 7. Monat: 39,99€'), MUSST du exakt ZWEI PriceStage-Objekte für diese Komponente anlegen:\n"
                "   - Stage 1: startMonth=1, endMonth=6, amount=19.99\n"
                "   - Stage 2: startMonth=7, endMonth=99, amount=39.99\n"
                "7. EINMALKOSTEN: 'Bereitstellungspreis' oder 'Anschlusspreis' sind EINMALIGE Kosten (oneTimeCharge). Die 'prices' Liste bleibt hierbei LEER! Setze sie als EIGENE Komponente mit der Kategorie 'Zusatzoption' oder 'Hardware' (aber NICHT 'Haupttarif').\n"
                "8. LAUFZEITEN: 'durationMonths' ist meist 24. 'autoRenewalMonths' ist nach TKG meist 1 Monat.\n"
                "</STRICT_RULES>"
            )

            # Enterprise / GDPR Notice: In an enterprise production roll-out, an upstream PII-scrubbing
            # pipeline (e.g. Microsoft Presidio) anonymizes consumer names, IBANs, and addresses before sending to cloud LLMs.
            agent1_response: Agent1Facts = self.instructor_client.chat.completions.create(
                response_model=Agent1Facts,
                messages=[
                    {"role": "system", "content": agent1_prompt},
                    {"role": "user", "content": f"<TEXT>\n{text}\n</TEXT>"}
                ],
                max_retries=3
            )

            provider_facts = ""
            if agent1_response.provider:
                facts = self.knowledge_service.get_provider_facts(agent1_response.provider)
                if facts:
                    provider_facts = facts

            agent2_prompt = (
                "Du bist ein Verbraucherschutz-Berater. Lies den OCR-Text, die bereits extrahierten Fakten und das Provider-Wissen und erstelle hilfreiche Texte.\n"
                "Falls ein <COMPARE_TEXT> (Altvertrag) übergeben wird, vergleiche diesen mit dem neuen Vertrag und erstelle ein 'comparisonResult'.\n\n"
                "<RULES>\n"
                "1. SUMMARY: Erstelle für 'simpleSummary' eine sehr einfache, freundliche Zusammenfassung (Laien-verständlich, 2-3 Sätze).\n"
                "2. ADVICE: Fülle 'targetAudienceGood', 'targetAudienceBad', 'revocationAdvice' (Widerruf) und 'contactHotline' ehrlich aus.\n"
                "3. TELEPHONY RISKS: Fülle 'telephonyRisks' mit einer klaren Warnung aus, falls Anrufe pro Minute abgerechnet werden.\n"
                "4. NUTZE PROVIDER WISSEN: Falls im <PROVIDER_FACTS> spezielle Regeln (z.B. Wechselgarantien, Preissprünge) stehen, baue diese in die simpleSummary oder targetAudience ein.\n"
                "5. VERGLEICH: Falls ein <COMPARE_TEXT> existiert, gib bei 'comparisonResult' eine klare Empfehlung und Begründung ab (z.B. 'Der neue Vertrag ist 10€ teurer, bietet aber doppelt so viel Leistung.').\n"
                "</RULES>"
            )

            agent2_context = f"""
            <TEXT>
            {text}
            </TEXT>

            <EXTRACTED_FACTS>
            {agent1_response.model_dump_json()}
            </EXTRACTED_FACTS>

            <PROVIDER_FACTS>
            {provider_facts}
            </PROVIDER_FACTS>
            """
            
            if compare_text:
                agent2_context += f"\n\n<COMPARE_TEXT>\n{compare_text}\n</COMPARE_TEXT>"

            agent2_response: Agent2Advice = self.instructor_client.chat.completions.create(
                response_model=Agent2Advice,
                messages=[
                    {"role": "system", "content": agent2_prompt},
                    {"role": "user", "content": agent2_context}
                ],
                max_retries=3
            )

            final_data = ExtractedContractData(
                provider=agent1_response.provider,
                mainContractName=agent1_response.mainContractName,
                durationMonths=agent1_response.durationMonths,
                autoRenewalMonths=agent1_response.autoRenewalMonths,
                cancellationPeriodMonths=agent1_response.cancellationPeriodMonths,
                components=agent1_response.components,
                simpleSummary=agent2_response.simpleSummary,
                targetAudienceGood=agent2_response.targetAudienceGood,
                targetAudienceBad=agent2_response.targetAudienceBad,
                revocationAdvice=agent2_response.revocationAdvice,
                contactHotline=agent2_response.contactHotline,
                telephonyRisks=agent2_response.telephonyRisks,
                comparisonResult=agent2_response.comparisonResult
            )

            return final_data

        except Exception as e:
            logger.error(f"LLM Multi-Agent Extraction failed: {str(e)}")
            raise RuntimeError(f"Fehler bei der Multi-Agent-Datenextraktion: {str(e)}")
