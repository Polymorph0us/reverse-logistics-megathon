import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getBatches } from "@/api/mockApi"
import type { BatchPassport } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, isPast, isBefore, addDays } from "date-fns"
import { 
  Package, 
  Search, 
  AlertTriangle, 
  Clock, 
  ArrowRightLeft, 
  CheckCircle2, 
  ExternalLink, 
  Filter,
  Layers
} from "lucide-react"

export function RetailerInventory() {
  const [batches, setBatches] = useState<BatchPassport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    getBatches().then((data) => {
      // Filter batches belonging to retailer or relevant to retail stock
      setBatches(data)
      setLoading(false)
    })
  }, [])

  // Filter batches based on search query and status filter
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const matchesSearch = 
        batch.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.product.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.product.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (statusFilter === "ALL") return true
      if (statusFilter === "ACTIVE") return batch.currentStatus === "ACTIVE"
      if (statusFilter === "EXPIRING_SOON") return batch.currentStatus === "EXPIRING_SOON"
      if (statusFilter === "EXPIRED") return batch.currentStatus === "EXPIRED"
      if (statusFilter === "RETURN_INITIATED") return batch.currentStatus === "RETURN_INITIATED"
      
      return batch.currentStatus === statusFilter
    })
  }, [batches, searchQuery, statusFilter])

  // KPI calculations
  const totalCount = batches.length
  const activeCount = batches.filter(b => b.currentStatus === "ACTIVE").length
  const expiringSoonCount = batches.filter(b => b.currentStatus === "EXPIRING_SOON").length
  const expiredCount = batches.filter(b => b.currentStatus === "EXPIRED").length
  const returnInitiatedCount = batches.filter(b => b.currentStatus === "RETURN_INITIATED").length

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8 text-emerald-600" />
            Pharmacy Medicine Inventory
          </h1>
          <p className="text-gray-500 mt-1">
            Real-time batch tracking, stock integrity, and automated reverse-logistics lifecycle.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Batches</CardTitle>
            <Layers className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
            <p className="text-xs text-gray-500 mt-1">Tracked across supply chain</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Stock</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            <p className="text-xs text-gray-500 mt-1">Verified safe for dispensing</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expiring Soon</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{expiringSoonCount}</div>
            <p className="text-xs text-amber-700 font-medium mt-1">Eligible for supplier recall</p>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-gradient-to-br from-white to-red-50/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expired / In Return</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {expiredCount + returnInitiatedCount}
            </div>
            <p className="text-xs text-red-600 font-medium mt-1">
              {returnInitiatedCount} returns in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search by medicine name, generic name, batch #, or manufacturer..."
                className="pl-9 h-10 bg-gray-50/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="w-full md:w-56 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 hidden md:block" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses ({totalCount})</SelectItem>
                  <SelectItem value="ACTIVE">Active ({activeCount})</SelectItem>
                  <SelectItem value="EXPIRING_SOON">Expiring Soon ({expiringSoonCount})</SelectItem>
                  <SelectItem value="EXPIRED">Expired ({expiredCount})</SelectItem>
                  <SelectItem value="RETURN_INITIATED">Return Initiated ({returnInitiatedCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="font-semibold text-gray-700">Product & Manufacturer</TableHead>
                <TableHead className="font-semibold text-gray-700">Batch Number</TableHead>
                <TableHead className="font-semibold text-gray-700">Available Stock</TableHead>
                <TableHead className="font-semibold text-gray-700">Expiry Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Risk Score</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading inventory data from ledger store...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-gray-300" />
                      <p className="font-medium text-gray-700">No matching medicine batches found</p>
                      <p className="text-xs text-gray-400">
                        Try adjusting your search criteria or clear the filters.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
                        className="mt-2 text-xs"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches.map((batch) => {
                  const expiryDateObj = new Date(batch.expiryDate)
                  const isExpired = isPast(expiryDateObj)
                  const isExpiringSoon = !isExpired && isBefore(expiryDateObj, addDays(new Date(), 60))
                  const canReturn = batch.currentStatus === "ACTIVE" || batch.currentStatus === "EXPIRING_SOON" || batch.currentStatus === "EXPIRED"

                  return (
                    <TableRow key={batch.batchId} className="hover:bg-gray-50/60 transition-colors">
                      <TableCell>
                        <div className="font-semibold text-gray-900">{batch.product.name}</div>
                        <div className="text-xs text-gray-500">{batch.product.genericName}</div>
                        <div className="text-xs text-emerald-700 font-medium mt-0.5">
                          Mfr: {batch.product.manufacturer}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-200">
                          {batch.batchNumber}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-gray-900">
                          {batch.currentQuantity} <span className="text-xs text-gray-500 font-normal">{batch.unit}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Original: {batch.originalQuantity}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className={`text-sm font-medium ${isExpired ? "text-red-600 font-bold" : isExpiringSoon ? "text-amber-600 font-semibold" : "text-gray-700"}`}>
                          {format(expiryDateObj, "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-gray-400">
                          {isExpired ? "Expired" : isExpiringSoon ? "Nearing Expiry" : "Valid"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={batch.currentStatus} />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                            batch.riskLevel === "CRITICAL" ? "bg-red-600 animate-pulse" :
                            batch.riskLevel === "HIGH" ? "bg-red-500" :
                            batch.riskLevel === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"
                          }`} />
                          <span className="text-xs font-medium text-gray-700">{batch.riskLevel}</span>
                          <span className="text-xs text-gray-400">({batch.riskScore})</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900"
                            onClick={() => navigate(`/batch/${batch.batchId}`)}
                            title="View Immutable Batch Passport"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Passport
                          </Button>

                          {canReturn && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
                              onClick={() => navigate(`/retailer/return/${batch.batchId}`)}
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                              Return
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
