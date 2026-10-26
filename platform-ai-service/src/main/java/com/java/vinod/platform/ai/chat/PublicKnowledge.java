package com.java.vinod.platform.ai.chat;

import java.util.*;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class PublicKnowledge {
    public record Source(String id, String title, String url, String updatedAt, String visibility, boolean approved, String content) {}
    private final List<Source> approved;
    private final FounderContent content;
    private final boolean publicEmail;
    private final String email;
    private final ObjectMapper mapper;
    private final Resource catalog;
    private final String catalogUrl;
    private final java.net.http.HttpClient http = java.net.http.HttpClient.newBuilder()
            .connectTimeout(java.time.Duration.ofSeconds(2)).build();
    private List<Source> liveCatalog = List.of();
    private long catalogAttemptAt, catalogLoadedAt;
    private record Catalog(String generatedAt, List<Source> sources) {}
    public PublicKnowledge(ObjectMapper mapper, FounderContent content,
            @Value("${app.chat.founder.public-email-approved:false}") boolean publicEmail,
            @Value("${app.chat.founder.email:}") String email,
            @Value("${app.chat.catalog-location:classpath:knowledge/empty-catalog.json}") String catalogLocation,
            @Value("${app.chat.catalog-url:}") String catalogUrl,
            ResourceLoader resources) throws java.io.IOException {
        try (var in = new ClassPathResource("knowledge/public.json").getInputStream()) {
            approved = Arrays.stream(mapper.readValue(in, Source[].class))
                    .filter(s -> "PUBLIC".equals(s.visibility()) && s.approved())
                    .map(s -> s.id().equals("founder") && publicEmail && !email.isBlank()
                            ? new Source(s.id(),s.title(),s.url(),s.updatedAt(),s.visibility(),true,
                                    s.content().replace("No public email is approved.","Approved public contact email: "+email)) : s).toList();
        }
        this.content = content; this.publicEmail = publicEmail; this.email = email;
        this.mapper = mapper; this.catalog = resources.getResource(catalogLocation);
        this.catalogUrl = catalogUrl;
    }
    /** Deployment-owned public snapshot. Expired or unavailable evidence is never presented as current inventory. */
    private List<Source> catalogSources() {
        if (!catalogUrl.isBlank()) return currentCatalog();
        if (!catalog.exists()) return List.of();
        try (var input = catalog.getInputStream()) {
            var snapshot = mapper.readValue(input, Catalog.class);
            var generated = java.time.Instant.parse(snapshot.generatedAt());
            var now = java.time.Instant.now();
            if (generated.isAfter(now.plusSeconds(60)) || generated.isBefore(now.minusSeconds(86400))) return List.of();
            return snapshot.sources().stream().filter(s -> "PUBLIC".equals(s.visibility()) && s.approved()
                    && s.id().startsWith("product-") && s.content().length() <= 2000).limit(500).toList();
        } catch (Exception unavailable) { return List.of(); }
    }
    /** Fixed deployment-controlled public endpoint, with a bounded cache and no user-supplied URLs. */
    private synchronized List<Source> currentCatalog() {
        long now = System.currentTimeMillis();
        if (now - catalogAttemptAt >= 60000) {
            catalogAttemptAt = now;
            try {
                var request = java.net.http.HttpRequest.newBuilder(java.net.URI.create(catalogUrl))
                        .timeout(java.time.Duration.ofSeconds(4)).GET().build();
                var response = http.send(request, java.net.http.HttpResponse.BodyHandlers.ofByteArray());
                {
                    if (response.statusCode() != 200) throw new java.io.IOException("Catalog unavailable");
                    var bytes = response.body();
                    if (bytes.length > 2 * 1024 * 1024) throw new java.io.IOException("Catalog exceeds limit");
                    var items = mapper.readTree(bytes);
                    if (!items.isArray() || items.size() > 500) throw new java.io.IOException("Invalid catalog");
                    var sources = new ArrayList<Source>();
                    String timestamp = java.time.Instant.now().toString();
                    for (var item : items) {
                        if (!Set.of("ACTIVE","PUBLISHED","SOLD").contains(item.path("listingStatus").asText())) continue;
                        if (item.path("publicId").asText().isBlank() || item.path("title").asText().isBlank()) continue;
                        var facts = new LinkedHashMap<String,Object>();
                        for (String key : List.of("publicId","title","categoryCode","priceAmount","currencyCode",
                                "productType","deliveryType","listingStatus","demoSeed"))
                            facts.put(key,item.path(key));
                        String evidence = "Public listing facts as of " + timestamp + ": " + mapper.writeValueAsString(facts)
                                + ". Demo listings are sample inventory. Confirm current price, stock and terms on the listing. "
                                + "No license validity, region, material authenticity, warranty or fulfillment promise is verified.";
                        sources.add(new Source("product-"+item.path("publicId").asText(), item.path("title").asText(),
                                "https://vinodbalakumar.com/app/",timestamp,"PUBLIC",true,evidence));
                    }
                    liveCatalog = List.copyOf(sources); catalogLoadedAt = now;
                }
            } catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
            catch (Exception unavailable) { /* Failure is isolated from chat; expired catalog evidence is omitted. */ }
        }
        return now - catalogLoadedAt < 120000 ? liveCatalog : List.of();
    }
    public Map<String, Object> profile() {
        var result = new LinkedHashMap<String, Object>();
        result.put("name", "Vinod Balakumar"); result.put("fullName", "Vinod Balakumar Panchaparvala");
        result.put("role", "Principal Full Stack Engineer"); result.put("website", "https://vinodbalakumar.com");
        result.put("linkedin", "https://www.linkedin.com/in/vinod-balakumar-panchaparvala-39332986");
        result.put("instagram", "https://www.instagram.com/vinod_balakumar/");
        if (publicEmail && !email.isBlank()) result.put("email", email);
        return result;
    }
    public List<Source> retrieve(String query) {
        String lower = query.toLowerCase(Locale.ROOT);
        List<Source> candidates = new ArrayList<>(approved);
        candidates.addAll(catalogSources());
        content.publicPosts().stream().limit(3).forEach(p -> candidates.add(new Source(p.id(), p.platform() + " founder post",
                p.originalUrl(), p.publishedAt(), "PUBLIC", true, "Attributed founder social post (not independently verified): " + p.content())));
        Set<String> words = new HashSet<>(Arrays.asList(lower.split("[^a-z0-9_]+")));
        return candidates.stream().sorted(Comparator.comparingInt((Source s) -> score(s, words, lower)).reversed())
                .filter(s -> score(s, words, lower) > 0).limit(3).toList();
    }
    private int score(Source s, Set<String> words, String query) {
        int score = 0; String text = (s.title() + " " + s.content()).toLowerCase(Locale.ROOT);
        for (String word : words) if (word.length() > 3 && text.contains(word)) score++;
        String title = s.title().toLowerCase(Locale.ROOT);
        if (s.id().startsWith("product-") && query.contains(title)) score += 40;
        if (query.matches(".*(founder|vinod|balakumar|linkedin|instagram|full name|contact).*")) score += s.id().equals("founder") ? 20 : 0;
        if (query.matches(".*(recent|posted|posts|shared|feed).*")) score += s.id().equals("feed") || s.title().endsWith("founder post") ? 30 : 0;
        return score;
    }
    /** Critical facts bypass probabilistic generation, including attempts to elicit unapproved personal facts. */
    public Optional<String> exactAnswer(String question) {
        String q = question.toLowerCase(Locale.ROOT);
        if (q.matches(".*(password|credential|secret|private email|deployment config|internal address).*"))
            return Optional.of("I can help with approved public Sharity information and programming examples. I do not have access to private credentials, personal contact details, deployment configuration or account records.");
        if (q.matches(".*(what is sharity|sharity offer|marketplace work|features.*(available|planned)|services power|authentication work|technologies power).*"))
            return Optional.of(approved.stream().filter(s -> Set.of("overview","technology").contains(s.id())).map(Source::content).reduce((a,b)->a+"\n\n"+b).orElseThrow());
        if (Pattern.compile("\\b(founder|founded|vinod|balakumar|linkedin|instagram|professional background|full name|posted recently|shared recently|recent posts)\\b").matcher(q).find()
                && !q.matches(".*(write|program|code|controller|reverse).*")) {
            if (q.matches(".*(recent|posted|posts|shared|feed).*")) {
                var posts = content.publicPosts();
                if (posts.isEmpty()) return Optional.of("No approved LinkedIn or Instagram posts have been imported yet, so I cannot verify recent posts. You can visit the founder's official profiles.");
                return Optional.of(posts.stream().limit(3).map(p -> p.platform() + " · " + p.publishedAt() + "\n" + p.content() + "\n" + p.originalUrl()).reduce((a,b) -> a + "\n\n" + b).orElseThrow());
            }
            String contact = publicEmail && !email.isBlank() ? " Approved public email: " + email : " No public email address is approved.";
            return Optional.of("Sharity was founded by Vinod Balakumar. His full professional name is Vinod Balakumar Panchaparvala, and his professional role is Principal Full Stack Engineer.\n\n"
                    + "Website: https://vinodbalakumar.com\nLinkedIn: https://www.linkedin.com/in/vinod-balakumar-panchaparvala-39332986\nInstagram: https://www.instagram.com/vinod_balakumar/ (vinod_balakumar)."
                    + contact + " Employment history, education, certifications and career dates are not part of the approved profile.");
        }
        return Optional.empty();
    }
}
