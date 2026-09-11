import { useSharedStore } from "@/store/useSharedStore"
import type { ReturnRequest, Notification } from "@/api/types"

/**
 * Automated Expiry Sentinel:
 * 1. Alerts the pharmacist 60 days before expiry based on manufacturing & expiry dates.
 * 2. Auto-generates a Return Request mapped to the regional distributor when stock crosses expiry.
 */
export function runAutomatedExpiryCheck() {
  const store = useSharedStore.getState()
  const batches = store.batches || []
  const existingNotifications = store.notifications || []
  const existingReturns = store.returns || []

  const today = new Date()
  const msPerDay = 1000 * 60 * 60 * 24

  batches.forEach((batch) => {
    // Skip if already denatured or destroyed
    if (batch.currentStatus === "DESTROYED" || batch.currentStatus === "CONDITION_DENATURED_CONDEMNED" || batch.currentStatus === "SCHEDULED_FOR_DESTRUCTION") {
      return
    }

    const expDate = new Date(batch.expiryDate)
    const mfgDate = new Date(batch.manufacturingDate)
    
    // Calculate total shelf life in months
    const shelfLifeMonths = Math.max(
      1,
      Math.round((expDate.getTime() - mfgDate.getTime()) / (msPerDay * 30.4375))
    )

    // Calculate days remaining to expiry
    const daysRemaining = Math.ceil((expDate.getTime() - today.getTime()) / msPerDay)

    // ── CASE 1: Within 60 days before expiry (EXPIRING_SOON warning) ──────────
    if (daysRemaining <= 60 && daysRemaining > 0) {
      if (batch.currentStatus === "ACTIVE") {
        store.updateBatch(batch.batchId, {
          currentStatus: "EXPIRING_SOON",
          riskLevel: "MEDIUM",
          riskScore: 45,
        })
      }

      const notifId = `NOTIF-EXP60-${batch.batchId}`
      const hasNotif = existingNotifications.some(n => n.id === notifId)
      if (!hasNotif) {
        const notif: Notification = {
          id: notifId,
          type: "EXPIRY_WARNING",
          title: `⚠️ Expiring Within 60 Days: ${batch.product.name}`,
          message: `Batch ${batch.batchNumber} (Mfg: ${batch.manufacturingDate}, Shelf-life: ${shelfLifeMonths}m) expires on ${batch.expiryDate} (${daysRemaining} days left). Mandatory CDSCO Rule 65 staging required.`,
          severity: "WARNING",
          read: false,
          createdAt: new Date().toISOString(),
          batchId: batch.batchId,
          batchNumber: batch.batchNumber,
          targetRole: "RETAILER",
        }
        store.addNotification(notif)
      }
    }

    // ── CASE 2: Crossed expiry date (Auto-Generate Return Request) ─────────────
    if (daysRemaining <= 0 || batch.currentStatus === "EXPIRED") {
      // Check if return request already created for this batch
      const returnExists = existingReturns.some(r => r.batchId === batch.batchId)

      if (!returnExists && batch.currentQuantity > 0) {
        const batchSuffix = batch.batchNumber.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase()
        const autoReturnId = `RET-AUTO-${batchSuffix}`
        const consignmentCode = `BOX-AUTO-${batchSuffix}`
        const sealToken = `AUTO-SEAL-${batchSuffix}`
        const grossWeight = Math.round(batch.currentQuantity * 12.5 + 150)
        const handshakeOtp = String(Math.floor(100000 + Math.random() * 900000))

        const newReturn: ReturnRequest = {
          returnId: autoReturnId,
          batchId: batch.batchId,
          batchNumber: batch.batchNumber,
          productName: batch.product.name,
          requestedQuantity: batch.currentQuantity,
          status: "AWAITING_DISTRIBUTOR",
          initiatedBy: "Auto-Sentinel (CDSCO Expiry Mandate)",
          createdAt: new Date().toISOString(),
          pickupStatus: "PENDING",
          condition: `Automated Post-Expiry Recall - Expired on ${batch.expiryDate}`,
          consignmentCode,
          sealToken,
          grossWeightGrams: grossWeight,
          handshakeOtp,
          otpExpiresAt: Date.now() + 86400000, // 24 hours valid
          geoVerified: true,
          transitStatus: "HANDOFF_PENDING",
          hashTxId: `hash-tx-auto-${Math.random().toString(36).substring(2, 10)}`,
        }

        store.addReturn(newReturn)

        // Update batch status to RETURN_INITIATED
        store.updateBatch(batch.batchId, {
          currentStatus: "RETURN_INITIATED",
          riskLevel: "HIGH",
          riskScore: 80,
        })

        // Add automated dispatch notification
        const autoNotifId = `NOTIF-AUTO-${batch.batchId}`
        const hasAutoNotif = existingNotifications.some(n => n.id === autoNotifId)
        if (!hasAutoNotif) {
          const notif: Notification = {
            id: autoNotifId,
            type: "AUTO_RETURN_GENERATED",
            title: `🚨 Auto-Return Dispatched: ${batch.batchNumber}`,
            message: `Batch ${batch.batchNumber} has crossed its expiry date (${batch.expiryDate}). Reverse logistics consignment ${autoReturnId} auto-generated and dispatched to mapped distributor ABC Distributors Central Logistics.`,
            severity: "CRITICAL",
            read: false,
            createdAt: new Date().toISOString(),
            batchId: batch.batchId,
            batchNumber: batch.batchNumber,
            targetRole: "RETAILER",
          }
          store.addNotification(notif)
        }
      }
    }
  })
}
