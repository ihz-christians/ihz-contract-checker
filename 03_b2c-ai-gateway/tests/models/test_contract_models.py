import pytest
from pydantic import ValidationError
from src.models.contract import ExtractedContractData, ContractComponent, PriceStage

def test_price_stage_validation():
    # Arrange & Act: Ein valides PriceStage Modell erstellen
    stage = PriceStage(startMonth=1, endMonth=12, amount=19.99)
    
    # Assert
    assert stage.startMonth == 1
    assert stage.endMonth == 12
    assert stage.amount == 19.99

def test_price_stage_rejects_invalid_types():
    # Wir erwarten, dass Pydantic hart abbricht, wenn der Preis ein String ist, 
    # der nicht in einen Float konvertiert werden kann.
    with pytest.raises(ValidationError) as exc_info:
        PriceStage(startMonth=1, endMonth=12, amount="kein_preis")
    
    # Assert
    assert "Input should be a valid number" in str(exc_info.value)
    
    # Startmonat darf nicht negativ sein (wir werden das in Pydantic konfigurieren)
    with pytest.raises(ValidationError) as exc_info_month:
        PriceStage(startMonth=-5, endMonth=12, amount=10.0)
    
    assert "Input should be greater than or equal to 1" in str(exc_info_month.value)

def test_contract_component_validation():
    # Arrange & Act
    component = ContractComponent(
        name="Router",
        category="Hardware",
        oneTimeCharge=49.99,
        prices=[PriceStage(startMonth=1, endMonth=24, amount=4.99)]
    )
    
    # Assert
    assert component.name == "Router"
    assert component.oneTimeCharge == 49.99
    assert len(component.prices) == 1

def test_extracted_contract_data_validation():
    # Arrange & Act
    data = ExtractedContractData(
        provider="Telekom",
        mainContractName="MagentaZuhause",
        durationMonths=24,
        autoRenewalMonths=1,
        components=[
            ContractComponent(
                name="Grundgebühr",
                category="Haupttarif",
                oneTimeCharge=0.0,
                prices=[PriceStage(startMonth=1, endMonth=24, amount=39.99)]
            )
        ]
    )
    
    # Assert
    assert data.provider == "Telekom"
    assert data.durationMonths == 24
    assert len(data.components) == 1
    assert data.components[0].category == "Haupttarif"
