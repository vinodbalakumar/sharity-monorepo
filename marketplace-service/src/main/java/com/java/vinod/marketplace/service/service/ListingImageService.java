package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.repository.ListingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Set;

@Service
public class ListingImageService {
    private final ListingRepository listings;
    private final AssetStorageService storage;
    private record Cached(AssetStorageService.ListingImage image, Instant expires) {}
    private final LinkedHashMap<String, Cached> cache = new LinkedHashMap<>(64, .75f, true);
    private long cachedBytes;
    public ListingImageService(ListingRepository listings, AssetStorageService storage) {
        this.listings = listings;
        this.storage = storage;
    }
    public AssetStorageService.ListingImage image(String publicId) {
        var listing = listings.findByPublicId(publicId)
                .filter(item -> Set.of("ACTIVE", "PUBLISHED", "SOLD").contains(item.getListingStatus()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing image unavailable"));
        String key = listing.getImageKey();
        if (key == null || key.isBlank()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing image unavailable");
        synchronized (cache) {
            Cached found = cache.get(key);
            if (found != null && found.expires().isAfter(Instant.now())) return found.image();
            if (found != null) { cachedBytes -= found.image().bytes().length; cache.remove(key); }
        }
        var image = storage.readListingImage(key);
        synchronized (cache) {
            Cached previous = cache.put(key, new Cached(image, Instant.now().plusSeconds(300)));
            if (previous != null) cachedBytes -= previous.image().bytes().length;
            cachedBytes += image.bytes().length;
            while (cache.size() > 64 || cachedBytes > 16 * 1024 * 1024) {
                var oldest = cache.entrySet().iterator();
                cachedBytes -= oldest.next().getValue().image().bytes().length;
                oldest.remove();
            }
        }
        return image;
    }
}
