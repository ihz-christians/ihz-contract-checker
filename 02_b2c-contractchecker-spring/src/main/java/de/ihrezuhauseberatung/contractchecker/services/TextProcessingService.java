package de.ihrezuhauseberatung.contractchecker.services;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class TextProcessingService {

    private static final Pattern HYPHENATION_PATTERN = Pattern.compile("([a-zA-ZäöüÄÖÜß]+)-\\s*\\n\\s*([a-zA-ZäöüÄÖÜß]+)");
    private static final Pattern PAGINATION_PATTERN = Pattern.compile("(?im)^.{0,20}(?:seite|page)\\s*\\d+\\s*(?:von|/)\\s*\\d+.{0,20}$");
    private static final Pattern DASH_PAGINATION_PATTERN = Pattern.compile("(?m)^\\s*-\\s*\\d+\\s*-\\s*$");
    private static final Pattern VERSION_PATTERN = Pattern.compile("(?im)^.{0,20}(?:stand:|version)\\s*[\\d\\.\\s\\w]+.{0,20}$");
    private static final Pattern HORIZONTAL_SPACES = Pattern.compile("[ \t]+");
    private static final Pattern LINE_BREAKS = Pattern.compile("\\n{3,}");

    private static final Pattern VALID_CHARS = Pattern.compile("[\\w\\s.,;:!?§€()\"'\\-]");

    /**
     * Clean and validate raw extracted text.
     * Repairs hyphenations, filters headers/pagination, normalizes whitespace,
     * and guarantees document readability.
     */
    public String cleanAndValidate(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            throw new IllegalArgumentException("Garbage Content Detected: The document is too short or empty.");
        }

        // 1. Repair hyphenations
        String cleaned = HYPHENATION_PATTERN.matcher(rawText).replaceAll("$1$2");

        // 2. Filter paginations, margins, stand/versioning
        cleaned = PAGINATION_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = DASH_PAGINATION_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = VERSION_PATTERN.matcher(cleaned).replaceAll("");

        // 3. Normalize multiple spaces and breaks
        cleaned = HORIZONTAL_SPACES.matcher(cleaned).replaceAll(" ");
        
        // 4. Struktur-Optimierung für OCR-Tabellen und Paragraphen
        cleaned = structureOcrText(cleaned);

        cleaned = cleaned.trim();

        // 5. Minimum length validation
        if (cleaned.length() < 100) {
            throw new IllegalArgumentException("Garbage Content Detected: The document is too short or empty.");
        }

        // 6. Special characters garbage check
        int cleanLen = cleaned.length();
        int validCharCount = 0;
        for (int i = 0; i < cleanLen; i++) {
            char c = cleaned.charAt(i);
            if (VALID_CHARS.matcher(String.valueOf(c)).matches() || isGermanUmlaut(c)) {
                validCharCount++;
            }
        }

        int specialCharsCount = cleanLen - validCharCount;
        double garbageRatio = (double) specialCharsCount / cleanLen;
        if (garbageRatio > 0.15) {
            throw new IllegalArgumentException(String.format(
                    "Garbage Content Detected: Too many special characters (%.1f%%).", garbageRatio * 100));
        }

        return cleaned;
    }

    /**
     * Gruppiert lose OCR-Zeilen zu sinnvollen Blöcken, um dem LLM das Lesen von zerstückelten
     * Rechnungen und Tabellen zu vereinfachen.
     */
    private String structureOcrText(String text) {
        String[] lines = text.split("\\n");
        StringBuilder structuredText = new StringBuilder();
        
        structuredText.append("--- BEGINN DOKUMENT ---\n\n");
        
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) {
                continue; // Überspringe Leerzeilen
            }

            // Wenn die Zeile extrem kurz ist (oft ein Preis oder ein Datum) oder mit einem Währungszeichen endet
            // Hängen wir sie mit einem Tab-Abstand an die vorherige Zeile an (Tabellen-Simulation)
            if (line.matches("^[\\d.,€\\s\\-]+$") || line.length() < 15) {
                structuredText.append(" | ").append(line);
            } 
            // Wenn die Zeile mit typischen Überschriften-Schlüsselwörtern beginnt, erzwingen wir einen Absatz
            else if (line.matches("^(?i)(tarif|preise|kosten|laufzeit|kündigung|option|summe).*")) {
                structuredText.append("\n\n[ BEREICH: ").append(line.toUpperCase()).append(" ]\n");
            } 
            // Normaler Satz/Absatz
            else {
                // Falls vorher eine Pipe war, machen wir einen neuen Block auf
                if (structuredText.toString().endsWith(" | ")) {
                    structuredText.append("\n");
                } else if (!structuredText.toString().endsWith("\n") && !structuredText.toString().endsWith("]\n")) {
                    structuredText.append(" ");
                }
                structuredText.append(line);
            }
        }
        
        structuredText.append("\n\n--- ENDE DOKUMENT ---");
        
        // Entferne doppelte Leerzeichen und normiere mehrfache Zeilenumbrüche
        String result = structuredText.toString();
        result = result.replaceAll(" \\| \\| ", " | ");
        result = LINE_BREAKS.matcher(result).replaceAll("\n\n");
        
        return result;
    }

    private boolean isGermanUmlaut(char c) {
        return c == 'ä' || c == 'ö' || c == 'ü' || c == 'Ä' || c == 'Ö' || c == 'Ü' || c == 'ß';
    }

    /**
     * Semantic Chunker for RAG context extraction.
     * Snaps cleanly to the end of sentences or paragraphs instead of cutting blindly.
     */
    public List<String> chunkText(String text, int maxChars, int overlapChars) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.trim().isEmpty()) {
            return chunks;
        }

        int totalChars = text.length();
        int start = 0;

        while (start < totalChars) {
            int end = Math.min(start + maxChars, totalChars);

            // Semantic snapping if we are not at the absolute end of the file
            if (end < totalChars) {
                // Try snapping to paragraph break
                int paraBreak = text.lastIndexOf("\n\n", end);
                if (paraBreak != -1 && paraBreak > start + (maxChars / 2)) {
                    end = paraBreak;
                } else {
                    // Fallback snapping to sentence end
                    int sentBreak = text.lastIndexOf(". ", end);
                    if (sentBreak != -1 && sentBreak > start + (maxChars / 2)) {
                        end = sentBreak + 1; // include period
                    }
                }
            }

            String chunkContent = text.substring(start, end).trim();
            if (!chunkContent.isEmpty()) {
                chunks.add(chunkContent);
            }

            // Move pointer forward considering overlapping rules
            int actualLength = end - start;
            if (actualLength <= overlapChars || end == totalChars) {
                start = end;
            } else {
                start = end - overlapChars;
            }
        }

        return chunks;
    }
}
