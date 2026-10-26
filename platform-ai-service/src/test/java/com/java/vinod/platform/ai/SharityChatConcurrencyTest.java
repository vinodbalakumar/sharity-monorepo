package com.java.vinod.platform.ai;

import com.java.vinod.platform.ai.chat.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.*;
import org.springframework.ai.chat.prompt.*;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SharityChatConcurrencyTest {
    private final ChatModel model = mock(ChatModel.class);
    private final PublicKnowledge knowledge = mock(PublicKnowledge.class);
    private final ConversationStore store = mock(ConversationStore.class);

    private SharityChatService service() {
        when(model.getOptions()).thenReturn(ChatOptions.builder().build());
        when(knowledge.exactAnswer(anyString())).thenReturn(Optional.empty());
        when(knowledge.exactAnswer("Who founded Sharity?")).thenReturn(Optional.of("Approved founder answer"));
        when(store.appendWithMetrics(any(), isNull(), anyString(), anyString(), anyList(), any()))
                .thenAnswer(call -> new ConversationStore.StoredAnswer(((ChatIdentity) call.getArgument(0)).owner(), UUID.randomUUID().toString()));
        return new SharityChatService(Optional.of(model), true, knowledge, store, 2);
    }
    private ChatResponse answer() {
        return new ChatResponse(List.of(new Generation(new AssistantMessage("```java\nclass Example {}\n```"))));
    }
    @Test void twoIndependentUsersGenerateWhileFactualAnswersBypassFullModelCapacity() throws Exception {
        var service = service();
        var entered = new CountDownLatch(2);
        var release = new CountDownLatch(1);
        when(model.call(any(Prompt.class))).thenAnswer(call -> {
            entered.countDown();
            if (!release.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Test inference timed out");
            return answer();
        });
        try (var workers = Executors.newVirtualThreadPerTaskExecutor()) {
            try {
                var first = workers.submit(() -> service.chat(new ChatIdentity("guest_one", true), null, "Write Java code"));
                var second = workers.submit(() -> service.chat(new ChatIdentity("guest_two", true), null, "Write Python code"));
                assertTrue(entered.await(5, TimeUnit.SECONDS), "Both independent requests must reach the model before either finishes");
                var overloaded = assertThrows(ResponseStatusException.class,
                        () -> service.chat(new ChatIdentity("guest_three", true), null, "Write SQL code"));
                assertEquals(429, overloaded.getStatusCode().value());
                var factual = service.chat(new ChatIdentity("guest_four", true), null, "Who founded Sharity?");
                assertEquals("STRUCTURED", factual.generation());
                release.countDown();
                assertEquals("guest_one", first.get(5, TimeUnit.SECONDS).conversationId());
                assertEquals("guest_two", second.get(5, TimeUnit.SECONDS).conversationId());
                verify(store).appendWithMetrics(eq(new ChatIdentity("guest_one", true)), isNull(), eq("Write Java code"), anyString(), anyList(), any());
                verify(store).appendWithMetrics(eq(new ChatIdentity("guest_two", true)), isNull(), eq("Write Python code"), anyString(), anyList(), any());
            } finally { release.countDown(); }
        }
    }
    @Test void providerFailuresReleaseCapacityForLaterUsers() {
        var service = service();
        when(model.call(any(Prompt.class))).thenThrow(new IllegalStateException("Provider failed"));
        for (int i=0; i<3; i++) {
            var failed = assertThrows(ResponseStatusException.class,
                    () -> service.chat(new ChatIdentity("guest_failure", true), null, "Write Java code"));
            assertEquals(503, failed.getStatusCode().value());
        }
        doReturn(answer()).when(model).call(any(Prompt.class));
        assertEquals("OLLAMA", service.chat(new ChatIdentity("guest_recovery", true), null, "Write Java code").generation());
    }
    @Test void providerTokenUsageIsAttachedToTheStoredAnswer() {
        var service=service();
        var metadata=org.springframework.ai.chat.metadata.ChatResponseMetadata.builder()
                .usage(new org.springframework.ai.chat.metadata.DefaultUsage(100,25,125)).build();
        when(model.call(any(Prompt.class))).thenReturn(new ChatResponse(answer().getResults(),metadata));
        var result=service.chat(new ChatIdentity("guest_usage",true),null,"Write Java code");
        assertEquals(100,result.metrics().inputTokens());
        assertEquals(25,result.metrics().outputTokens());
        assertEquals(125,result.metrics().totalTokens());
        assertNotNull(result.messageId());
        verify(store).appendWithMetrics(any(),isNull(),anyString(),anyString(),anyList(),eq(result.metrics()));
    }
    @Test void missingProviderUsageIsNotInventedAsZero() {
        var service=service();
        when(model.call(any(Prompt.class))).thenReturn(answer());
        var result=service.chat(new ChatIdentity("guest_unknown",true),null,"Write Java code");
        assertNull(result.metrics().inputTokens());
        assertNull(result.metrics().outputTokens());
        assertNull(result.metrics().totalTokens());
    }
}
