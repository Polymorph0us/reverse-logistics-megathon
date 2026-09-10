#!/usr/bin/env bash
#
# Pharma Reverse Chain Hyperledger Fabric Network Automation Script
#
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

IMAGE_TOOLS="hyperledger/fabric-tools:2.5"
CHANNEL_NAME="pharma-channel"
CC_NAME="pharma-contract"
CC_VERSION="1.0"
CC_SEQUENCE=1

function printHelp() {
  echo "Usage: ./scripts/network.sh [up|down|generate|channel|deployCC|clean]"
  echo "  up        - Generate crypto, start docker containers, create channel & deploy chaincode"
  echo "  down      - Stop all Fabric docker containers"
  echo "  generate  - Generate cryptographic identities using cryptogen (runs in Docker)"
  echo "  channel   - Create and join pharma-channel"
  echo "  deployCC  - Package and deploy pharma-contract chaincode"
  echo "  clean     - Remove generated certificates and channel artifacts"
}

function generateCrypto() {
  echo "=== 1. Generating Organization Identities and Certificates ==="
  mkdir -p channel-artifacts
  docker run --rm -v "$DIR":/network -w /network/organizations "$IMAGE_TOOLS" \
    cryptogen generate --config=cryptogen/crypto-config.yaml --output=peerOrganizations
  echo "=== Crypto material generated successfully. ==="
}

function createChannelArtifacts() {
  echo "=== 2. Creating Channel Genesis Block ==="
  docker run --rm -v "$DIR":/network -w /network "$IMAGE_TOOLS" \
    configtxgen -profile PharmaChannel -outputBlock channel-artifacts/${CHANNEL_NAME}.block -channelID ${CHANNEL_NAME} -configPath configtx/
  echo "=== Channel block created successfully. ==="
}

function networkUp() {
  generateCrypto
  createChannelArtifacts
  echo "=== 3. Starting Fabric Containers ==="
  docker compose -f docker/docker-compose-fabric.yml up -d
  echo "=== Fabric network is up and running. ==="
  sleep 5
  createChannel
  deployChaincode
}

function createChannel() {
  echo "=== 4. Joining Peers to ${CHANNEL_NAME} ==="
  # Execute join commands inside CLI
  docker exec cli osnadmin channel join --channelID ${CHANNEL_NAME} \
    --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block \
    -o orderer.pharma.com:7053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/pharma.com/orderers/orderer.pharma.com/tls/ca.crt \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/pharma.com/orderers/orderer.pharma.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/pharma.com/orderers/orderer.pharma.com/tls/server.key || true

  # Join manufacturer peer
  docker exec cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block || true
  echo "=== Channel ${CHANNEL_NAME} established. ==="
}

function deployChaincode() {
  echo "=== 5. Packaging and Deploying Chaincode ${CC_NAME} ==="
  docker exec cli peer lifecycle chaincode package ${CC_NAME}.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/pharma-contract --lang node --label ${CC_NAME}_${CC_VERSION}
  docker exec cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
  echo "=== Chaincode deployed to pharma-channel. ==="
}

function networkDown() {
  echo "=== Stopping Fabric containers ==="
  docker compose -f docker/docker-compose-fabric.yml down -v --remove-orphans
  echo "=== Network stopped. ==="
}

function cleanArtifacts() {
  networkDown
  echo "=== Cleaning generated artifacts ==="
  rm -rf organizations/peerOrganizations organizations/ordererOrganizations channel-artifacts/*.block
  echo "=== Done. ==="
}

MODE=$1

if [ "$MODE" == "up" ]; then
  networkUp
elif [ "$MODE" == "down" ]; then
  networkDown
elif [ "$MODE" == "generate" ]; then
  generateCrypto
  createChannelArtifacts
elif [ "$MODE" == "channel" ]; then
  createChannel
elif [ "$MODE" == "deployCC" ]; then
  deployChaincode
elif [ "$MODE" == "clean" ]; then
  cleanArtifacts
else
  printHelp
  exit 1
fi
