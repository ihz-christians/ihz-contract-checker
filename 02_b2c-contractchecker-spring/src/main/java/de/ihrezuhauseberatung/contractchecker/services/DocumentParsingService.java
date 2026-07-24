package de.ihrezuhauseberatung.contractchecker.services;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class DocumentParsingService {

    public String extractText(byte[] content, String filename) throws IOException {
        if (content == null || content.length == 0) {
            throw new IOException("Datei-Inhalt ist leer");
        }
        if (filename == null || filename.trim().isEmpty()) {
            throw new IOException("Ungültiger Dateiname");
        }

        String lowerFilename = filename.toLowerCase();

        if (lowerFilename.endsWith(".pdf")) {
            return extractTextFromPdf(content);
        } else if (lowerFilename.endsWith(".txt")) {
            return new String(content, StandardCharsets.UTF_8);
        } else {
            // Generic fallback
            try {
                return new String(content, StandardCharsets.UTF_8);
            } catch (Exception e) {
                throw new IOException("Nicht unterstütztes Format für die In-Memory-Extraktion: " + filename);
            }
        }
    }

    public String extractText(String filepath) throws IOException {
        if (filepath == null || filepath.trim().isEmpty()) {
            throw new IOException("Ungültiger Dateipfad");
        }

        Path path = Paths.get(filepath);
        if (!Files.exists(path)) {
            throw new IOException("Datei existiert nicht: " + filepath);
        }

        String lowerPath = filepath.toLowerCase();

        if (lowerPath.endsWith(".pdf")) {
            return extractTextFromPdf(path.toFile());
        } else if (lowerPath.endsWith(".txt")) {
            return Files.readString(path);
        } else {
            // Fallback for docx or generic files: read as string if we can, or throw
            try {
                return Files.readString(path);
            } catch (Exception e) {
                throw new IOException("Nicht unterstütztes Dateiformat für die Text-Extraktion: " + filepath);
            }
        }
    }

    private String extractTextFromPdf(byte[] content) throws IOException {
        try (PDDocument document = PDDocument.load(content)) {
            if (document.isEncrypted()) {
                throw new IOException("Verschlüsselte PDFs werden nicht unterstützt");
            }
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            if (text == null) {
                return "";
            }
            return text.trim();
        }
    }

    private String extractTextFromPdf(File file) throws IOException {
        try (PDDocument document = PDDocument.load(file)) {
            if (document.isEncrypted()) {
                throw new IOException("Verschlüsselte PDFs werden nicht unterstützt");
            }
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            if (text == null) {
                return "";
            }
            return text.trim();
        }
    }
}
