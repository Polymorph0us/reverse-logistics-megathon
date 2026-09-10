#!/bin/bash
ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/pharma.com/orderers/orderer.pharma.com/tls/ca.crt"
PEER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/manufacturer.pharma.com/peers/peer0.manufacturer.pharma.com/tls/ca.crt"

PAYLOAD='{"batchNumber":"ABC12345","productName":"Augmentin 625 Duo","manufacturer":"GSK","status":"ACTIVE","quantity":100,"expiryDate":"2026-09-30"}'
ARGS=$(jq -nc --arg f "createBatch" --arg id "BATCH-2026-00123" --arg p "$PAYLOAD" '{"function":$f, "Args":[$id, $p]}')

peer chaincode invoke -o orderer.pharma.com:7050 \
  --ordererTLSHostnameOverride orderer.pharma.com \
  --tls \
  --cafile ${ORDERER_CA} \
  -C pharma-channel \
  -n pharma-contract \
  --peerAddresses peer0.manufacturer.pharma.com:7051 \
  --tlsRootCertFiles ${PEER_CA} \
  -c "$ARGS"
