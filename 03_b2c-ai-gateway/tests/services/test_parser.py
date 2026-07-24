import pytest
from src.services.parser import DocumentParser

def test_extract_text_from_valid_pdf(tmp_path):
    # Arrange: Wir erstellen ein sehr simples Dummy-PDF zum Testen der Funktionalität
    import fitz  # PyMuPDF
    dummy_pdf_path = tmp_path / "dummy_contract.pdf"
    
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(fitz.Point(50, 50), "Vertragslaufzeit: 24 Monate")
    page.insert_text(fitz.Point(50, 70), "Grundpreis: 39,99 EUR")
    doc.save(str(dummy_pdf_path))
    doc.close()

    parser = DocumentParser()

    # Act
    extracted_text = parser.extract_layout_text(str(dummy_pdf_path))

    # Assert
    assert extracted_text is not None
    assert "Vertragslaufzeit: 24 Monate" in extracted_text
    assert "Grundpreis: 39,99 EUR" in extracted_text

def test_parser_handles_non_existent_file():
    parser = DocumentParser()
    
    with pytest.raises(FileNotFoundError) as exc_info:
        parser.extract_layout_text("does_not_exist.pdf")
        
    assert "not found" in str(exc_info.value).lower()
