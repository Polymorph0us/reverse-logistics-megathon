import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getBatches } from "@/api/mockApi"
import type { BatchPassport } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { format, differenceInDays } from "date-fns"
import { 
  AlertTriangle, 
  Clock, 
  Search, 
  ArrowRightLeft, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2 
} from "lucide-react"

export function ExpiringMedicines() {
  const [batches, setBatches] = useState<BatchPassport[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    getBatches().then(data => {
      setBatches(data.filter(b => b.currentStatus === "EXPIRING_SOON" || b.currentStatus === "EXPIRED"))
    })
  }, [])

  // Filter batches based on search
  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      const q = searchQuery.toLowerCase()
      return (
        batch.product.name.toLowerCase().includes(q) ||
        batch.product.genericName.toLowerCase().includes(q) ||
        batch.batchNumber.toLowerCase().includes(q) ||
        batch.product.manufacturer.toLowerCase().includes(q)
      )
    })
  }, [batches, searchQuery])

  // KPI Calculations
  const totalExpiring = batches.length
  const expiringSoonCount = batches.filter(b => b.currentStatus === "EXPIRING_SOON").length
  const expiredCount = batches.filter(b => b.currentStatus === "EXPIRED").length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Clock className="w-8 h-8 text-amber-500" />
            Expiring Medicines Watchlist
          </h1>
          <p className="text-gray-500 mt-1">
            Automated CDSCO Rule 65 60-day expiry sentinel alerts and pharmacist reverse returns queue.
          </p>
        </div>
      </div>

      {/* Top KPI Stat Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/40 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Flagged Batches</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalExpiring}</div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Expiring Soon (&lt; 60 Days)</CardTitle>
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{expiringSoonCount}</div>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-gradient-to-br from-white to-red-50/40 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Past Expiry (Auto-Drafted)</CardTitle>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Watchlist Table */}
      <Card className="shadow-xs border-gray-200 overflow-hidden">
        <CardHeader className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by medicine, generic name, or batch number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="py-3 px-4">Product &amp; Formulation</TableHead>
                <TableHead className="py-3 px-4">Batch Number</TableHead>
                <TableHead className="py-3 px-4">Available Quantity</TableHead>
                <TableHead className="py-3 px-4">Expiry Date</TableHead>
                <TableHead className="py-3 px-4">Status</TableHead>
                <TableHead className="py-3 px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {filteredBatches.map((batch) => {
                const daysLeft = differenceInDays(new Date(batch.expiryDate), new Date())
                const isPastExpiry = daysLeft <= 0

                return (
                  <TableRow key={batch.batchId} className="hover:bg-gray-50/60 transition-colors">
                    <TableCell className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{batch.product.name}</div>
                      <div className="text-xs text-gray-500">{batch.product.genericName} • {batch.product.manufacturer}</div>
                    </TableCell>

                    <TableCell className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {batch.batchNumber}
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5 px-4 font-mono font-bold text-gray-800">
                      {batch.currentQuantity} <span className="text-xs font-normal text-gray-500">{batch.unit}</span>
                    </TableCell>

                    <TableCell className="py-3.5 px-4">
                      <div className="font-mono text-xs font-semibold text-gray-900">
                        {format(new Date(batch.expiryDate), "dd MMM yyyy")}
                      </div>
                      <div className="mt-0.5">
                        {isPastExpiry ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
                            Expired ({Math.abs(daysLeft)}d ago)
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                            {daysLeft} days remaining
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 px-4">
                      <StatusBadge status={batch.currentStatus} className="text-xs" />
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
                          onClick={() => navigate(`/batch/${batch.batchId}`)}
                          title="View Digital Batch Passport"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Passport
                        </Button>

                        <Button 
                          size="sm"
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                          onClick={() => navigate(`/retailer/return/${batch.batchId}`)}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                          Initiate Return
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}

              {filteredBatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-12 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    No expiring or expired batches matching your criteria. All stocks are safe for dispensing.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
