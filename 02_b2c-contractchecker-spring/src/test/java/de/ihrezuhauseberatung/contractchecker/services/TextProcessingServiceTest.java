package de.ihrezuhauseberatung.contractchecker.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TextProcessingServiceTest {

    private TextProcessingService textService;

    @BeforeEach
    void setUp() {
        textService = new TextProcessingService();
    }

    @Test
    void cleanAndValidate_RepairsHyphenation() {
        // Arrange
        String input = "Der Anbieter wird den Vertrag kündi-\n   gungstechnisch abwickeln. " +
                       "Dieses Dokument hat eine ausreichende Mindestlänge von über einhundert Zeichen, " +
                       "um die Validierungsschranken der Waschmaschine erfolgreich zu passieren.";

        // Act
        String result = textService.cleanAndValidate(input);

        // Assert
        assertThat(result).contains("kündigungstechnisch");
    }

    @Test
    void cleanAndValidate_RemovesPageNumbersAndVersionHeaders() {
        // Arrange
        String input = "Vertrag Inhalt\nSeite 1 von 10\nMehr Inhalt\n- 5 -\nNoch mehr Inhalt\nStand: 12.10.2024\nEnde. " +
                       "Dieses Dokument hat eine ausreichende Mindestlänge von über einhundert Zeichen, " +
                       "um die Validierungsschranken der Waschmaschine erfolgreich zu passieren.";

        // Act
        String result = textService.cleanAndValidate(input);

        // Assert
        assertThat(result).doesNotContain("Seite 1 von 10");
        assertThat(result).doesNotContain("- 5 -");
        assertThat(result).doesNotContain("Stand: 12.10.2024");
        assertThat(result).contains("Vertrag Inhalt");
    }

    @Test
    void cleanAndValidate_NormalizesWhitespaces() {
        // Arrange
        String input = "Vertrag    mit   vielen     Leerzeichen.\n\n\n\nNeue Zeile. " +
                       "Dieses Dokument hat eine ausreichende Mindestlänge von über einhundert Zeichen, " +
                       "um die Validierungsschranken der Waschmaschine erfolgreich zu passieren.";

        // Act
        String result = textService.cleanAndValidate(input);

        // Assert
        assertThat(result).contains("Vertrag mit vielen Leerzeichen.");
    }

    @Test
    void cleanAndValidate_TooShort_ThrowsException() {
        // Arrange
        String input = "Kurzer Text";

        // Act & Assert
        assertThatThrownBy(() -> textService.cleanAndValidate(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("too short");
    }

    @Test
    void cleanAndValidate_HighGarbageRatio_ThrowsException() {
        // Arrange
        String input = "%%% $$$ @@@ !!! ### %%% $$$ @@@ !!! ### %%% $$$ @@@ !!! ### %%% $$$ @@@ !!! ### %%% $$$ @@@ !!! ### %%% $$$ @@@ !!! ### %%% $$$ @@@ !!! ###";

        // Act & Assert
        assertThatThrownBy(() -> textService.cleanAndValidate(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("special characters");
    }

    @Test
    void chunkText_SemanticSnapping() {
        // Arrange: Build a text with paragraph endings
        String text = "Paragraph One content is very long but interesting.\n\n" +
                      "Paragraph Two content is also extremely long and interesting.\n\n" +
                      "Paragraph Three content completes the agreement.";

        // Act: max size of 60 chars should snap semantic chunks
        List<String> chunks = textService.chunkText(text, 65, 10);

        // Assert
        assertThat(chunks).isNotEmpty();
        // The first chunk must snap cleanly to the end of Paragraph One instead of cutting midway
        assertThat(chunks.get(0)).isEqualTo("Paragraph One content is very long but interesting.");
    }
}
