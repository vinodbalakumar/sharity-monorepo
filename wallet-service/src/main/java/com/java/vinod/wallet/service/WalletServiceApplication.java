package com.java.vinod.wallet.service;

import com.java.vinod.wallet.service.config.DatasourcePropertySanitizerInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WalletServiceApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(WalletServiceApplication.class);
        application.addInitializers(new DatasourcePropertySanitizerInitializer());
        application.run(args);
    }
}
