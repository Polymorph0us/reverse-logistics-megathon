import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getBatches } from "@/api/mockApi"
import type { BatchPassport } from "@/api/types"
import { useSharedStore } from "@/store/useSharedStore"
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
  Layers,
  Trash2,
  PlusCircle,
  X
} from "lucide-react"

export function RetailerInventory() {
  const [batches, setBatches] = useState<BatchPassport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    batchNumber: "",
    manufacturer: "",
    expiryDate: "",
    mfgDate: "",
    quantity: "100",
    unit: "STRIPS",
    status: "ACTIVE"
  })
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    getBatches().then((data) => {
      setBatches(data)
      setLoading(false)
    })
  }, [])

  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear all mock data? This will empty all batches and returns so you can enter fresh data.")) {
      useSharedStore.getState().clearAllData()
      setBatches([])
    }
  }

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.batchNumber.trim()) return

    const now = new Date().toISOString()
    const expiryIso = formData.expiryDate 
      ? new Date(formData.expiryDate).toISOString() 
      : new Date(Date.now() + 30 * 86400000).toISOString()
    const mfgIso = formData.mfgDate 
      ? new Date(formData.mfgDate).toISOString() 
      : new Date(Date.now() - 180 * 86400000).toISOString()

    const newBatch: BatchPassport = {
      batchId: `BATCH-${Date.now().toString().slice(-6)}`,
      batchNumber: formData.batchNumber.toUpperCase().trim(),
      product: {
        productId: `PROD-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim(),
        genericName: formData.genericName.trim() || formData.name.trim(),
        manufacturer: formData.manufacturer.trim() || "National Pharma Ltd",
      },
      manufacturingDate: mfgIso,
      expiryDate: expiryIso,
      currentStatus: formData.status as any,
      currentQuantity: Number(formData.quantity) || 100,
      originalQuantity: Number(formData.quantity) || 100,
      unit: formData.unit,
      currentOwner: {
        organizationId: "ORG-001",
        organizationName: "Raj Pharmacy (Jaipur)",
        role: "RETAILER",
      },
      riskLevel: "LOW",
      riskScore: 0,
      timeline: [
        {
          eventId: `EV-${Date.now().toString().slice(-4)}`,
          eventType: "BATCH_CREATED",
          status: "COMPLETED",
          timestamp: now,
          actor: formData.manufacturer.trim() || "Manufacturer",
          location: "Pharmacy Inward Dock"
        }
      ]
    }

    useSharedStore.getState().addBatch(newBatch)
    setBatches(prev => [newBatch, ...prev])
    setIsAddModalOpen(false)
    setFormData({
      name: "",
      genericName: "",
      batchNumber: "",
      manufacturer: "",
      expiryDate: "",
      mfgDate: "",
      quantity: "100",
      unit: "STRIPS",
      status: "ACTIVE"
    })
  }

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

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            onClick={handleClearAllData}
            title="Clear all mock batches and start completely fresh"
          >
            <Trash2 className="w-4 h-4 mr-1.5 text-red-500" />
            Clear Mock Data
          </Button>

          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Add Medicine Batch
          </Button>
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

      {/* CDSCO 2025 Expiry Watchdog & Auto-Drafted Returns Section (<60 Days) */}
      {batches.filter(b => {
        const exp = new Date(b.expiryDate)
        return isBefore(exp, addDays(new Date(), 60)) && b.currentStatus !== "DESTROYED"
      }).length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/60 via-white to-orange-50/40 shadow-sm overflow-hidden">
          <div className="bg-amber-100/70 px-4 py-2.5 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                CDSCO 2025 Expiry Watchdog (<span className="underline">60-Day Mandate Window</span>)
              </span>
            </div>
            <span className="text-[11px] font-medium text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
              Automated Reverse Dispatch Active
            </span>
          </div>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-gray-600">
              India's CDSCO mandate requires return to distributor within 30 days of expiry. Batches nearing or past expiry are automatically queued below with pre-drafted returns mapped to your designated distributor.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {batches.filter(b => {
                const exp = new Date(b.expiryDate)
                return isBefore(exp, addDays(new Date(), 60)) && b.currentStatus !== "DESTROYED"
              }).slice(0, 3).map((b) => {
                const exp = new Date(b.expiryDate)
                const expired = isPast(exp)
                const days = Math.abs(Math.round((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                const isStaged = b.currentStatus === "RETURN_INITIATED" || b.currentStatus === "WITH_DISTRIBUTOR"

                return (
                  <div key={b.batchId} className="bg-white p-3 rounded-lg border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-2.5">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-gray-900 line-clamp-1">{b.product.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          expired ? "bg-red-100 text-red-700 border border-red-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {expired ? `EXPIRED (${days}d ago)` : `${days}d left`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                          {b.batchNumber}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {b.currentQuantity} {b.unit}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        Mapped to: <span className="font-semibold text-gray-600">National Distributors Ltd</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-emerald-700">
                        {isStaged ? "Return In Transit" : "Auto-Draft Ready"}
                      </span>
                      {!isStaged ? (
                        <Button 
                          size="sm" 
                          className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-2.5"
                          onClick={() => navigate(`/retailer/return/${b.batchId}`)}
                        >
                          <ArrowRightLeft className="w-3 h-3 mr-1" />
                          Prepare & Seal Return
                        </Button>
                      ) : (
                        <span className="text-[11px] font-mono text-gray-500 font-semibold">
                          LOCKED (RETURNED)
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                    <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                      <Package className="w-14 h-14 text-emerald-300" />
                      <p className="font-semibold text-gray-800 text-lg">
                        {batches.length === 0 ? "Inventory is currently empty" : "No matching medicine batches found"}
                      </p>
                      <p className="text-xs text-gray-500 max-w-sm">
                        {batches.length === 0 
                          ? "All mock batches have been cleared. Click below to add your new medicine batch."
                          : "Try adjusting your search criteria or clear the filters."}
                      </p>
                      {batches.length === 0 ? (
                        <Button 
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                          <PlusCircle className="w-4 h-4 mr-1.5" />
                          Add First Medicine Batch
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
                          className="mt-2 text-xs"
                        >
                          Reset Filters
                        </Button>
                      )}
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

      {/* Add Medicine Batch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-200" />
                <h3 className="font-semibold text-lg">Add New Medicine Batch</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-emerald-100 hover:text-white p-1 rounded-md transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBatch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Medicine Name *</label>
                  <Input
                    required
                    placeholder="e.g. Augmentin 625 Duo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Generic Formula</label>
                  <Input
                    placeholder="e.g. Amoxicillin + Clavulanic"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Batch Number *</label>
                  <Input
                    required
                    placeholder="e.g. BATCH-AUG-9941"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Manufacturer</label>
                  <Input
                    placeholder="e.g. PharmaCorp India"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Expiry Date *</label>
                  <Input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Mfg Date</label>
                  <Input
                    type="date"
                    value={formData.mfgDate}
                    onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Unit</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="STRIPS">STRIPS</option>
                    <option value="BOTTLES">BOTTLES</option>
                    <option value="BOXES">BOXES</option>
                    <option value="VIALS">VIALS</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Initial Status</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="EXPIRING_SOON">EXPIRING SOON</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save & Add to Inventory
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
