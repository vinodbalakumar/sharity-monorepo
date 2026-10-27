package com.java.vinod.platform.ai;

import com.java.vinod.platform.ai.chat.*;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;

class ConversationPersistenceTest {
    @TempDir Path directory;
    @Test void authenticatedHistorySurvivesReopeningDatabase() {
        String url="jdbc:h2:file:"+directory.resolve("history").toAbsolutePath().toString().replace('\\','/');
        var first=new DriverManagerDataSource(url,"sa","");
        new ResourceDatabasePopulator(new ClassPathResource("chat-schema.sql")).execute(first);
        var identity=new ChatIdentity("user_"+"a".repeat(64),false);
        var store=new ConversationStore(new JdbcTemplate(first),new ObjectMapper());
        String id=store.append(identity,null,"Who founded Sharity?","Vinod Balakumar",List.of());
        var measurement=new ConversationStore.Metrics(1000,1400,400,100,25,125,"OLLAMA");
        var saved=store.appendWithMetrics(identity,id,"Java question","Java answer",List.of(),measurement);
        // DriverManagerDataSource closes each connection; a new instance reopens the same file.
        var reopened=new ConversationStore(new JdbcTemplate(new DriverManagerDataSource(url,"sa","")),new ObjectMapper());
        var messages=reopened.get(identity,id).messages();
        assertEquals(4,messages.size());
        assertNull(messages.getFirst().metrics());
        assertEquals(measurement,messages.stream().filter(m -> m.id().equals(saved.messageId())).findFirst().orElseThrow().metrics());
        assertThrows(org.springframework.web.server.ResponseStatusException.class,()->reopened.get(new ChatIdentity("user_"+"b".repeat(64),false),id));
        reopened.delete(identity,id);assertTrue(reopened.list(identity).isEmpty());
        assertEquals(0,new JdbcTemplate(first).queryForObject("SELECT COUNT(*) FROM ai_message_metrics",Integer.class));
    }
}
