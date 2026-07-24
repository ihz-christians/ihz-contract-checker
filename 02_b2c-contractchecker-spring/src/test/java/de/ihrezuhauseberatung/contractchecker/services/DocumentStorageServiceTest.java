package de.ihrezuhauseberatung.contractchecker.services;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentStorageServiceTest {

    @Mock
    private Storage googleStorage;

    @Mock
    private Blob mockBlob;

    private GoogleCloudStorageService storageService;
    private final String bucketName = "cc-contracts-bucket";

    @BeforeEach
    void setUp() {
        storageService = new GoogleCloudStorageService(googleStorage, bucketName);
    }

    @Test
    void uploadFile_Success() {
        // Arrange
        String objectName = "contracts/user1/test_doc.pdf";
        byte[] content = "PDF Content Dummy".getBytes(StandardCharsets.UTF_8);
        String contentType = "application/pdf";

        // Act
        String resultUri = storageService.uploadFile(objectName, content, contentType);

        // Assert
        assertThat(resultUri).isEqualTo("gs://" + bucketName + "/" + objectName);
        verify(googleStorage, times(1)).create(any(BlobInfo.class), eq(content));
    }

    @Test
    void uploadFile_EmptyContent_ThrowsException() {
        // Act & Assert
        assertThatThrownBy(() -> storageService.uploadFile("test.pdf", new byte[0], "application/pdf"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Datei-Inhalt darf nicht leer sein");
    }

    @Test
    void downloadFile_Success() {
        // Arrange
        String objectName = "contracts/user1/test_doc.pdf";
        byte[] expectedContent = "PDF Content Dummy".getBytes(StandardCharsets.UTF_8);
        BlobId blobId = BlobId.of(bucketName, objectName);
        
        when(googleStorage.get(blobId)).thenReturn(mockBlob);
        when(mockBlob.getContent()).thenReturn(expectedContent);

        // Act
        byte[] result = storageService.downloadFile(objectName);

        // Assert
        assertThat(result).isEqualTo(expectedContent);
        verify(googleStorage, times(1)).get(blobId);
    }

    @Test
    void downloadFile_NotFound_ThrowsException() {
        // Arrange
        String objectName = "contracts/user1/non_existent.pdf";
        BlobId blobId = BlobId.of(bucketName, objectName);
        when(googleStorage.get(blobId)).thenReturn(null);

        // Act & Assert
        assertThatThrownBy(() -> storageService.downloadFile(objectName))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Datei nicht gefunden");
    }

    @Test
    void deleteFile_Success() {
        // Arrange
        String objectName = "contracts/user1/test_doc.pdf";
        BlobId blobId = BlobId.of(bucketName, objectName);
        when(googleStorage.delete(blobId)).thenReturn(true);

        // Act
        storageService.deleteFile(objectName);

        // Assert
        verify(googleStorage, times(1)).delete(blobId);
    }
}
