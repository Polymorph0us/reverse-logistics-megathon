import { useState, useEffect, useMemo } from "react"
import { receiveReturn } from "@/api/mockApi"
import type { ReceiveReturnResponse } from "@/api/types"
import { useSharedStore } from "@/store/useSharedStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { 
  AlertTriangle, 
  PackageCheck, 
  Scale, 
  Truck, 
  Layers
} from "lucide-react"

export function PendingReturns() {
  const allReturns = useSharedStore(state => state.returns)
  const returns = useMemo(() => allReturns.filter(
    r => r.status === "AWAITING_DISTRIBUTOR" || r.status === "IN_TRANSIT" || r.transitStatus === "HANDOFF_PENDING" || r.transitStatus === "IN_TRANSIT"
  ), [allReturns])
  
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, number>>({})
  const [receivedWeightMap, setReceivedWeightMap] = useState<Record<string, number>>({})
  const [result, setResult] = useState<(ReceiveReturnResponse & { weightDeltaPercent?: number; weightStatus?: string }) | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    const qtys: Record<string, number> = {}
    const weights: Record<string, number> = {}
    returns.forEach(r => {
      if (receivedQtyMap[r.returnId] === undefined) {
        qtys[r.returnId] = r.requestedQuantity
      }
      if (receivedWeightMap[r.returnId] === undefined) {
        weights[r.returnId] = r.grossWeightGrams || 1250
      }
    })
    if (Object.keys(qtys).length > 0) {
      setReceivedQtyMap(prev => ({ ...prev, ...qtys }))
      setReceivedWeightMap(prev => ({ ...prev, ...weights }))
    }
  }, [returns, receivedQtyMap])

  const handleReceive = async (returnId: string, expectedQty: number) => {
    setSubmitting(returnId)
    const qty = receivedQtyMap[returnId] ?? expectedQty
    const intakeWeight = receivedWeightMap[returnId]
    const res = await receiveReturn(returnId, qty, expectedQty, intakeWeight)
    setResult(res)
    setSubmitting(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
          <Truck className="w-8 h-8 text-blue-600" />
          Distributor Intake & Handoff Verification
        </h1>
        <p className="text-gray-500 mt-1">
          Verify digital consignment seals, execute intake scale weight tolerance check (±2%), and sign off reverse custody.
        </p>
      </div>

      {/* Discrepancy Alert */}
      {result && (result.reconciliationStatus === "DISCREPANCY" || result.weightStatus === "DISPUTE_MISMATCH") && (
        <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm animate-in slide-in-from-top-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-red-900">
                🚨 SECURITY ALERT: REVERSE CHAIN DISCREPANCY DETECTED
              </h3>
              {result.weightStatus === "DISPUTE_MISMATCH" ? (
                <p className="text-xs text-red-800">
                  <span className="font-bold">Gross Mass Delta Violation:</span> Intake weight deviated by <span className="font-mono font-extrabold">{result.weightDeltaPercent}%</span> (exceeding strict ±2.0% allowable tolerance). Consignment locked into <span className="font-mono font-bold text-red-950">DISPUTE_WEIGHT_MISMATCH</span> state. CDSCO notified of suspected in-transit pilferage.
                </p>
              ) : (
                <p className="text-xs text-red-800">
                  Quantity discrepancy: Expected {result.expectedQuantity} units, but received {result.receivedQuantity} units ({result.difference} missing).
                </p>
              )}
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[11px] font-bold text-red-900 bg-red-200/80 px-2.5 py-0.5 rounded-full">
                  Status: LOCKED_IN_DISPUTE
                </span>
                <span className="text-[11px] text-red-700">Commercial credit note suspended pending physical investigation.</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Match Alert */}
      {result && result.reconciliationStatus === "MATCHED" && result.weightStatus === "MATCHED" && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r-xl shadow-sm animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <PackageCheck className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-emerald-900">Consignment Accepted & Cryptographically Stamped</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Physical seals verified, gross scale mass matched within tolerance, and return logged to Key-Value SHA-256 Hash Chain.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Intake Table */}
      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <CardHeader className="bg-gray-50/70 border-b border-gray-100 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Consignments Awaiting Warehouse Intake
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="text-xs font-semibold text-gray-700">Consignment Box</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">Batch & Product</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">From (Pharmacy)</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">Expected / Received Qty</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">Intake Scale Mass (g)</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-right">Intake Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-xs">
                    No consignments awaiting warehouse intake.
                  </TableCell>
                </TableRow>
              ) : (
                returns.map((r) => (
                  <TableRow key={r.returnId} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono text-xs font-medium text-gray-900">
                      {r.returnId}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900 text-xs">{r.productName}</div>
                      <div className="text-[11px] text-gray-500 font-mono">Batch: {r.batchNumber}</div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {r.initiatedBy}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-600">{r.requestedQuantity}</span>
                        <Input
                          type="number"
                          value={receivedQtyMap[r.returnId] ?? r.requestedQuantity}
                          onChange={(e) => setReceivedQtyMap(prev => ({ ...prev, [r.returnId]: parseInt(e.target.value) || 0 }))}
                          className="w-16 h-7 text-xs font-mono"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-gray-400" />
                        <Input
                          type="number"
                          value={receivedWeightMap[r.returnId] ?? 1250}
                          onChange={(e) => setReceivedWeightMap(prev => ({ ...prev, [r.returnId]: parseFloat(e.target.value) || 0 }))}
                          className="w-20 h-7 text-xs font-mono"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleReceive(r.returnId, r.requestedQuantity)}
                        disabled={submitting === r.returnId}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3"
                      >
                        {submitting === r.returnId ? "Verifying..." : "Verify & Intake"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
