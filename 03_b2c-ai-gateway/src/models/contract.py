from typing import List, Optional, Literal
from pydantic import BaseModel, Field, model_validator

class PriceStage(BaseModel):
    startMonth: int = Field(..., ge=1, description="Der Startmonat dieser Preisstufe (1-basiert)")
    endMonth: int = Field(..., ge=1, description="Der Endmonat dieser Preisstufe. ACHTUNG: Bei 'ab dem X. Monat' oder 'dauerhaft' MUSST du 99 setzen!")
    amount: float = Field(..., description="Die monatlichen Kosten (oder monatlicher Rabatt als negativer Wert)")

    @model_validator(mode='after')
    def check_months(self) -> 'PriceStage':
        if self.endMonth < self.startMonth:
            raise ValueError('endMonth darf nicht kleiner als startMonth sein.')
        return self

class ContractComponent(BaseModel):
    name: str = Field(..., description="Name des Vertragsbestandteils, z.B. 'Grundgebühr' oder 'Router Miete'")
    category: Literal['Haupttarif', 'Hardware', 'Zusatzoption', 'Rabatt'] = Field(
        ..., 
        description="Die Kategorie. Du MUSST exakt eine der vorgegebenen Optionen wählen."
    )
    oneTimeCharge: float = Field(default=0.0, description="Einmalige Kosten (positiv) oder Einmal-Gutschriften (negativ)")
    prices: List[PriceStage] = Field(default_factory=list, description="Liste der monatlichen Preisstufen. Bei Einmalkosten MUSS diese Liste leer sein!")

class ComparisonResult(BaseModel):
    recommendation: str = Field(..., description="Die finale Empfehlung (Behalten, Wechseln, etc.)")
    explanation: str = Field(..., description="Begründung für die Empfehlung")
    differences: str = Field(..., description="Wichtigste Unterschiede zwischen Alt und Neu")

class ExtractedContractData(BaseModel):
    provider: Optional[str] = Field(default=None, description="Der Anbieter des Vertrages, z.B. Telekom, Vodafone")
    mainContractName: Optional[str] = Field(default=None, description="Der Name des Haupttarifs, z.B. MagentaZuhause M")
    durationMonths: Optional[int] = Field(default=None, description="Die reguläre Mindestvertragslaufzeit in Monaten, standardmäßig 24")
    autoRenewalMonths: Optional[int] = Field(default=None, description="Automatische Verlängerung in Monaten nach der Mindestlaufzeit, meist 1")
    simpleSummary: Optional[str] = Field(default=None, description="Eine extrem leicht verständliche, laienhafte Zusammenfassung des Vertrags in 2-3 Sätzen (ohne juristisches Kauderwelsch).")

    cancellationPeriodMonths: Optional[int] = Field(default=None, description="Die Kündigungsfrist in Monaten (z.B. 1 für einen Monat vor Laufzeitende)")
    
    targetAudienceGood: Optional[str] = Field(default=None, description="Für wen ist dieser Vertrag perfekt? (Z.B. 'Familien mit hohem Streaming-Bedarf')")
    targetAudienceBad: Optional[str] = Field(default=None, description="Für wen lohnt sich das nicht? (Z.B. 'Single-Haushalte, die nur Mails checken')")
    revocationAdvice: Optional[str] = Field(default=None, description="Kurzer Hinweis zum Widerrufsrecht (meist 14 Tage).")
    contactHotline: Optional[str] = Field(default=None, description="Die erkannte Support-Hotline oder E-Mail des Anbieters für Rückfragen.")
    telephonyRisks: Optional[str] = Field(default=None, description="Kurze Warnung über Telefonkosten (Ausland, Mobilfunk, pro Minute), falls diese nicht in einer Flatrate enthalten und potenziell teuer sind.")

    comparisonResult: Optional[ComparisonResult] = Field(default=None, description="Das Ergebnis des Vergleichs zwischen dem neuen Vertrag und dem Altvertrag")

    components: List[ContractComponent] = Field(default_factory=list, description="Alle erkannten Vertragsbestandteile")

    @model_validator(mode='after')
    def set_defaults(self) -> 'ExtractedContractData':
        if self.durationMonths is None:
            self.durationMonths = 24
        return self
