package com.pharma.reversechain.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharma.reversechain.blockchain.FabricGatewayService;
import com.pharma.reversechain.repository.KeyValueHashRepository;
import com.pharma.reversechain.service.BlockchainService;
import com.pharma.reversechain.service.FabricBlockchainService;
import com.pharma.reversechain.service.KeyValueHashBlockchainService;
import com.pharma.reversechain.service.LocalBlockchainService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class BlockchainConfig {

    @Bean
    @ConditionalOnProperty(name = "blockchain.mode", havingValue = "hash-store", matchIfMissing = true)
    public BlockchainService keyValueHashBlockchainService(KeyValueHashRepository repository, ObjectMapper objectMapper) {
        log.info("Initializing KeyValueHashBlockchainService (SHA-256 Key-Value Hash-Chained Store)");
        return new KeyValueHashBlockchainService(repository, objectMapper);
    }

    @Bean
    @ConditionalOnProperty(name = "blockchain.mode", havingValue = "fabric")
    public BlockchainService fabricBlockchainService(FabricGatewayService fabricGatewayService) {
        log.info("Initializing FabricBlockchainService (blockchain.mode=fabric)");
        return new FabricBlockchainService(fabricGatewayService);
    }

    @Bean
    @ConditionalOnProperty(name = "blockchain.mode", havingValue = "local")
    public BlockchainService localBlockchainService() {
        log.warn("Initializing LocalBlockchainService (blockchain.mode=local)");
        return new LocalBlockchainService();
    }
}
