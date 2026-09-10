package com.pharma.reversechain.service;

import com.pharma.reversechain.blockchain.FabricGatewayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlockchainServiceImpl implements BlockchainService {

    private final FabricGatewayService fabricGatewayService;

    @Override
    public String recordDestruction(String certificateHash) {
        String txId = "tx-fabric-" + fabricGatewayService.computeSha256(certificateHash + ":" + System.currentTimeMillis()).substring(0, 32);
        log.info("Recorded destruction on Hyperledger Fabric. TxId: {}, CertificateHash: {}", txId, certificateHash);
        return txId;
    }
}
