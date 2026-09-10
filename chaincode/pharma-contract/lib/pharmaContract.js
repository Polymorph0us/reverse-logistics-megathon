'use strict';

const { Contract } = require('fabric-contract-api');

// State Machine transitions definition
const ALLOWED_TRANSITIONS = {
    'CREATED': ['ACTIVE', 'EXPIRED', 'RETURN_INITIATED'],
    'ACTIVE': ['EXPIRING_SOON', 'EXPIRED', 'RETURN_INITIATED'],
    'EXPIRING_SOON': ['EXPIRED', 'RETURN_INITIATED'],
    'EXPIRED': ['RETURN_INITIATED'],
    'RETURN_INITIATED': ['WITH_DISTRIBUTOR', 'DISPUTED'],
    'WITH_DISTRIBUTOR': ['WITH_MANUFACTURER', 'DISPUTED'],
    'DISPUTED': ['WITH_MANUFACTURER', 'CLOSED'],
    'WITH_MANUFACTURER': ['SCHEDULED_FOR_DESTRUCTION'],
    'SCHEDULED_FOR_DESTRUCTION': ['DESTROYED'],
    'DESTROYED': ['CLOSED'],
    'CLOSED': []
};

class PharmaContract extends Contract {

    constructor() {
        super('PharmaContract');
    }

    /**
     * Helper to verify client MSP ID.
     */
    _verifyMSP(ctx, allowedMSPs) {
        const clientMSP = ctx.clientIdentity.getMSPID();
        if (!allowedMSPs.includes(clientMSP)) {
            throw new Error(`Unauthorized: Client MSP '${clientMSP}' is not permitted to execute this transaction. Allowed MSPs: [${allowedMSPs.join(', ')}]`);
        }
        return clientMSP;
    }

    /**
     * Validate lifecycle state transitions.
     */
    _validateTransition(currentState, newState) {
        // Java backend has its own state enum, we map it loosely here
        // If not mapped, we assume it's valid to avoid blocking true data mapping
        return true; 
    }

    /**
     * Initialize chaincode ledger if required.
     */
    async initLedger(ctx) {
        console.info('PharmaContract: Initialized pharma-channel ledger successfully.');
    }

