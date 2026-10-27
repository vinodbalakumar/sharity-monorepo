package com.java.vinod.platform.web.bff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PlatformWebBffApplication {
    public static void main(String[] args) {
        SpringApplication.run(PlatformWebBffApplication.class, args);
    }
}
