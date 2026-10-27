package com.java.vinod.authorization.server.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

@RestController
public class ProfileImageAssetController {
    private static final String BASE_PATH = "/v1/assets/profile-images/";

    private final Path localStorageDirectory;

    public ProfileImageAssetController(@Value("${app.profile-image-storage.local-directory:}") String configuredLocalStorageDirectory) {
        this.localStorageDirectory = StringUtils.hasText(configuredLocalStorageDirectory)
                ? Path.of(configuredLocalStorageDirectory)
                : Path.of(System.getProperty("java.io.tmpdir"), "sharity-profile-images");
    }

    @GetMapping("/v1/assets/profile-images/**")
    public ResponseEntity<ByteArrayResource> image(HttpServletRequest request) throws IOException {
        String requestPath = request.getRequestURI();
        int baseIndex = requestPath.indexOf(BASE_PATH);
        if (baseIndex < 0) {
            return ResponseEntity.notFound().build();
        }

        String relativePath = requestPath.substring(baseIndex + BASE_PATH.length());
        if (!StringUtils.hasText(relativePath) || relativePath.contains("..")) {
            return ResponseEntity.notFound().build();
        }

        Path resolvedPath = localStorageDirectory.resolve(relativePath).normalize();
        if (!resolvedPath.startsWith(localStorageDirectory.normalize()) || !Files.exists(resolvedPath) || Files.isDirectory(resolvedPath)) {
            return ResponseEntity.notFound().build();
        }

        byte[] bytes = Files.readAllBytes(resolvedPath);
        String contentType = Files.probeContentType(resolvedPath);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (StringUtils.hasText(contentType)) {
            mediaType = MediaType.parseMediaType(contentType);
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resolvedPath.getFileName() + "\"")
                .body(new ByteArrayResource(bytes));
    }
}
