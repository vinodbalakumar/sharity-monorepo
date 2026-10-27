package com.java.vinod.marketplace.service.service;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ListingImageServiceTest {
    @Test void publicImageIsCachedButVisibilityIsCheckedOnEveryRequest() {
        var repository = mock(ListingRepository.class);
        var storage = mock(AssetStorageService.class);
        var listing = new Listing(); listing.setListingStatus("ACTIVE"); listing.setImageKey("listings/Steam $100.jpg");
        when(repository.findByPublicId("sample")).thenReturn(Optional.of(listing));
        when(storage.readListingImage(listing.getImageKey())).thenReturn(new AssetStorageService.ListingImage(new byte[]{1,2}, "image/jpeg"));
        var service = new ListingImageService(repository, storage);
        assertThat(service.image("sample").bytes()).containsExactly((byte)1,(byte)2);
        service.image("sample"); verify(storage,times(1)).readListingImage(listing.getImageKey());
        listing.setListingStatus("DRAFT");
        assertThatThrownBy(() -> service.image("sample")).isInstanceOf(ResponseStatusException.class);
    }
    @Test void absentListingDoesNotReadStorage() {
        var repository = mock(ListingRepository.class);var storage = mock(AssetStorageService.class);
        when(repository.findByPublicId("missing")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> new ListingImageService(repository,storage).image("missing")).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(storage);
    }
    @Test void arbitraryUrlsPrivateDocumentsAndTraversalCannotBeRead() {
        var storage = new AssetStorageService(mock(AssetRepository.class),mock(AssetUploadEventRepository.class),mock(ListingRepository.class),
                "R2","bucket","https://storage.example","https://images.example","auto","test-id","test-secret",5242880);
        for (String key : new String[]{"https://internal.example/key", "profiles/private.jpg", "listings/../private.jpg", "listings/%2e%2e/private.jpg", "credentials/key.pem"}) {
            assertThatThrownBy(() -> storage.readListingImage(key)).isInstanceOf(ResponseStatusException.class);
        }
    }
}
