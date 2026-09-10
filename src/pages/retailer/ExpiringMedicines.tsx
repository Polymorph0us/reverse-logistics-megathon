import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getBatches } from "@/api/mockApi"
import type { BatchPassport } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"

export function ExpiringMedicines() {
  const [batches, setBatches] = useState<BatchPassport[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    getBatches().then(data => {
      setBatches(data.filter(b => b.currentStatus === "EXPIRING_SOON" || b.currentStatus === "EXPIRED"))
    })
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Expiring Medicines</h1>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Batch Number</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.batchId}>
                <TableCell>
                  <div className="font-medium">{batch.product.name}</div>
                  <div className="text-xs text-gray-500">{batch.product.genericName}</div>
                </TableCell>
                <TableCell className="font-mono text-sm">{batch.batchNumber}</TableCell>
                <TableCell>{batch.currentQuantity} {batch.unit}</TableCell>
                <TableCell>{format(new Date(batch.expiryDate), "MMM dd, yyyy")}</TableCell>
                <TableCell><StatusBadge status={batch.currentStatus} /></TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => navigate(`/retailer/return/${batch.batchId}`)}
                  >
                    Initiate Return
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {batches.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No expiring medicines found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
