package com.java.vinod.platform.ai;

import com.java.vinod.platform.ai.chat.*;
import java.util.*;
import java.nio.file.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;
import static org.junit.jupiter.api.Assertions.*;

/** Explicit opt-in: no network/model dependency in CI. Exercises the real Spring AI provider, never a mocked model. */
@EnabledIfEnvironmentVariable(named="RUN_LOCAL_OLLAMA_TESTS",matches="true")
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={"app.ai.enabled=true","spring.ai.model.chat=ollama", "spring.datasource.url=jdbc:h2:mem:local-model-smoke",
        "app.chat.bff-token=local-model-test-private-channel-token-32-characters",
        "spring.sql.init.mode=always", "spring.http.client.read-timeout=90s"})
class LocalOllamaChatTest {
    @LocalServerPort int port;
    @Autowired ObjectMapper mapper;
    @Test void realQwenAnswersProgrammingAndPublicProjectQuestions() throws Exception {
        var evidence = new ArrayList<String>();
        for (String question:List.of("Write a short Java program to reverse a string.","Explain Spring Boot dependency injection in three sentences.",
                "Generate a minimal Java Spring REST controller with a hello endpoint.","Explain Java microservices briefly.")) {
            long start=System.currentTimeMillis();
            var request=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/internal/chat/chat"))
                    .header("Content-Type","application/json").header("X-Chat-Token","local-model-test-private-channel-token-32-characters")
                    .header("X-Chat-Owner","user_"+"a".repeat(64)).header("X-Chat-Guest","false")
                    .timeout(java.time.Duration.ofSeconds(110)).POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(new SharityChatController.ChatRequest(null,question)))).build();
            var response=HttpClient.newHttpClient().send(request,HttpResponse.BodyHandlers.ofString());
            assertEquals(200,response.statusCode(),response.body());
            var answer=mapper.readValue(response.body(),SharityChatService.Answer.class);
            assertEquals("OLLAMA",answer.generation()); assertTrue(answer.response().length()>30);
            assertFalse(answer.response().contains("<think>"));
            evidence.add(question+"\nGeneration: "+answer.generation()+"; elapsedMs="+(System.currentTimeMillis()-start)+"\n"+answer.response()+"\n");
        }
        Files.createDirectories(Path.of("../outputs"));
        Files.writeString(Path.of("../outputs/sharity-ai-real-model-smoke.txt"),String.join("\n",evidence));
    }
}
