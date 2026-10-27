package com.java.vinod.platform.ai;

import java.net.http.HttpClient;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.convert.DurationStyle;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.client.reactive.JdkClientHttpConnector;
import org.springframework.web.client.RestClient;
import org.springframework.web.reactive.function.client.WebClient;

/** Bind provider timeouts to both actual transports, independent of HTTP-client classpath selection. */
@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "spring.ai.model.chat", havingValue = "ollama")
class OllamaTransportConfiguration {
    @Bean
    OllamaApi ollamaApi(@Value("${spring.ai.ollama.base-url}") String baseUrl,
            @Value("${spring.http.clients.connect-timeout:3s}") String connectTimeout,
            @Value("${spring.http.clients.read-timeout:90s}") String readTimeout) {
        var http = HttpClient.newBuilder().connectTimeout(DurationStyle.detectAndParse(connectTimeout)).build();
        var blocking = new JdkClientHttpRequestFactory(http);
        blocking.setReadTimeout(DurationStyle.detectAndParse(readTimeout));
        var reactive = new JdkClientHttpConnector(http);
        reactive.setReadTimeout(DurationStyle.detectAndParse(readTimeout));
        return OllamaApi.builder().baseUrl(baseUrl)
                .restClientBuilder(RestClient.builder().requestFactory(blocking))
                .webClientBuilder(WebClient.builder().clientConnector(reactive)).build();
    }
}
