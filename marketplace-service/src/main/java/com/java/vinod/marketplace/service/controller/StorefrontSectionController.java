package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.service.StorefrontSectionService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class StorefrontSectionController {
    private final StorefrontSectionService service;
    public StorefrontSectionController(StorefrontSectionService service) { this.service = service; }
    @GetMapping("/api/v1/marketplace/home-sections")
    public ResponseEntity<List<StorefrontSectionService.Section>> storefront() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.storefront());
    }
    @GetMapping("/api/v1/marketplace/admin/home-sections")
    public List<StorefrontSectionService.Section> settings() { return service.settings(); }
    @PutMapping("/api/v1/marketplace/admin/home-sections/{code}")
    public StorefrontSectionService.Section update(@PathVariable String code, @Valid @RequestBody StorefrontSectionService.Change change) { return service.update(code, change); }
}
