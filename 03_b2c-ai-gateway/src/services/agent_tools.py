def execute_legal_action(
    intent: str,
    provider_name: str,
    customer_number: str = None,
    action_date: str = "zum nächstmöglichen Zeitpunkt",
    is_complete: bool = False,
    missing_info_prompt: str = None
) -> str:
    """
    Diese Funktion MUSS aufgerufen werden, sobald der Nutzer eine Kündigung, einen Widerruf oder einen Tarifwechsel/Downgrade (Runterstufen) verlangt.
    Sammle alle fehlenden Daten vom Nutzer, bevor du is_complete auf True setzt.
    
    Args:
        intent: Die Art der Aktion. Muss einer dieser Werte sein: 'cancellation' (Kündigung), 'revocation' (Widerruf), 'downgrade' (Runterstufen).
        provider_name: Der Name des Anbieters (z.B. Vodafone, Telekom).
        customer_number: Die Kundennummer oder Vertragsnummer. Zwingend erforderlich für Kündigungen!
        action_date: Das gewünschte Datum der Aktion (z.B. 'zum nächstmöglichen Zeitpunkt').
        is_complete: Setze dies auf True, wenn ALLE erforderlichen Daten (insbesondere customer_number) vorhanden sind. Setze es auf False, wenn noch Infos vom Nutzer fehlen.
        missing_info_prompt: Falls is_complete False ist, schreibe hier eine freundliche Nachricht an den Nutzer, in der du genau nach der fehlenden Information (z.B. Kundennummer) fragst.
    """
    # This is a dummy implementation for the LLM tool definition.
    # The actual execution happens by parsing the function call response.
    return "Action parsed"
