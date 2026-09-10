import { useState, useEffect, useMemo } from "react"
import { receiveReturn } from "@/api/mockApi"
import type { ReceiveReturnResponse } from "@/api/types"
import { useSharedStore } from "@/store/useSharedStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { AlertTriangle, PackageCheck } from "lucide-react"

export function PendingReturns() {
  const allReturns = useSharedStore(state => state.returns)
  const returns = useMemo(() => allReturns.filter(r => r.status === "AWAITING_DISTRIBUTOR"), [allReturns])
  
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReceiveReturnResponse | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    const qtys: Record<string, string> = {}
    returns.forEach(r => {
      if (receivedQtyMap[r.returnId] === undefined) {
        // default to 94 to show off discrepancy if requested is 100
        qtys[r.returnId] = r.requestedQuantity === 100 ? "94" : r.requestedQuantity.toString()
      }
    })
    if (Object.keys(qtys).length > 0) {
      setReceivedQtyMap(prev => ({...prev, ...qtys}))
    }
  }, [returns, receivedQtyMap])

  const handleReceive = async (returnId: string, expectedQty: number) => {
    setSubmitting(returnId)
    const qtyStr = receivedQtyMap[returnId]
    const qty = (qtyStr && qtyStr !== "") ? parseInt(qtyStr) : expectedQty
    const res = await receiveReturn(returnId, qty, expectedQty)
    setResult(res)
    setSubmitting(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Pending Incoming Returns</h1>
      
      {result && result.reconciliationStatus === "DISCREPANCY" && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md animate-in slide-in-from-top-4">
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">⚠ DISCREPANCY DETECTED</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Expected: <strong>{result.expectedQuantity}</strong></p>
                <p>Received: <strong>{result.receivedQuantity}</strong></p>
                <p>Missing: <strong>{result.difference} units</strong></p>
              </div>
              <p className="mt-2 text-xs font-bold text-red-800 bg-red-200 inline-block px-2 py-1 rounded">
                Risk Level: {result.riskLevel}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {result && result.reconciliationStatus === "MATCHED" && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-md animate-in slide-in-from-top-4">
          <div className="flex">
            <PackageCheck className="h-6 w-6 text-emerald-500" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-emerald-800">Return Received Successfully</h3>
              <p className="mt-1 text-sm text-emerald-700">Quantities matched perfectly.</p>
            </div>
          </div>
        </div>
      )}
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return ID</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Expected Qty</TableHead>
              <TableHead>Receive Qty</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No pending returns at this time.
                </TableCell>
              </TableRow>
            ) : returns.map(req => (
              <TableRow key={req.returnId}>
                <TableCell className="font-medium">{req.returnId}</TableCell>
                <TableCell>
                  <div>{req.batchNumber}</div>
                  <div className="text-xs text-gray-500">{req.productName}</div>
                </TableCell>
                <TableCell>{req.initiatedBy}</TableCell>
                <TableCell>{req.requestedQuantity} UNITS</TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={receivedQtyMap[req.returnId] ?? ''} 
                    onChange={(e) => setReceivedQtyMap(p => ({...p, [req.returnId]: e.target.value}))} 
                    className="w-24 h-8"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    onClick={() => handleReceive(req.returnId, req.requestedQuantity)} 
                    disabled={submitting === req.returnId}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <PackageCheck className="w-4 h-4 mr-2" />
                    {submitting === req.returnId ? "Receiving..." : "Receive"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
