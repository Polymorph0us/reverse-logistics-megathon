package com.pharma.reversechain.service;

import java.io.InputStream;
import java.nio.file.Path;

/**
 * Interface for file storage operations.
 * Current implementation: LocalFileStorageService
 * Future: S3StorageService can be added behind this interface
 */
public interface FileStorageService {
    
    /**
     * Store a file and return its storage reference (relative path or key)
     */
    String store(InputStream inputStream, String filename, String contentType) throws Exception;
    
    /**
     * Retrieve a file as a Path
     */
    Path load(String storageReference) throws Exception;
    
    /**
     * Delete a file by its storage reference
     */
    void delete(String storageReference) throws Exception;
    
    /**
     * Check if a file exists
     */
    boolean exists(String storageReference);
}
