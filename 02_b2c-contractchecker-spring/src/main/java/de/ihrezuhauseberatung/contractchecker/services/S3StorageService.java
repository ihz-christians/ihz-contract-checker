package de.ihrezuhauseberatung.contractchecker.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@Profile({"dev", "test"})
public class S3StorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3StorageService.class);

    private final S3Client s3Client;
    private final String bucketName;
    private final String endpoint;

    public S3StorageService(S3Client s3Client, 
                            @Value("${cloud.storage.bucket-name:b2c-contracts}") String bucketName,
                            @Value("${cloud.storage.s3.endpoint:http://localhost:9000}") String endpoint) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.endpoint = endpoint;
    }

    @Override
    public String uploadFile(String objectName, byte[] content, String contentType) {
        ensureBucketExists();

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectName)
                .contentType(contentType)
                .build();

        s3Client.putObject(putRequest, RequestBody.fromBytes(content));
        
        // Generiere eine saubere S3 URI für das Python Gateway (boto3)
        String s3Uri = "s3://" + bucketName + "/" + objectName;
        log.info("Uploaded file to MinIO S3: {}", s3Uri);
        return s3Uri;
    }

    @Override
    public byte[] downloadFile(String objectName) {
        // Falls die volle URI übergeben wurde, schneiden wir das s3://bucket/ ab.
        String key = objectName;
        if (key.startsWith("s3://")) {
            key = key.replace("s3://" + bucketName + "/", "");
        }

        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        return s3Client.getObjectAsBytes(getRequest).asByteArray();
    }

    @Override
    public void deleteFile(String objectName) {
        String key = objectName;
        if (key.startsWith("s3://")) {
            key = key.replace("s3://" + bucketName + "/", "");
        }

        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        s3Client.deleteObject(deleteRequest);
        log.info("Deleted file from MinIO S3: {}", key);
    }

    private void ensureBucketExists() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
        } catch (NoSuchBucketException e) {
            log.info("Bucket '{}' existiert nicht. Erstelle ihn nun automatisch...", bucketName);
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
            log.info("Bucket '{}' erfolgreich erstellt.", bucketName);
        }
    }
}
