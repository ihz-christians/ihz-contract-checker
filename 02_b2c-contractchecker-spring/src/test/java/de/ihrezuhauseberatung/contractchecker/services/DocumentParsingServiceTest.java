package de.ihrezuhauseberatung.contractchecker.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DocumentParsingServiceTest {

    private DocumentParsingService parsingService;

    @BeforeEach
    void setUp() {
        parsingService = new DocumentParsingService();
    }

    @Test
    void extractText_FromTxtFile_Success(@TempDir Path tempDir) throws IOException {
        // Arrange
        Path file = tempDir.resolve("test_contract.txt");
        String content = "Vertrag über Internet-Dienstleistungen. 24 Monate Laufzeit.";
        Files.writeString(file, content);

        // Act
        String result = parsingService.extractText(file.toString());

        // Assert
        assertThat(result).isEqualTo(content);
    }

    @Test
    void extractText_FromBytes_Txt_Success() throws IOException {
        // Arrange
        String content = "Text from byte array!";
        byte[] bytes = content.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        // Act
        String result = parsingService.extractText(bytes, "my_file.txt");

        // Assert
        assertThat(result).isEqualTo(content);
    }

    @Test
    void extractText_FromBytes_Empty_ThrowsException() {
        // Act & Assert
        assertThatThrownBy(() -> parsingService.extractText(new byte[0], "my_file.txt"))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("Inhalt ist leer");
    }

    @Test
    void extractText_NonExistentFile_ThrowsException() {
        // Act & Assert
        assertThatThrownBy(() -> parsingService.extractText("non_existent_file.pdf"))
                .isInstanceOf(IOException.class);
    }
}
