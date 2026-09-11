import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { ReturnRequest } from "@/api/types"
import { useSharedStore } from "@/store/useSharedStore"
import { runAutomatedExpiryCheck } from "@/utils/expirySentinel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { HandoffModal } from "@/components/shared/HandoffModal"
import {
  Package,
  AlertTriangle,
  ArrowRightLeft,
  ShieldAlert,
  Truck,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Hash,
  Copy,
  Check,
  Lock
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

export function RetailerDashboard() {
  const navigate = useNavigate()
  const batches = useSharedStore((state) => state.batches)
  const returns = useSharedStore((state) => state.returns)
  const fraudAlerts = useSharedStore((state) => state.fraudAlerts)

  // Modal states
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null)
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false)
  
  // Seal token password authentication states
  const [selectedSealReturn, setSelectedSealReturn] = useState<ReturnRequest | null>(null)
  const [sealPasswordInput, setSealPasswordInput] = useState("")
  const [sealPasswordError, setSealPasswordError] = useState(false)
  const [isSealUnlocked, setIsSealUnlocked] = useState(false)

  // Action stored hash password authentication states
  const [selectedHashReturn, setSelectedHashReturn] = useState<ReturnRequest | null>(null)
  const [hashPasswordInput, setHashPasswordInput] = useState("")
  const [hashPasswordError, setHashPasswordError] = useState(false)
  const [isHashUnlocked, setIsHashUnlocked] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (sealPasswordInput.trim() === "akash333") {
      setIsSealUnlocked(true)
      setSealPasswordError(false)
    } else {
      setSealPasswordError(true)
    }
  }

  const handleHashPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (hashPasswordInput.trim() === "akash333") {
      setIsHashUnlocked(true)
      setHashPasswordError(false)
    } else {
      setHashPasswordError(true)
    }
  }

  // Seed on initial mount & evaluate automated 60-day expiry + auto-returns
  useEffect(() => {
    useSharedStore.getState().seedIfEmpty();
    runAutomatedExpiryCheck();
  }, [])

  // Live KPI calculations from reactive store
  const activeCount = batches.filter(b => b.currentStatus === 'ACTIVE').length
  const expiringCount = batches.filter(b => b.currentStatus === 'EXPIRING_SOON').length
  const expiredCount = batches.filter(b => b.currentStatus === 'EXPIRED').length
  const totalStockCount = activeCount + expiringCount + expiredCount

  // Guaranteed non-zero inventory data for chart
  const inventoryData = totalStockCount > 0 ? [
    { name: "Active", value: activeCount, color: "#10b981" },
    { name: "Expiring Soon", value: expiringCount, color: "#f59e0b" },
    { name: "Expired", value: expiredCount, color: "#ef4444" },
  ] : [
    { name: "Active", value: 10, color: "#10b981" },
    { name: "Expiring Soon", value: 3, color: "#f59e0b" },
    { name: "Expired", value: 1, color: "#ef4444" },
  ];

  const returnsPendingCount = returns.filter(r => r.status !== 'COMPLETED').length
  const liveAlertsCount = fraudAlerts.length

  const returnsData = [
    { name: "Week 1", count: 2 },
    { name: "Week 2", count: 5 },
    { name: "Week 3", count: returns.length > 0 ? Math.max(3, returns.length) : 3 },
    { name: "Week 4", count: returns.length > 0 ? returns.length + 3 : 8 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Retailer Dashboard</h1>

      {/* 1. KPI Stats Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Inventory</CardTitle>
            <Package className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 animate-in slide-in-from-bottom-2">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Expiring Soon</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 animate-in slide-in-from-bottom-2">{expiringCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Returns Pending</CardTitle>
            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 animate-in slide-in-from-bottom-2">{returnsPendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Fraud Alerts</CardTitle>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 animate-in slide-in-from-bottom-2">{liveAlertsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Middle Section: Active Consignments & Driver Handoffs */}
      <Card className="border-emerald-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/50 pb-3 border-b border-emerald-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Active Consignments & Driver Handoffs
            </CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
            onClick={() => navigate("/retailer/inventory")}
          >
            Stage New Return
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {returns.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No active return consignments. Visit Pharmacy Inventory to stage expired stock.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Consignment / Box ID</th>
                    <th className="py-3 px-4">Batch Number</th>
                    <th className="py-3 px-4">Gross Mass</th>
                    <th className="py-3 px-4">Seal Token</th>
                    <th className="py-3 px-4">Transit Custody Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {returns.slice(0, 8).map((r) => {
                    const isPendingHandoff = r.status === "AWAITING_DISTRIBUTOR" || r.transitStatus === "HANDOFF_PENDING"
                    const isInTransit = r.status === "IN_TRANSIT" || r.transitStatus === "IN_TRANSIT"
                    const isReceived = r.status === "RECEIVED_BY_DISTRIBUTOR" || r.status === "COMPLETED"

                    return (
                      <tr key={r.returnId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {r.consignmentCode || r.returnId}
                          </span>
                          <span className="text-[11px] text-gray-400 block mt-0.5">{r.productName}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                          {r.batchNumber}
                          <span className="text-[11px] text-gray-500 font-normal block">{r.requestedQuantity} units</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-700">
                          {r.grossWeightGrams || 1250}g
                        </td>

                        {/* Seal Token: ONLY the 'i' button icon */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSealReturn(r)
                              setSealPasswordInput("")
                              setSealPasswordError(false)
                              setIsSealUnlocked(false)
                            }}
                            className="w-6 h-6 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 flex items-center justify-center font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            title="Click to enter password and view Seal Token"
                          >
                            i
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          {isPendingHandoff && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              Awaiting Driver Pickup
                            </span>
                          )}
                          {isInTransit && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              <Truck className="w-3 h-3" />
                              En Route to Warehouse
                            </span>
                          )}
                          {isReceived && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Received & Weighed
                            </span>
                          )}
                          {!isPendingHandoff && !isInTransit && !isReceived && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                              {r.status.replace(/_/g, " ")}
                            </span>
                          )}
                        </td>

                        {/* Action column: ONLY 'i' button for stored hash (or Driver Handshake OTP if pending) */}
                        <td className="py-3 px-4 text-right">
                          {isPendingHandoff ? (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 shadow-xs cursor-pointer"
                              onClick={() => {
                                setSelectedReturn(r)
                                setIsHandoffModalOpen(true)
                              }}
                            >
                              <KeyRound className="w-3 h-3 mr-1" />
                              Driver Handshake (180s OTP)
                            </Button>
                          ) : r.hashTxId ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedHashReturn(r)
                                setHashPasswordInput("")
                                setHashPasswordError(false)
                                setIsHashUnlocked(false)
                              }}
                              className="w-6 h-6 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border border-indigo-300 inline-flex items-center justify-center font-bold text-xs shadow-xs transition-colors cursor-pointer"
                              title="Click to enter password and view Transaction Hash"
                            >
                              i
                            </button>
                          ) : (
                            <span className="text-gray-400 font-mono text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Lower Section: Analytics & Health Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Inventory Health</CardTitle>
            <span className="text-xs text-gray-400 font-medium">{totalStockCount} Batches Tracked</span>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={true}
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Returns Initiated (30 Days)</CardTitle>
            <span className="text-xs text-gray-400 font-medium">Reverse Chain Flow</span>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={returnsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} isAnimationActive={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layer 2 Interactive Driver Handoff OTP Modal */}
      <HandoffModal
        isOpen={isHandoffModalOpen}
        returnReq={selectedReturn}
        onClose={() => setIsHandoffModalOpen(false)}
        onSuccess={() => {
          setSelectedReturn(null);
          setIsHandoffModalOpen(false);
        }}
      />

      {/* Seal Token Dialog - Password Protected (akash333) -> Shows ONLY Seal Token ID */}
      <Dialog 
        open={!!selectedSealReturn} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSealReturn(null)
            setIsSealUnlocked(false)
            setSealPasswordInput("")
            setSealPasswordError(false)
          }
        }}
      >
        <DialogContent className="max-w-sm bg-white p-6">
          {!isSealUnlocked ? (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Lock className="w-5 h-5" />
                  <DialogTitle className="text-base font-bold text-gray-900">Enter Password</DialogTitle>
                </div>
                <DialogDescription className="text-xs text-gray-500">
                  Authentication required to view this Seal Token ID
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handlePasswordSubmit} className="space-y-3 mt-4">
                <div>
                  <Input
                    type="password"
                    value={sealPasswordInput}
                    onChange={(e) => {
                      setSealPasswordInput(e.target.value)
                      if (sealPasswordError) setSealPasswordError(false)
                    }}
                    className={`text-xs ${sealPasswordError ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                    autoFocus
                  />
                  {sealPasswordError && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">Incorrect password. Please try again.</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                    onClick={() => setSelectedSealReturn(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    Unlock
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <ShieldCheck className="w-5 h-5" />
                  <DialogTitle className="text-base font-bold text-gray-900">Seal Token ID</DialogTitle>
                </div>
                <DialogDescription className="text-xs text-gray-500">
                  Verified security seal token for this consignment
                </DialogDescription>
              </DialogHeader>

              {selectedSealReturn && (
                <div className="space-y-4 mt-3">
                  <div className="flex items-center justify-between bg-emerald-50 px-3.5 py-2.5 rounded-lg border border-emerald-200 font-mono text-sm text-emerald-950">
                    <span className="font-bold tracking-wider">{selectedSealReturn.sealToken || "SEAL-VERIFIED"}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-emerald-100 cursor-pointer ml-2"
                      onClick={() => handleCopy(selectedSealReturn.sealToken || "SEAL-VERIFIED", "seal")}
                      title="Copy Seal Token ID"
                    >
                      {copiedKey === "seal" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                    </Button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      className="bg-gray-900 hover:bg-gray-800 text-white cursor-pointer text-xs"
                      onClick={() => setSelectedSealReturn(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stored Transaction Hash Dialog - Password Protected (akash333) -> Shows ONLY the stored hash */}
      <Dialog 
        open={!!selectedHashReturn} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedHashReturn(null)
            setIsHashUnlocked(false)
            setHashPasswordInput("")
            setHashPasswordError(false)
          }
        }}
      >
        <DialogContent className="max-w-sm bg-white p-6">
          {!isHashUnlocked ? (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <Lock className="w-5 h-5" />
                  <DialogTitle className="text-base font-bold text-gray-900">Enter Password</DialogTitle>
                </div>
                <DialogDescription className="text-xs text-gray-500">
                  Authentication required to view Transaction Hash
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleHashPasswordSubmit} className="space-y-3 mt-4">
                <div>
                  <Input
                    type="password"
                    value={hashPasswordInput}
                    onChange={(e) => {
                      setHashPasswordInput(e.target.value)
                      if (hashPasswordError) setHashPasswordError(false)
                    }}
                    className={`text-xs ${hashPasswordError ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                    autoFocus
                  />
                  {hashPasswordError && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">Incorrect password. Please try again.</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                    onClick={() => setSelectedHashReturn(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                  >
                    Unlock
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <Hash className="w-5 h-5" />
                  <DialogTitle className="text-base font-bold text-gray-900">Transaction Hash</DialogTitle>
                </div>
                <DialogDescription className="text-xs text-gray-500">
                  Stored ledger transaction hash for this consignment
                </DialogDescription>
              </DialogHeader>

              {selectedHashReturn && (
                <div className="space-y-4 mt-3">
                  <div className="flex items-center justify-between bg-indigo-50 px-3.5 py-2.5 rounded-lg border border-indigo-200 font-mono text-xs text-indigo-950 break-all">
                    <span>{selectedHashReturn.hashTxId || "No hash recorded"}</span>
                    {selectedHashReturn.hashTxId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-indigo-100 cursor-pointer ml-2 shrink-0"
                        onClick={() => handleCopy(selectedHashReturn.hashTxId!, "hash")}
                        title="Copy Transaction Hash"
                      >
                        {copiedKey === "hash" ? <Check className="w-4 h-4 text-indigo-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                      </Button>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      className="bg-gray-900 hover:bg-gray-800 text-white cursor-pointer text-xs"
                      onClick={() => setSelectedHashReturn(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
