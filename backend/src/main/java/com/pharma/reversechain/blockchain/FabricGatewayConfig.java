package com.pharma.reversechain.blockchain;

import io.grpc.Grpc;
import io.grpc.ManagedChannel;
import io.grpc.TlsChannelCredentials;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.client.Gateway;
import org.hyperledger.fabric.client.identity.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
@Getter
public class FabricGatewayConfig {

    @Value("${fabric.enabled:false}")
    private boolean enabled;

    @Value("${fabric.channel-name:pharma-channel}")
    private String channelName;

    @Value("${fabric.chaincode-name:pharma-contract}")
    private String chaincodeName;

    @Value("${fabric.peer-endpoint:localhost:7051}")
    private String peerEndpoint;

    @Value("${fabric.override-auth:peer0.manufacturer.pharma.com}")
    private String overrideAuth;

    @Value("${fabric.msp-id:ManufacturerMSP}")
    private String mspId;

    @Value("${fabric.crypto-path:../fabric-network/organizations/peerOrganizations/manufacturer.pharma.com}")
    private String cryptoPath;

    @Value("${fabric.cert-path:}")
    private String certPath;

    @Value("${fabric.key-path:}")
    private String keyPath;

    @Value("${fabric.tls-cert-path:}")
    private String tlsCertPath;

    public Gateway connectGateway() throws Exception {
        if (!enabled) {
            log.info("Hyperledger Fabric Gateway is disabled or running in mock simulation mode.");
            return null;
        }

        Path resolvedTls = resolvePath(tlsCertPath, cryptoPath + "/peers/peer0.manufacturer.pharma.com/tls/ca.crt");
        Path resolvedCert = resolvePath(certPath, cryptoPath + "/users/User1@manufacturer.pharma.com/msp/signcerts");
        Path resolvedKeyDir = resolvePath(keyPath, cryptoPath + "/users/User1@manufacturer.pharma.com/msp/keystore");

        if (!Files.exists(resolvedTls)) {
            log.warn("Fabric TLS certificate not found at: {}. Running Gateway in fallback/local simulation mode.", resolvedTls);
            return null;
        }

        ManagedChannel channel = newGrpcConnection(resolvedTls);
        X509Certificate certificate = readX509Certificate(findFirstFile(resolvedCert));
        Identity identity = new X509Identity(mspId, certificate);
        Signer signer = Signers.newPrivateKeySigner(readPrivateKey(findFirstFile(resolvedKeyDir)));

        return Gateway.newInstance()
                .identity(identity)
                .signer(signer)
                .connection(channel)
                .evaluateOptions(options -> options.withDeadlineAfter(5, TimeUnit.SECONDS))
                .endorseOptions(options -> options.withDeadlineAfter(15, TimeUnit.SECONDS))
                .submitOptions(options -> options.withDeadlineAfter(10, TimeUnit.SECONDS))
                .commitStatusOptions(options -> options.withDeadlineAfter(1, TimeUnit.MINUTES))
                .connect();
    }

    private ManagedChannel newGrpcConnection(Path tlsCertPath) throws IOException {
        var credentials = TlsChannelCredentials.newBuilder()
                .trustManager(tlsCertPath.toFile())
                .build();

        return Grpc.newChannelBuilder(peerEndpoint, credentials)
                .overrideAuthority(overrideAuth)
                .build();
    }

    private static X509Certificate readX509Certificate(Path certificatePath) throws IOException, CertificateException {
        try (Reader certificateReader = Files.newBufferedReader(certificatePath, StandardCharsets.UTF_8)) {
            return Identities.readX509Certificate(certificateReader);
        }
    }

    private static java.security.PrivateKey readPrivateKey(Path keyPath) throws IOException, InvalidKeyException {
        try (Reader keyReader = Files.newBufferedReader(keyPath, StandardCharsets.UTF_8)) {
            return Identities.readPrivateKey(keyReader);
        }
    }

    private static Path resolvePath(String explicitPath, String defaultRelative) {
        if (explicitPath != null && !explicitPath.trim().isEmpty()) {
            return Paths.get(explicitPath);
        }
        return Paths.get(defaultRelative);
    }

    private static Path findFirstFile(Path dirOrFile) throws IOException {
        if (!Files.isDirectory(dirOrFile)) {
            return dirOrFile;
        }
        try (var stream = Files.list(dirOrFile)) {
            return stream.findFirst().orElseThrow(() -> new IOException("No files found in directory: " + dirOrFile));
        }
    }
}
