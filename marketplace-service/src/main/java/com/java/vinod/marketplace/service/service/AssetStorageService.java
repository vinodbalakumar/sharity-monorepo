package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.dto.AssetDtos;
import com.java.vinod.marketplace.service.entity.Asset;
import com.java.vinod.marketplace.service.entity.AssetStorageProvider;
import com.java.vinod.marketplace.service.entity.AssetUploadEvent;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.repository.AssetRepository;
import com.java.vinod.marketplace.service.repository.AssetStorageProviderRepository;
import com.java.vinod.marketplace.service.repository.AssetUploadEventRepository;
import com.java.vinod.marketplace.service.repository.ListingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AssetStorageService {
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/svg+xml");

    private final AssetRepository assetRepository;
    private final AssetUploadEventRepository assetUploadEventRepository;
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    private final ListingRepository listingRepository;
    private final AssetStorageProviderRepository assetStorageProviderRepository;
    private final String providerCode;
    private final String bucketName;
    private final String endpointUrl;
    private final String publicBaseUrl;
    private final String region;
    private final String accessKeyId;
    private final String secretAccessKey;
    private final long maxFileSizeBytes;

    public AssetStorageService(AssetRepository assetRepository,
                               AssetUploadEventRepository assetUploadEventRepository,
                               ListingRepository listingRepository,
                               AssetStorageProviderRepository assetStorageProviderRepository,
                               @Value("${app.assets.provider-code}") String providerCode,
                               @Value("${app.assets.bucket-name}") String bucketName,
                               @Value("${app.assets.endpoint-url}") String endpointUrl,
                               @Value("${app.assets.public-base-url}") String publicBaseUrl,
                               @Value("${app.assets.region}") String region,
                               @Value("${app.assets.access-key-id}") String accessKeyId,
                               @Value("${app.assets.secret-access-key}") String secretAccessKey,
                               @Value("${app.assets.max-file-size-bytes}") long maxFileSizeBytes) {
        this.assetRepository = assetRepository;
        this.assetUploadEventRepository = assetUploadEventRepository;
        this.listingRepository = listingRepository;
        this.assetStorageProviderRepository = assetStorageProviderRepository;
        this.providerCode = providerCode;
        this.bucketName = bucketName;
        this.endpointUrl = endpointUrl;
        this.publicBaseUrl = publicBaseUrl;
        this.region = region;
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    @Transactional
    public AssetDtos.ImageAssetResponse uploadSellerListingImage(String listingPublicId,
                                                                 MultipartFile file,
                                                                 String altText,
                                                                 Jwt jwt) {
        Listing listing = listingRepository.findByPublicId(listingPublicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        String actorUserPublicId = userPublicId(jwt);
        if (!actorUserPublicId.equals(listing.getCreatedByUserPublicId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only listing owner can upload listing images");
        }
        String assetPublicId = UUID.randomUUID().toString();
        String objectKey = "sellers/%s/listings/%s/%s-%s".formatted(
                safeSegment(listing.getProviderAccountPublicId()),
                safeSegment(listing.getPublicId()),
                assetPublicId,
                safeFileName(file.getOriginalFilename(), contentType(file)));
        Asset asset = uploadAndPersist(assetPublicId, objectKey, "LISTING_IMAGE", "LISTING", listing.getPublicId(),
                actorUserPublicId, file, altText, "PUBLIC");
        if (listing.getImageKey() == null || listing.getImageKey().isBlank()) {
            listing.setImageKey(asset.getObjectKey());
        }
        listing.setUpdatedAt(LocalDateTime.now());
        return toResponse(asset);
    }

    @Transactional
    public AssetDtos.ImageAssetResponse uploadProfileImage(MultipartFile file, String altText, Jwt jwt) {
        String actorUserPublicId = userPublicId(jwt);
        String assetPublicId = UUID.randomUUID().toString();
        String objectKey = "profiles/%s/%s-%s".formatted(
                safeSegment(actorUserPublicId),
                assetPublicId,
                safeFileName(file.getOriginalFilename(), contentType(file)));
        Asset asset = uploadAndPersist(assetPublicId, objectKey, "PROFILE_IMAGE", "USER_PROFILE", actorUserPublicId,
                actorUserPublicId, file, altText, "PUBLIC");
        return toResponse(asset);
    }

    private Asset uploadAndPersist(String assetPublicId,
                                   String objectKey,
                                   String assetType,
                                   String ownerType,
                                   String ownerId,
                                   String actorUserPublicId,
                                   MultipartFile file,
                                   String altText,
                                   String visibility) {
        validateStorageConfigured();
        validateImage(file);
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read upload file", exception);
        }
        String contentType = contentType(file);
        String checksum = sha256(bytes);
        String publicUrl = publicBaseUrl.stripTrailing() + "/" + objectKey;
        try (S3Client s3Client = s3Client()) {
            s3Client.putObject(PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(objectKey)
                            .contentType(contentType)
                            .contentLength((long) bytes.length)
                            .cacheControl("public, max-age=31536000, immutable")
                            .build(),
                    RequestBody.fromBytes(bytes));
        } catch (S3Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to upload asset to storage", exception);
        }

        LocalDateTime now = LocalDateTime.now();
        Asset asset = new Asset();
        asset.setPublicId(assetPublicId);
        asset.setProviderCode(providerCode);
        asset.setBucketName(bucketName);
        asset.setObjectKey(objectKey);
        asset.setPublicUrl(publicUrl);
        asset.setAssetType(assetType);
        asset.setOwnerType(ownerType);
        asset.setOwnerId(ownerId);
        asset.setContentType(contentType);
        asset.setFileSizeBytes((long) bytes.length);
        asset.setAltText(cleanAltText(altText));
        asset.setChecksumSha256(checksum);
        asset.setVisibility(visibility);
        asset.setAssetStatus("ACTIVE");
        asset.setCreatedByUserPublicId(actorUserPublicId);
        asset.setCreatedAt(now);
        asset.setUpdatedAt(now);
        Asset saved = assetRepository.save(asset);

        AssetUploadEvent event = new AssetUploadEvent();
        event.setPublicId(UUID.randomUUID().toString());
        event.setAssetPublicId(saved.getPublicId());
        event.setActorUserPublicId(actorUserPublicId);
        event.setEventType("IMAGE_UPLOADED");
        event.setOwnerType(ownerType);
        event.setOwnerId(ownerId);
        event.setProviderCode(providerCode);
        event.setBucketName(bucketName);
        event.setObjectKey(objectKey);
        event.setOriginalFileName(file.getOriginalFilename());
        event.setContentType(contentType);
        event.setFileSizeBytes((long) bytes.length);
        event.setUploadStatus("UPLOADED");
        event.setMessage("Image uploaded to configured object storage.");
        event.setCreatedAt(now);
        assetUploadEventRepository.save(event);
        return saved;
    }

    public record ListingImage(byte[] bytes, String contentType) {}

    // Only the public image attached to a visible listing can reach this method.
    // Never accept a bucket, object key or remote URL from an HTTP request.
    // Public images are read anonymously from the bucket's public URL, so no storage credentials are needed.
    public ListingImage readListingImage(String imageKey) {
        String base = readPublicBaseUrl();
        String key = imageKey == null ? "" : imageKey.trim();
        if (key.startsWith(base + "/")) key = key.substring(base.length() + 1);
        if (!(key.startsWith("listings/") || key.matches("sellers/[^/]+/listings/[^/]+/.+"))
                || key.contains("..") || key.contains("\\") || key.contains("%")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing image unavailable");
        }
        long limit = Math.min(maxFileSizeBytes, 5 * 1024 * 1024);
        try {
            HttpResponse<InputStream> response = HTTP.send(HttpRequest.newBuilder(URI.create(base + "/" + encodePath(key)))
                    .timeout(Duration.ofSeconds(10)).GET().build(), HttpResponse.BodyHandlers.ofInputStream());
            try (InputStream body = response.body()) {
                if (response.statusCode() != 200) {
                    if (response.statusCode() == 404 || response.statusCode() == 403) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing image unavailable");
                    }
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Listing image temporarily unavailable");
                }
                String type = response.headers().firstValue("Content-Type").orElse("")
                        .split(";")[0].trim().toLowerCase(Locale.ROOT);
                if (!Set.of("image/jpeg", "image/png", "image/webp", "image/avif").contains(type)) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing image unavailable");
                }
                byte[] bytes = body.readNBytes((int) limit + 1);
                if (bytes.length == 0 || bytes.length > limit) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing image unavailable");
                }
                return new ListingImage(bytes, type);
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Listing image temporarily unavailable", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Listing image temporarily unavailable", ex);
        }
    }

    // Prefer the active provider row in the DB; fall back to app.assets.public-base-url.
    private String readPublicBaseUrl() {
        String base = assetStorageProviderRepository.findByProviderCodeAndActiveTrue(providerCode)
                .or(assetStorageProviderRepository::findFirstByActiveTrueOrderByUpdatedAtDesc)
                .map(AssetStorageProvider::getPublicBaseUrl)
                .filter(url -> url != null && !url.isBlank())
                .orElse(publicBaseUrl);
        if (base == null || !(base.startsWith("https://") || base.startsWith("http://"))) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Asset public URL is not configured");
        }
        return base.trim().replaceAll("/+$", "");
    }

    private static String encodePath(String key) {
        StringBuilder path = new StringBuilder();
        for (String segment : key.split("/")) {
            if (!path.isEmpty()) path.append('/');
            path.append(URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20"));
        }
        return path.toString();
    }

    private S3Client s3Client() {
        return S3Client.builder()
                .overrideConfiguration(software.amazon.awssdk.core.client.config.ClientOverrideConfiguration.builder()
                        .apiCallTimeout(java.time.Duration.ofSeconds(12))
                        .apiCallAttemptTimeout(java.time.Duration.ofSeconds(6)).build())
                .endpointOverride(URI.create(endpointUrl))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                .forcePathStyle(true)
                .build();
    }

    private void validateStorageConfigured() {
        if (bucketName == null || bucketName.isBlank()
                || endpointUrl == null || endpointUrl.isBlank()
                || publicBaseUrl == null || publicBaseUrl.isBlank()
                || accessKeyId == null || accessKeyId.isBlank()
                || secretAccessKey == null || secretAccessKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Asset storage is not configured");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file is required");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image file is too large");
        }
        if (!ALLOWED_IMAGE_TYPES.contains(contentType(file))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image type");
        }
    }

    private String contentType(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType == null || contentType.isBlank()
                ? "application/octet-stream"
                : contentType.toLowerCase(Locale.ROOT);
    }

    private String safeFileName(String original, String contentType) {
        String fallback = switch (contentType) {
            case "image/jpeg" -> "image.jpg";
            case "image/png" -> "image.png";
            case "image/webp" -> "image.webp";
            case "image/svg+xml" -> "image.svg";
            default -> "image.bin";
        };
        String candidate = original == null || original.isBlank() ? fallback : original;
        String cleaned = candidate.replace('\\', '/');
        cleaned = cleaned.substring(cleaned.lastIndexOf('/') + 1);
        cleaned = cleaned.replaceAll("[^A-Za-z0-9._-]", "-");
        return cleaned.isBlank() ? fallback : cleaned;
    }

    private String safeSegment(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        return value.replaceAll("[^A-Za-z0-9._-]", "-");
    }

    private String cleanAltText(String altText) {
        if (altText == null || altText.isBlank()) {
            return null;
        }
        String trimmed = altText.trim();
        return trimmed.length() > 255 ? trimmed.substring(0, 255) : trimmed;
    }

    private String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 digest is unavailable", exception);
        }
    }

    private String userPublicId(Jwt jwt) {
        String uid = jwt.getClaimAsString("uid");
        return uid == null || uid.isBlank() ? jwt.getSubject() : uid;
    }

    private AssetDtos.ImageAssetResponse toResponse(Asset asset) {
        return new AssetDtos.ImageAssetResponse(asset.getPublicId(), asset.getProviderCode(), asset.getBucketName(),
                asset.getObjectKey(), asset.getPublicUrl(), asset.getAssetType(), asset.getOwnerType(),
                asset.getOwnerId(), asset.getContentType(), asset.getFileSizeBytes(), asset.getAltText(),
                asset.getVisibility(), asset.getAssetStatus(), asset.getCreatedAt());
    }
}
