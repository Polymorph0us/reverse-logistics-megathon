import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getDashboardKPIs } from "@/api/mockApi"
import type { DashboardKPIs, ReturnRequest } from "@/api/types"
import { useSharedStore } from "@/store/useSharedStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HandoffModal } from "@/components/shared/HandoffModal"
import { Package, AlertTriangle, ArrowRightLeft, ShieldAlert, Truck, CheckCircle2, KeyRound } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

export function RetailerDashboard() {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const returns = useSharedStore((state) => state.returns)
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null)
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false)

  useEffect(() => {
    getDashboardKPIs().then(setKpis)
  }, [])

  if (!kpis) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading dashboard...</div>

  const inventoryData = [
    { name: "Active", value: kpis.activeBatches, color: "#10b981" },
    { name: "Expiring Soon", value: kpis.expiringSoon, color: "#f59e0b" },
    { name: "Expired", value: kpis.expired, color: "#ef4444" },
  ]

  const returnsData = [
    { name: "Week 1", count: 2 },
    { name: "Week 2", count: 5 },
    { name: "Week 3", count: 3 },
    { name: "Week 4", count: 8 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Retailer Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Inventory</CardTitle>
            <Package className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 animate-in slide-in-from-bottom-2">{kpis.activeBatches}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Expiring Soon</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 animate-in slide-in-from-bottom-2">{kpis.expiringSoon}</div>
            <p className="text-xs text-gray-400 mt-1">Within 60 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Returns Pending</CardTitle>
            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 animate-in slide-in-from-bottom-2">{kpis.returnsPending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Fraud Alerts</CardTitle>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 animate-in slide-in-from-bottom-2">{kpis.fraudAlerts}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
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
          <CardHeader>
            <CardTitle>Returns Initiated (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={returnsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} isAnimationActive={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layer 1 & 2: Active Return Consignments & Driver Handoff */}
      <Card className="border-emerald-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/50 pb-3 border-b border-emerald-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Active Consignments & Driver Handoffs (Layer 1 & 2 Reverse Chain)
            </CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Dual-party 180-second dynamic OTP handshake and GPS geofence custody transfer
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
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
                  {returns.slice(0, 5).map((r) => {
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
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            {r.sealToken || "SEAL-VERIFIED"}
                          </span>
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
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isPendingHandoff ? (
                            <Button 
                              size="sm" 
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 shadow-xs"
                              onClick={() => {
                                setSelectedReturn(r)
                                setIsHandoffModalOpen(true)
                              }}
                            >
                              <KeyRound className="w-3 h-3 mr-1" />
                              Driver Handshake (180s OTP)
                            </Button>
                          ) : (
                            <span className="text-[11px] font-mono text-gray-500">
                              {r.hashTxId ? `${r.hashTxId.substring(0, 12)}...` : "HASH-VERIFIED"}
                            </span>
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

      {/* Interactive Layer 2 Handoff Modal */}
      <HandoffModal 
        isOpen={isHandoffModalOpen}
        returnReq={selectedReturn}
        onClose={() => setIsHandoffModalOpen(false)}
        onSuccess={() => {
          getDashboardKPIs().then(setKpis)
        }}
      />
    </div>
  )
}
