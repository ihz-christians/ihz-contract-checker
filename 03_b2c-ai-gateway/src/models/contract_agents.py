from typing import List, Optional
from pydantic import BaseModel, Field
from src.models.contract import ContractComponent, ComparisonResult

class Agent1Facts(BaseModel):
    provider: Optional[str] = Field(default=None, description="Der Anbieter des Vertrages, z.B. Telekom, Vodafone")
    mainContractName: Optional[str] = Field(default=None, description="Der Name des Haupttarifs, z.B. MagentaZuhause M")
    durationMonths: Optional[int] = Field(default=None, description="Die reguläre Mindestvertragslaufzeit in Monaten, meist 24")
    autoRenewalMonths: Optional[int] = Field(default=None, description="Automatische Verlängerung in Monaten nach der Mindestlaufzeit, meist 1")
    cancellationPeriodMonths: Optional[int] = Field(default=None, description="Die Kündigungsfrist in Monaten (z.B. 1 für einen Monat vor Laufzeitende)")
    components: List[ContractComponent] = Field(default_factory=list, description="Alle erkannten Vertragsbestandteile")

class Agent2Advice(BaseModel):
    simpleSummary: Optional[str] = Field(default=None, description="Eine extrem leicht verständliche, laienhafte Zusammenfassung des Vertrags in 2-3 Sätzen.")
    targetAudienceGood: Optional[str] = Field(default=None, description="Für wen ist dieser Vertrag perfekt? (Z.B. 'Familien mit hohem Streaming-Bedarf')")
    targetAudienceBad: Optional[str] = Field(default=None, description="Für wen lohnt sich das nicht? (Z.B. 'Single-Haushalte, die nur Mails checken')")
    revocationAdvice: Optional[str] = Field(default=None, description="Kurzer Hinweis zum Widerrufsrecht (meist 14 Tage).")
    contactHotline: Optional[str] = Field(default=None, description="Die erkannte Support-Hotline oder E-Mail des Anbieters für Rückfragen.")
    telephonyRisks: Optional[str] = Field(default=None, description="Kurze Warnung über Telefonkosten, falls diese nicht in einer Flatrate enthalten und potenziell teuer sind.")
    comparisonResult: Optional[ComparisonResult] = Field(default=None, description="Vergleichsergebnis, WENN ein Altvertrag zur Verfügung stand")
