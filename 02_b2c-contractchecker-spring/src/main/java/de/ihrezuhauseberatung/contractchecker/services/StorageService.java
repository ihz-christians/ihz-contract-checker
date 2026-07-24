package de.ihrezuhauseberatung.contractchecker.services;

public interface StorageService {
    
    /**
     * Uploads a file to the cloud storage and returns its persistent URI or path.
     *
     * @param objectName The unique object name/path in the bucket.
     * @param content The file content as a byte array.
     * @param contentType The MIME type of the file.
     * @return The stored persistent path/URI reference.
     */
    String uploadFile(String objectName, byte[] content, String contentType);

    /**
     * Downloads a file from the cloud storage.
     *
     * @param objectName The unique object name/path in the bucket.
     * @return The file content as a byte array.
     */
    byte[] downloadFile(String objectName);

    /**
     * Deletes a file from the cloud storage.
     *
     * @param objectName The unique object name/path in the bucket.
     */
    void deleteFile(String objectName);
}
