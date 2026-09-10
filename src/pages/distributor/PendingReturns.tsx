import { useState, useEffect } from "react"
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
  ShieldAlert, 
  CheckCircle2, 
  Info,
  Layers
} from "lucide-react"

export function PendingReturns() {
  const returns = useSharedStore(state => state.returns.filter(
    r => r.status === "AWAITING_DISTRIBUTOR" || r.status === "IN_TRANSIT" || r.transitStatus === "HANDOFF_PENDING" || r.transitStatus === "IN_TRANSIT"
  ))
  
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
  }, [returns])

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
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-xs">
                    No pending reverse consignments awaiting distributor intake.
                  </TableCell>
                </TableRow>
              ) : (
                returns.map(req => {
                  const expectedWeight = req.grossWeightGrams || 1250
                  const currentScaleWeight = receivedWeightMap[req.returnId] ?? expectedWeight
                  const deltaPercent = Number((Math.abs(currentScaleWeight - expectedWeight) / expectedWeight * 100).toFixed(1))
                  const isWeightWarning = deltaPercent > 2.0

                  return (
                    <TableRow key={req.returnId} className="hover:bg-gray-50/60 transition-colors">
                      <TableCell>
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-xs">
                          {req.consignmentCode || req.returnId}
                        </span>
                        <div className="text-[11px] text-emerald-800 font-mono mt-1">
                          Seal: {req.sealToken || "SEAL-OK"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-bold text-xs text-gray-900">{req.batchNumber}</div>
                        <div className="text-xs text-gray-500">{req.productName}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{req.condition || "Intact Pack"}</div>
                      </TableCell>

                      <TableCell className="text-xs text-gray-700">
                        <div className="font-medium">{req.initiatedBy}</div>
                        <div className="text-[10px] text-gray-400">Jaipur Central Zone</div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Input 
                            type="number" 
                            value={receivedQtyMap[req.returnId] ?? req.requestedQuantity} 
                            onChange={(e) => setReceivedQtyMap(p => ({ ...p, [req.returnId]: parseInt(e.target.value) || 0 }))} 
                            className="w-20 h-8 font-mono text-xs font-bold"
                          />
                          <span className="text-xs text-gray-400 font-medium">/ {req.requestedQuantity}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-blue-600" />
                            <Input 
                              type="number" 
                              value={currentScaleWeight} 
                              onChange={(e) => setReceivedWeightMap(p => ({ ...p, [req.returnId]: parseInt(e.target.value) || 0 }))} 
                              className={`w-24 h-8 font-mono text-xs font-bold ${
                                isWeightWarning ? "border-red-500 text-red-600 bg-red-50" : "text-gray-900"
                              }`}
                            />
                            <span className="text-[11px] text-gray-400">g</span>
                          </div>
                          <div className="text-[10px]">
                            {isWeightWarning ? (
                              <span className="font-bold text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Δ {deltaPercent}% (&gt; ±2% Limit)
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Δ {deltaPercent}% (Within ±2%)
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button 
                          size="sm"
                          onClick={() => handleReceive(req.returnId, req.requestedQuantity)} 
                          disabled={submitting === req.returnId}
                          className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3"
                        >
                          <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
                          {submitting === req.returnId ? "Weighing..." : "Verify & Receive"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
