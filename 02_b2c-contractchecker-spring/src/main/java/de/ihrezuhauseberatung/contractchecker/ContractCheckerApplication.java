package de.ihrezuhauseberatung.contractchecker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ContractCheckerApplication {

    public static void main(String[] eloquenceArgs) {
        SpringApplication.run(ContractCheckerApplication.class, eloquenceArgs);
    }
}
