package com.pharma.reversechain.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Slf4j
@Service
public class LocalFileStorageService implements FileStorageService {

    private final Path storageLocation;

    public LocalFileStorageService(@Value("${file.storage.location:./storage}") String storageLocation) throws IOException {
        this.storageLocation = Paths.get(storageLocation).toAbsolutePath().normalize();
        Files.createDirectories(this.storageLocation);
        log.info("Local file storage initialized at: {}", this.storageLocation);
    }

    @Override
    public String store(InputStream inputStream, String filename, String contentType) throws Exception {
        if (filename == null || filename.trim().isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be null or empty");
        }
        
        // Sanitize filename to prevent directory traversal
        String sanitizedFilename = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path targetLocation = this.storageLocation.resolve(sanitizedFilename);
        
        Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        log.info("Stored file: {}", sanitizedFilename);
        
        return sanitizedFilename;
    }

    @Override
    public Path load(String storageReference) throws Exception {
        Path filePath = this.storageLocation.resolve(storageReference).normalize();
        
        if (!filePath.startsWith(this.storageLocation)) {
            throw new SecurityException("Access denied: path traversal attempt detected");
        }
        
        if (!Files.exists(filePath)) {
            throw new IOException("File not found: " + storageReference);
        }
        
        return filePath;
    }

    @Override
    public void delete(String storageReference) throws Exception {
        Path filePath = this.storageLocation.resolve(storageReference).normalize();
        
        if (!filePath.startsWith(this.storageLocation)) {
            throw new SecurityException("Access denied: path traversal attempt detected");
        }
        
        Files.deleteIfExists(filePath);
        log.info("Deleted file: {}", storageReference);
    }

    @Override
    public boolean exists(String storageReference) {
        Path filePath = this.storageLocation.resolve(storageReference).normalize();
        return filePath.startsWith(this.storageLocation) && Files.exists(filePath);
    }
}
