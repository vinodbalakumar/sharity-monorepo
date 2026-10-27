package com.java.vinod.platform.ai;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.ai.ollama.api.OllamaApi;
import static org.junit.jupiter.api.Assertions.*;

class OllamaTransportTest {
    private OllamaApi.ChatRequest request(boolean stream) {
        return OllamaApi.ChatRequest.builder("qwen3:8b")
                .messages(List.of(new OllamaApi.Message(OllamaApi.Message.Role.USER,"Public test prompt",null,null,null,null)))
                .stream(stream).disableThinking().build();
    }
    private void stalledProvider(boolean streaming) throws Exception {
        var received = new CountDownLatch(1); var release = new CountDownLatch(1);
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        try (var executor=Executors.newVirtualThreadPerTaskExecutor()) {
            server.setExecutor(executor);
            server.createContext("/api/chat", exchange -> {
                exchange.getRequestBody().readAllBytes(); received.countDown();
                try { release.await(15,TimeUnit.SECONDS); } catch (InterruptedException ex) { Thread.currentThread().interrupt(); }
                finally { exchange.close(); }
            });
            server.start();
            try {
                var api=new OllamaTransportConfiguration().ollamaApi("http://127.0.0.1:"+server.getAddress().getPort(),
                        "2s","1s");
                // Allow cold HTTP-client startup on shared runners before testing the read timeout.
                var exception=assertTimeoutPreemptively(Duration.ofSeconds(10), () -> assertThrows(RuntimeException.class, () -> {
                    if (streaming) api.streamingChat(request(true)).collectList().block(Duration.ofSeconds(8));
                    else api.chat(request(false));
                }));
                assertTrue(received.await(1,TimeUnit.SECONDS),"The actual provider endpoint must have received the request");
                assertTrue(exception instanceof org.springframework.web.client.ResourceAccessException
                        || exception instanceof org.springframework.web.reactive.function.client.WebClientRequestException,
                        "The stalled HTTP exchange must fail through its transport: "+exception.getClass().getSimpleName());
            } finally { release.countDown(); server.stop(0); }
        }
    }
    @Test void blockingGenerationTimesOutWhenProviderStopsResponding() throws Exception { stalledProvider(false); }
    @Test void reactiveGenerationTimesOutWhenProviderStopsResponding() throws Exception { stalledProvider(true); }
    @Test void configuredTransportStillDecodesARealOllamaResponse() throws Exception {
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/api/chat", exchange -> {
            exchange.getRequestBody().readAllBytes();
            byte[] bytes="{\"model\":\"qwen3:8b\",\"message\":{\"role\":\"assistant\",\"content\":\"Verified public answer\"},\"done\":true}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type","application/json"); exchange.sendResponseHeaders(200,bytes.length);
            try (var output=exchange.getResponseBody()) { output.write(bytes); }
        });
        server.start();
        try {
            var api=new OllamaTransportConfiguration().ollamaApi("http://127.0.0.1:"+server.getAddress().getPort(),"1s","3s");
            assertEquals("Verified public answer",api.chat(request(false)).message().content());
        } finally { server.stop(0); }
    }
}
