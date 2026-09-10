import { useState } from "react"
import { receiveReturn } from "@/api/mockApi"
import type { ReceiveReturnResponse } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { AlertTriangle, PackageCheck } from "lucide-react"

export function PendingReturns() {
  const [receivedQty, setReceivedQty] = useState<number>(94) // Set to 94 to trigger the exact prompt flow
  const [result, setResult] = useState<ReceiveReturnResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleReceive = async (returnId: string) => {
    setSubmitting(true)
    const res = await receiveReturn(returnId, receivedQty, 100)
    setResult(res)
    setSubmitting(false)
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
            <TableRow>
              <TableCell className="font-medium">RET-7281</TableCell>
              <TableCell>
                <div>ABC12345</div>
                <div className="text-xs text-gray-500">Augmentin 625 Duo</div>
              </TableCell>
              <TableCell>Raj Pharmacy (Jaipur)</TableCell>
              <TableCell>100 STRIPS</TableCell>
              <TableCell>
                <Input 
                  type="number" 
                  value={receivedQty} 
                  onChange={(e) => setReceivedQty(parseInt(e.target.value))} 
                  className="w-24 h-8"
                  max={100}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  onClick={() => handleReceive("RET-7281")} 
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <PackageCheck className="w-4 h-4 mr-2" />
                  Receive
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
