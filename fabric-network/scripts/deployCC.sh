#!/bin/bash
set -e

CHANNEL_NAME=${1:-"pharma-channel"}
CC_NAME=${2:-"pharma-contract"}
CC_VERSION=${3:-"1.0"}
CC_SEQUENCE=${4:-"1"}
CC_SRC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/pharma-contract"
ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/pharma.com/orderers/orderer.pharma.com/tls/ca.crt"

echo "=== Packaging Chaincode: $CC_NAME v$CC_VERSION ==="
peer lifecycle chaincode package ${CC_NAME}.tar.gz \
  --path ${CC_SRC_PATH} \
  --lang node \
  --label ${CC_NAME}_${CC_VERSION}

echo "=== Installing Chaincode on peer0.manufacturer.pharma.com ==="
peer lifecycle chaincode install ${CC_NAME}.tar.gz >&log.txt
cat log.txt

PACKAGE_ID=$(sed -n "/${CC_NAME}_${CC_VERSION}/{s/^.*Identifier: //;p;}" log.txt)
if [ -z "$PACKAGE_ID" ]; then
  PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "${CC_NAME}_${CC_VERSION}" | head -n 1 | awk '{print $3}' | sed 's/,//')
fi
echo "Package ID: ${PACKAGE_ID}"

echo "=== Approving Chaincode for ManufacturerMSP ==="
peer lifecycle chaincode approveformyorg -o orderer.pharma.com:7050 \
  --ordererTLSHostnameOverride orderer.pharma.com \
  --channelID ${CHANNEL_NAME} \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --package-id ${PACKAGE_ID} \
  --sequence ${CC_SEQUENCE} \
  --tls \
  --cafile ${ORDERER_CA}

echo "=== Committing Chaincode Definition to ${CHANNEL_NAME} ==="
peer lifecycle chaincode commit -o orderer.pharma.com:7050 \
  --ordererTLSHostnameOverride orderer.pharma.com \
  --channelID ${CHANNEL_NAME} \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --sequence ${CC_SEQUENCE} \
  --tls \
  --cafile ${ORDERER_CA} \
  --peerAddresses peer0.manufacturer.pharma.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/manufacturer.pharma.com/peers/peer0.manufacturer.pharma.com/tls/ca.crt

echo "=== Initializing Chaincode Ledger ==="
peer chaincode invoke -o orderer.pharma.com:7050 \
  --ordererTLSHostnameOverride orderer.pharma.com \
  --tls \
  --cafile ${ORDERER_CA} \
  -C ${CHANNEL_NAME} \
  -n ${CC_NAME} \
  --peerAddresses peer0.manufacturer.pharma.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/manufacturer.pharma.com/peers/peer0.manufacturer.pharma.com/tls/ca.crt \
  -c '{"function":"initLedger","Args":[]}'

echo "=== Chaincode deployment complete and verified! ==="
