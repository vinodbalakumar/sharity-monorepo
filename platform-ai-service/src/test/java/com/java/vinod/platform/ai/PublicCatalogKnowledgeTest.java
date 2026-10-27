package com.java.vinod.platform.ai;

import com.java.vinod.platform.ai.chat.*;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.DefaultResourceLoader;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PublicCatalogKnowledgeTest {
    @TempDir Path directory;
    final ObjectMapper mapper = new ObjectMapper();
    PublicKnowledge knowledge(Path file) throws Exception {
        var founder = mock(FounderContent.class);
        when(founder.publicPosts()).thenReturn(List.of());
        return new PublicKnowledge(mapper, founder, false, "", file.toUri().toString(), "", new DefaultResourceLoader());
    }
    PublicKnowledge.Source source(String id, String visibility, boolean approved) {
        return new PublicKnowledge.Source(id,"Elden Ring","https://vinodbalakumar.com/app/",
                Instant.now().toString(), visibility, approved,"Sample game listing. Price USD 35. No verified fulfillment promise.");
    }
    void write(Path file, Instant time, List<PublicKnowledge.Source> sources) throws Exception {
        Files.writeString(file, mapper.writeValueAsString(Map.of("generatedAt",time.toString(),"sources",sources)));
    }
    @Test void onlyFreshApprovedPublicProductsAreRetrievedAndUpdatesAreVisible() throws Exception {
        var file = directory.resolve("catalog.json");
        write(file,Instant.now(), List.of(source("product-one","PUBLIC",true), source("product-private","PRIVATE",true),
                source("product-draft","PUBLIC",false),source("account-record","PUBLIC",true)));
        var knowledge = knowledge(file);
        var products = knowledge.retrieve("Tell me about Elden Ring").stream().filter(s -> s.id().startsWith("product-")).toList();
        assertEquals(1,products.size()); assertEquals("product-one",products.getFirst().id());
        write(file,Instant.now(),List.of(source("product-two","PUBLIC",true)));
        assertTrue(knowledge.retrieve("Elden Ring").stream().anyMatch(s -> s.id().equals("product-two")));
        assertFalse(knowledge.retrieve("Elden Ring").stream().anyMatch(s -> s.id().equals("product-one")));
    }
    @Test void missingMalformedExpiredAndFutureCatalogsFailClosedWhileFounderStillWorks() throws Exception {
        var file=directory.resolve("catalog.json"); var knowledge=knowledge(file);
        assertTrue(knowledge.exactAnswer("Who founded Sharity?").orElseThrow().contains("Vinod Balakumar"));
        for (var date:List.of(Instant.now().minusSeconds(86410),Instant.now().plusSeconds(600))) {
            write(file,date,List.of(source("product-one","PUBLIC",true)));
            assertFalse(knowledge.retrieve("Elden Ring").stream().anyMatch(s -> s.id().startsWith("product-")));
        }
        Files.writeString(file,"invalid JSON");
        assertFalse(knowledge.retrieve("Elden Ring").stream().anyMatch(s -> s.id().startsWith("product-")));
    }
    @Test void liveCatalogAllowlistsFieldsSkipsDraftsAndCachesPublicFacts() throws Exception {
        var server = com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("127.0.0.1",0),0);
        var calls = new java.util.concurrent.atomic.AtomicInteger();
        server.createContext("/catalog", exchange -> {
            calls.incrementAndGet();
            var bytes = """
                    [{"publicId":"game","title":"Elden Ring","listingStatus":"ACTIVE","priceAmount":35,
                      "currencyCode":"USD","demoSeed":true,"privateEmail":"secret@example.invalid","deliveryCode":"NEVER-SEND"},
                     {"publicId":"draft","title":"Elden Ring draft","listingStatus":"DRAFT"}]
                    """.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200,bytes.length);
            try (var output=exchange.getResponseBody()) { output.write(bytes); }
        });
        server.start();
        try {
            var founder=mock(FounderContent.class); when(founder.publicPosts()).thenReturn(List.of());
            var knowledge=new PublicKnowledge(mapper,founder,false,"",directory.resolve("missing").toUri().toString(),
                    "http://127.0.0.1:"+server.getAddress().getPort()+"/catalog",new DefaultResourceLoader());
            for (int i=0;i<2;i++) {
                var sources=knowledge.retrieve("Elden Ring").stream().filter(s -> s.id().startsWith("product-")).toList();
                assertEquals(1,sources.size()); assertEquals("product-game",sources.getFirst().id());
                assertTrue(sources.getFirst().content().contains("35"));
                assertFalse(sources.toString().contains("NEVER-SEND")); assertFalse(sources.toString().contains("secret@"));
            }
            assertEquals(1,calls.get());
        } finally { server.stop(0); }
    }
}
