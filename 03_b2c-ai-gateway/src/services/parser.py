import os
import fitz  # PyMuPDF
import logging

logger = logging.getLogger(__name__)

class DocumentParser:
    """
    Kapselt die Logik für die Extraktion von Text und Layout aus PDFs.
    Dies ist das "Auge" des Systems, bevor die KI zum Einsatz kommt.
    """

    def extract_layout_text(self, file_path: str) -> str:
        """
        Extrahiert den Text aus einem PDF unter Beibehaltung der Layout-Reihenfolge.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at path: {file_path}")

        try:
            doc = fitz.open(file_path)
            extracted_blocks = []

            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                # Wir nutzen hier den "text" mode, aber wir säubern ihn, um Tabellen-Zerstückelung zu verhindern.
                # PyMuPDF's "blocks" ist oft zu grob für komplexe Tabellen.
                page_text = page.get_text("text")
                
                # Wir splitten den Text in Zeilen und filtern komplett leere Zeilen raus
                lines = page_text.split('\n')
                cleaned_lines = []
                
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith("[ BEREICH:") and not line.startswith("--- BEGINN") and not line.startswith("--- ENDE"):
                        # Wenn die Zeile sehr kurz ist (z.B. nur ein Preis oder ein Datum aus einer Tabelle), 
                        # hängen wir sie an die vorherige Zeile an, getrennt durch ein Pipe-Symbol, 
                        # um die logische Zusammengehörigkeit von Tabellen-Zellen für das LLM zu bewahren!
                        if len(line) < 15 and cleaned_lines and not line.endswith("€") and not cleaned_lines[-1].endswith("€"):
                            cleaned_lines[-1] = f"{cleaned_lines[-1]} | {line}"
                        else:
                            cleaned_lines.append(line)
                            
                extracted_blocks.extend(cleaned_lines)

            doc.close()
            # Wir verbinden die gesäuberten Zeilen mit einem einfachen Umbruch
            return "\n".join(extracted_blocks)

        except Exception as e:
            logger.error(f"Failed to parse PDF {file_path}: {str(e)}")
            raise RuntimeError(f"PDF parsing error: {str(e)}")
