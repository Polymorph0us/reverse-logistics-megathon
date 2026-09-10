#
# Pharma Reverse Chain Hyperledger Fabric PowerShell Automation Script
#
param (
    [Parameter(Position=0)]
    [ValidateSet("up", "down", "generate", "channel", "deployCC", "clean")]
    [string]$Mode = "up"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$NetworkDir = Split-Path -Parent $ScriptDir
Set-Location $NetworkDir

$IMAGE_TOOLS = "hyperledger/fabric-tools:2.5"
$CHANNEL_NAME = "pharma-channel"
$CC_NAME = "pharma-contract"
$CC_VERSION = "1.0"

function Generate-Crypto {
    Write-Host "=== 1. Generating Organization Identities and Certificates ===" -ForegroundColor Cyan
    if (!(Test-Path "channel-artifacts")) { New-Item -ItemType Directory -Path "channel-artifacts" | Out-Null }
    
    # Clean any previous artifacts using container permissions
    docker run --rm -v "${NetworkDir}:/network" $IMAGE_TOOLS rm -rf /network/organizations/peerOrganizations /network/organizations/ordererOrganizations /network/channel-artifacts/*
    
    # Generate crypto using cryptogen
    docker run --rm -v "${NetworkDir}:/network" -w /network $IMAGE_TOOLS `
        cryptogen generate --config=organizations/cryptogen/crypto-config.yaml --output=organizations
    Write-Host "=== Crypto material generated successfully. ===" -ForegroundColor Green
}

function Create-ChannelArtifacts {
    Write-Host "=== 2. Creating Channel Genesis Block ===" -ForegroundColor Cyan
    docker run --rm -v "${NetworkDir}:/network" -w /network $IMAGE_TOOLS `
        configtxgen -profile PharmaChannel -outputBlock "channel-artifacts/${CHANNEL_NAME}.block" -channelID $CHANNEL_NAME -configPath configtx/
    Write-Host "=== Channel block created successfully. ===" -ForegroundColor Green
}

function Start-Network {
    Generate-Crypto
    Create-ChannelArtifacts
    Write-Host "=== 3. Starting Fabric Containers ===" -ForegroundColor Cyan
    docker compose -f docker/docker-compose-fabric.yml up -d
    Write-Host "=== Fabric network is up and running. ===" -ForegroundColor Green
    Start-Sleep -Seconds 6
    Join-Channel
    Deploy-Chaincode
}

function Join-Channel {
    Write-Host "=== 4. Joining Orderer and Peers to $CHANNEL_NAME ===" -ForegroundColor Cyan
    docker exec cli osnadmin channel join --channelID $CHANNEL_NAME `
        --config-block "/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block" `
        -o orderer.pharma.com:7053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/pharma.com/orderers/orderer.pharma.com/tls/ca.crt

    Start-Sleep -Seconds 2

    # 1. Join Manufacturer Peer (default CLI identity)
    docker exec cli peer channel join -b "/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block"

    # 2. Join Distributor Peer
    docker exec -e CORE_PEER_LOCALMSPID=DistributorMSP `
        -e CORE_PEER_ADDRESS=peer0.distributor.pharma.com:8051 `
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/distributor.pharma.com/users/Admin@distributor.pharma.com/msp `
        -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/distributor.pharma.com/peers/peer0.distributor.pharma.com/tls/ca.crt `
        cli peer channel join -b "/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block"

    # 3. Join Retailer Peer
    docker exec -e CORE_PEER_LOCALMSPID=RetailerMSP `
        -e CORE_PEER_ADDRESS=peer0.retailer.pharma.com:9051 `
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/retailer.pharma.com/users/Admin@retailer.pharma.com/msp `
        -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/retailer.pharma.com/peers/peer0.retailer.pharma.com/tls/ca.crt `
        cli peer channel join -b "/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block"

    # 4. Join WasteFacility Peer
    docker exec -e CORE_PEER_LOCALMSPID=WasteFacilityMSP `
        -e CORE_PEER_ADDRESS=peer0.wastefacility.pharma.com:10051 `
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/wastefacility.pharma.com/users/Admin@wastefacility.pharma.com/msp `
        -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/wastefacility.pharma.com/peers/peer0.wastefacility.pharma.com/tls/ca.crt `
        cli peer channel join -b "/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block"

    # 5. Join Controller Peer
    docker exec -e CORE_PEER_LOCALMSPID=ControllerMSP `
        -e CORE_PEER_ADDRESS=peer0.controller.pharma.com:11051 `
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/controller.pharma.com/users/Admin@controller.pharma.com/msp `
        -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/controller.pharma.com/peers/peer0.controller.pharma.com/tls/ca.crt `
        cli peer channel join -b "/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block"

    Write-Host "=== All peers joined to $CHANNEL_NAME successfully. ===" -ForegroundColor Green
}

function Deploy-Chaincode {
    Write-Host "=== 5. Packaging and Deploying Chaincode $CC_NAME ===" -ForegroundColor Cyan
    docker exec cli /bin/bash /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/deployCC.sh $CHANNEL_NAME $CC_NAME $CC_VERSION
    Write-Host "=== Chaincode deployed and active on $CHANNEL_NAME. ===" -ForegroundColor Green
}

function Stop-Network {
    Write-Host "=== Stopping Fabric containers ===" -ForegroundColor Yellow
    docker compose -f docker/docker-compose-fabric.yml down -v --remove-orphans
    Write-Host "=== Network stopped. ===" -ForegroundColor Green
}

switch ($Mode) {
    "up" { Start-Network }
    "down" { Stop-Network }
    "generate" { Generate-Crypto; Create-ChannelArtifacts }
    "channel" { Join-Channel }
    "deployCC" { Deploy-Chaincode }
    "clean" {
        Stop-Network
        docker run --rm -v "${NetworkDir}:/network" $IMAGE_TOOLS rm -rf /network/organizations/peerOrganizations /network/organizations/ordererOrganizations /network/channel-artifacts/*
        Write-Host "=== Cleanup complete. ===" -ForegroundColor Green
    }
}
