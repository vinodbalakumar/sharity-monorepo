package com.java.vinod.platform.ai;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.*;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ListingDraftControllerTest {
    @Test void disabledFeatureNeverCallsProvider() {
        ChatModel model = mock(ChatModel.class);
        when(model.getOptions()).thenReturn(org.springframework.ai.chat.prompt.ChatOptions.builder().build());
        var controller = new ListingDraftController(Optional.of(model), false);
        assertThatThrownBy(() -> controller.draft(new ListingDraftController.DraftRequest("Gift card", "Unused code")))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        verifyNoInteractions(model);
    }

    @Test void missingModelReturnsUnavailable() {
        var controller = new ListingDraftController(Optional.empty(), true);
        assertThatThrownBy(() -> controller.draft(new ListingDraftController.DraftRequest("Gift card", "Unused code")))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test void successfulDraftRequiresSellerReview() {
        ChatModel model = mock(ChatModel.class);
        when(model.getOptions()).thenReturn(org.springframework.ai.chat.prompt.ChatOptions.builder().build());
        when(model.call(any(Prompt.class))).thenReturn(new ChatResponse(List.of(new Generation(new AssistantMessage("An unused gift card.")))));
        var controller = new ListingDraftController(Optional.of(model), true);
        var response = controller.draft(new ListingDraftController.DraftRequest("Gift card", "Unused code"));
        assertThat(response.draft()).isEqualTo("An unused gift card.");
        assertThat(response.reviewRequired()).isTrue();
    }

    @Test void providerFailureIsSanitizedAndCapacityIsReleased() {
        ChatModel model = mock(ChatModel.class);
        when(model.getOptions()).thenReturn(org.springframework.ai.chat.prompt.ChatOptions.builder().build());
        when(model.call(any(Prompt.class))).thenThrow(new IllegalStateException("private-provider-details"));
        var controller = new ListingDraftController(Optional.of(model), true);
        for (int i = 0; i < 3; i++) {
            assertThatThrownBy(() -> controller.draft(new ListingDraftController.DraftRequest("Gift card", "Unused code")))
                    .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                        assertThat(e.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                        assertThat(e.getReason()).doesNotContain("private-provider-details");
                    });
        }
    }
}
