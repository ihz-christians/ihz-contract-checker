package de.ihrezuhauseberatung.contractchecker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

@Configuration
@Profile({"dev", "test"})
public class S3StorageConfig {

    @Value("${cloud.storage.s3.endpoint:http://localhost:9000}")
    private String endpoint;

    @Value("${cloud.storage.s3.access-key:minioadmin}")
    private String accessKey;

    @Value("${cloud.storage.s3.secret-key:minioadmin123}")
    private String secretKey;

    @Value("${cloud.storage.s3.region:eu-central-1}")
    private String region;

    @Value("${cloud.storage.s3.path-style-access:true}")
    private boolean pathStyleAccess;

    @Bean
    public S3Client s3Client() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                // Wichtig für MinIO: Path-Style erzwingen, da keine virtuellen Hosts existieren!
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(pathStyleAccess).build())
                .build();
    }
}