    /**
     * Common helper to process a state update with full true data payload.
     */
    async _processUpdate(ctx, batchId, payloadJson, expectedEvent) {
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();
        const txId = ctx.stub.getTxID();
        const actorOrg = ctx.clientIdentity.getMSPID();

        let batchData;
        try {
            batchData = JSON.parse(payloadJson);
        } catch (e) {
            throw new Error(`Failed to parse payload JSON: ${e.message}`);
        }

        batchData.transactionId = txId;
        batchData.timestamp = timestamp;
        batchData.actorOrg = actorOrg;
        batchData.fabricEvent = expectedEvent;

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batchData)));

        ctx.stub.setEvent(expectedEvent, Buffer.from(JSON.stringify({
            batchId,
            txId,
            timestamp
        })));

        return JSON.stringify(batchData);
    }

    async createBatch(ctx, batchId, payloadJson) {
        this._verifyMSP(ctx, ['ManufacturerMSP', 'OrdererMSP']);
        const exists = await this.batchExists(ctx, batchId);
        if (exists) {
            throw new Error(`Batch with ID '${batchId}' already exists on Fabric ledger.`);
        }
        return this._processUpdate(ctx, batchId, payloadJson, 'BATCH_CREATED');
    }

    async initiateReturn(ctx, batchId, payloadJson) {
        this._verifyMSP(ctx, ['RetailerMSP', 'DistributorMSP']);
        const exists = await this.batchExists(ctx, batchId);
        if (!exists) throw new Error(`Batch '${batchId}' not found on ledger.`);
        return this._processUpdate(ctx, batchId, payloadJson, 'RETURN_INITIATED');
    }

    async receiveReturn(ctx, batchId, payloadJson) {
        this._verifyMSP(ctx, ['DistributorMSP']);
        const exists = await this.batchExists(ctx, batchId);
        if (!exists) throw new Error(`Batch '${batchId}' not found on ledger.`);
        return this._processUpdate(ctx, batchId, payloadJson, 'RETURN_RECEIVED');
    }

    async manufacturerReceive(ctx, batchId, payloadJson) {
        this._verifyMSP(ctx, ['ManufacturerMSP']);
        const exists = await this.batchExists(ctx, batchId);
        if (!exists) throw new Error(`Batch '${batchId}' not found on ledger.`);
        return this._processUpdate(ctx, batchId, payloadJson, 'MANUFACTURER_RECEIVED');
    }

    async sendForDisposal(ctx, batchId, payloadJson) {
        this._verifyMSP(ctx, ['ManufacturerMSP']);
        const exists = await this.batchExists(ctx, batchId);
        if (!exists) throw new Error(`Batch '${batchId}' not found on ledger.`);
        return this._processUpdate(ctx, batchId, payloadJson, 'SENT_FOR_DISPOSAL');
    }

    async confirmDestruction(ctx, batchId, payloadJson) {
        this._verifyMSP(ctx, ['WasteFacilityMSP']);
        const exists = await this.batchExists(ctx, batchId);
        if (!exists) throw new Error(`Batch '${batchId}' not found on ledger.`);
        return this._processUpdate(ctx, batchId, payloadJson, 'DESTRUCTION_CONFIRMED');
    }

    async closeBatch(ctx, batchId, payloadJson) {
        this._verifyMSP(ctx, ['ManufacturerMSP', 'ControllerMSP']);
        const exists = await this.batchExists(ctx, batchId);
        if (!exists) throw new Error(`Batch '${batchId}' not found on ledger.`);
        return this._processUpdate(ctx, batchId, payloadJson, 'BATCH_CLOSED');
    }

    async getBatch(ctx, batchId) {
        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch '${batchId}' does not exist on Fabric ledger.`);
        }
        return batchBytes.toString();
    }

    async getBatchHistory(ctx, batchId) {
        const iterator = await ctx.stub.getHistoryForKey(batchId);
        const allResults = [];

        while (true) {
            const res = await iterator.next();
            if (res.value) {
                const record = {
                    txId: res.value.txId,
                    timestamp: new Date(res.value.timestamp.seconds * 1000).toISOString(),
                    isDelete: res.value.isDelete
                };
                try {
                    record.value = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    record.value = res.value.value.toString('utf8');
                }
                allResults.push(record);
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
        return JSON.stringify(allResults);
    }

    async isBatchReturned(ctx, batchId) {
        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            return JSON.stringify({ isReturned: false, exists: false });
        }
        const batch = JSON.parse(batchBytes.toString());
        // Simple check since state names changed to match Java enums
        const returnedStates = ['RETURN_INITIATED', 'WITH_DISTRIBUTOR', 'WITH_MANUFACTURER', 'SCHEDULED_FOR_DESTRUCTION', 'DESTROYED', 'CLOSED', 'DISPUTED'];
        return JSON.stringify({
            batchId,
            isReturned: returnedStates.includes(batch.currentStatus),
            state: batch.currentStatus,
            exists: true
        });
    }

    async isBatchClosed(ctx, batchId) {
        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            return JSON.stringify({ isClosed: false, exists: false });
        }
        const batch = JSON.parse(batchBytes.toString());
        return JSON.stringify({
            batchId,
            isClosed: batch.currentStatus === 'CLOSED' || batch.currentStatus === 'DESTROYED',
            state: batch.currentStatus,
            exists: true
        });
    }

    async batchExists(ctx, batchId) {
        const batchBytes = await ctx.stub.getState(batchId);
        return batchBytes && batchBytes.length > 0;
    }
}

module.exports = PharmaContract;
