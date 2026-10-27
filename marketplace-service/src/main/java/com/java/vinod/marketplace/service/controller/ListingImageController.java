package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.service.ListingImageService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;

@RestController
@RequestMapping("/api/v1/marketplace/listings")
public class ListingImageController {
    private final ListingImageService images;
    public ListingImageController(ListingImageService images) { this.images = images; }
    @GetMapping("/{publicId:[a-zA-Z0-9_-]{1,100}}/image")
    public ResponseEntity<byte[]> image(@PathVariable String publicId) {
        var image = images.image(publicId);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
                .header("X-Content-Type-Options", "nosniff").body(image.bytes());
    }
}
