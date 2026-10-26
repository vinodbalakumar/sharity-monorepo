package com.java.vinod.platform.web.bff.controller;

import java.nio.file.*;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import static org.junit.jupiter.api.Assertions.*;

/** Opt-in local integration: requires the real AI service at 18086 and the existing Expo export. */
@EnabledIfEnvironmentVariable(named="RUN_LOCAL_CHAT_BROWSER_TESTS", matches="true")
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={
        "server.address=127.0.0.1", "spring.datasource.url=jdbc:h2:mem:live-chat-bff;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password=", "spring.flyway.locations=classpath:db/migration",
        "app.security.allowed-origin=http://127.0.0.1:18097", "app.security.allowed-origins=http://127.0.0.1:18097",
        "app.oauth2.client-id=local-chat-test", "app.oauth2.client-secret=local-test-only",
        "spring.security.oauth2.client.registration.sharity-web-bff.client-secret=local-test-only",
        "app.backends.ai-service=http://127.0.0.1:18086", "app.chat.bff-token=local-browser-smoke-only-not-a-production-secret"})
class LocalChatBrowserTest {
    @LocalServerPort int port;
    @Test void browserUsesRealBffCsrfSessionsAndLocalModel() throws Exception {
        Path ui=Path.of("../sharity-app-ui").toAbsolutePath().normalize();
        var process=new ProcessBuilder("node", "tests/live-chat-smoke.cjs",Integer.toString(port)).directory(ui.toFile())
                .redirectErrorStream(true).redirectOutput(Path.of("../outputs/chat-live-browser.log").toFile()).start();
        if (!process.waitFor(240,TimeUnit.SECONDS)) { process.destroyForcibly();fail("Live browser integration timed out"); }
        assertEquals(0,process.exitValue(),()->{
            try { return Files.readString(Path.of("../outputs/chat-live-browser.log")); } catch (Exception e) { return "Read browser log"; }
        });
    }
}
