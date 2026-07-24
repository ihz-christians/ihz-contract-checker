package de.ihrezuhauseberatung.contractchecker.services;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Profile;


import java.util.logging.Logger;

@Service
@Profile({"prod", "stage"})

public class GoogleCloudStorageService implements StorageService {

    private static final Logger logger = Logger.getLogger(GoogleCloudStorageService.class.getName());

    private final Storage storage;
    private final String bucketName;

    public GoogleCloudStorageService(
            Storage storage,
            @Value("${gcp.storage.bucket:cc-contracts-bucket}") String bucketName) {
        this.storage = storage;
        this.bucketName = bucketName;
    }

    @Override
    public String uploadFile(String objectName, byte[] content, String contentType) {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Datei-Inhalt darf nicht leer sein");
        }
        
        BlobId blobId = BlobId.of(bucketName, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(contentType)
                .build();

        logger.info("Hochladen in Google Cloud Storage: " + bucketName + "/" + objectName);
        storage.create(blobInfo, content);
        
        // Return standard gs:// URI format to represent the reference cleanly
        return String.format("gs://%s/%s", bucketName, objectName);
    }

    @Override
    public byte[] downloadFile(String objectName) {
        BlobId blobId = BlobId.of(bucketName, objectName);
        Blob blob = storage.get(blobId);
        if (blob == null) {
            throw new IllegalStateException("Datei nicht gefunden in GCS: " + objectName);
        }
        return blob.getContent();
    }

    @Override
    public void deleteFile(String objectName) {
        BlobId blobId = BlobId.of(bucketName, objectName);
        boolean deleted = storage.delete(blobId);
        if (deleted) {
            logger.info("Erfolgreich gelöscht aus GCS: " + objectName);
        } else {
            logger.warning("Datei konnte nicht gelöscht werden oder existierte nicht: " + objectName);
        }
    }
}
