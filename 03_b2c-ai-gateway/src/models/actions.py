from typing import Optional, Literal
from pydantic import BaseModel, Field

class LegalActionData(BaseModel):
    """
    Structured data required to execute a legal action (cancellation, revocation).
    This model serves as the expected tool output from the LLM.
    """
    intent: Literal["cancellation", "revocation", "downgrade"] = Field(
        ..., 
        description="The type of legal action the user wants to execute."
    )
    provider_name: str = Field(
        ..., 
        description="The name of the contract provider (e.g. 'Vodafone', 'Telekom')."
    )
    customer_number: Optional[str] = Field(
        default=None, 
        description="The customer number (Kundennummer) or contract number (Vertragsnummer) if provided by the user."
    )
    action_date: Optional[str] = Field(
        default="zum nächstmöglichen Zeitpunkt", 
        description="The target date for the action (e.g., 'zum nächstmöglichen Zeitpunkt', 'sofort', or a specific date)."
    )
    is_complete: bool = Field(
        default=False,
        description="Set to true ONLY if provider_name AND customer_number are explicitly provided."
    )
    missing_info_prompt: Optional[str] = Field(
        default=None,
        description="If is_complete is False, provide a friendly message asking the user for the missing information (e.g., 'Um die Kündigung für Vodafone fertigzustellen, benötige ich noch deine Kundennummer.')."
    )
