import pytest
from pydantic import ValidationError
from src.models.contract import ExtractedContractData, ContractComponent, PriceStage

def test_contract_component_valid_categories():
    # Gültige Kategorien müssen funktionieren
    comp = ContractComponent(
        name="MagentaZuhause M",
        category="Haupttarif",
        oneTimeCharge=39.99,
        prices=[PriceStage(startMonth=1, endMonth=24, amount=39.99)]
    )
    assert comp.category == "Haupttarif"

def test_contract_component_invalid_category_rejected():
    # Wenn die KI "Tarif" statt "Haupttarif" antwortet, MUSS das System dies blockieren/Exception werfen.
    # (In der Realität fängt 'instructor' diesen Fehler ab und zwingt das LLM zu einem Retry).
    with pytest.raises(ValidationError) as exc:
        ContractComponent(
            name="MagentaZuhause M",
            category="Tarif", # Falsch!
            oneTimeCharge=39.99,
            prices=[]
        )
    assert "Input should be 'Haupttarif', 'Hardware', 'Zusatzoption' or 'Rabatt'" in str(exc.value)

def test_price_stage_validation():
    # Startmonat darf nicht nach Endmonat liegen
    with pytest.raises(ValidationError) as exc:
        PriceStage(startMonth=12, endMonth=6, amount=19.99)
    assert "endMonth darf nicht kleiner als startMonth sein" in str(exc.value)

def test_perfect_extracted_data_structure():
    # Ein simuliertes, perfekt extrahiertes KI-Ergebnis mit den neuen Consumer-Feldern
    data = ExtractedContractData(
        provider="Telekom",
        mainContractName="MagentaZuhause M",
        durationMonths=12, # z.B. 12 Monate Mindestlaufzeit
        autoRenewalMonths=1,
        cancellationPeriodMonths=1,
        simpleSummary="Ein 12-Monats-Vertrag für Internet.",
        targetAudienceGood="Familien",
        targetAudienceBad="Wenignutzer",
        revocationAdvice="14 Tage Widerruf.",
        contactHotline="0800 12345",
        telephonyRisks="Anrufe ins Ausland kosten 99 Cent/Min.",
        components=[
            ContractComponent(
                name="Grundgebühr",
                category="Haupttarif",
                oneTimeCharge=39.99, # Anschlussgebühr
                prices=[
                    PriceStage(startMonth=1, endMonth=6, amount=19.99), # Aktionszeitraum
                    PriceStage(startMonth=7, endMonth=12, amount=39.99) # Regulärer Preis
                ]
            ),
            ContractComponent(
                name="Speedport Smart 4",
                category="Hardware",
                oneTimeCharge=6.99, # Versand
                prices=[
                    PriceStage(startMonth=1, endMonth=12, amount=6.95) # Monatliche Miete
                ]
            ),
            ContractComponent(
                name="Online-Vorteil",
                category="Rabatt",
                oneTimeCharge=-100.00, # 100 Euro Gutschrift
                prices=[]
            )
        ]
    )
    
    assert len(data.components) == 3
    assert data.components[2].category == "Rabatt"
    assert data.components[2].oneTimeCharge == -100.00
    assert data.telephonyRisks == "Anrufe ins Ausland kosten 99 Cent/Min."
    assert data.durationMonths == 12
