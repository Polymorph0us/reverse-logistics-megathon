import { useSharedStore } from "@/store/useSharedStore"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Truck, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Package } from "lucide-react"

export function DistributorDashboard() {
  const returns = useSharedStore(state => state.returns)
  const fraudAlerts = useSharedStore(state => state.fraudAlerts)
  const navigate = useNavigate()

  const pendingReturns = returns.filter(
    r => r.status === "AWAITING_DISTRIBUTOR" || 
         r.status === "PENDING" || 
         r.status === "RETURN_INITIATED" || 
         r.status === "IN_TRANSIT"
  )
  const processedReturns = returns.filter(r => r.status === "RECEIVED_BY_DISTRIBUTOR" || r.status === "COMPLETED")
  const discrepancyAlerts = fraudAlerts.filter(a => a.type === "QUANTITY_MISMATCH" || (a.type as string) === "SUSPICIOUS_TRANSIT")

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Truck className="w-8 h-8 text-emerald-600" />
            Distributor Operations Hub
          </h1>
          <p className="text-gray-500 mt-1">
            Reconciliation of incoming pharmacy returns, discrepancy auditing, and manufacturer handovers.
          </p>
        </div>

        <Button 
          onClick={() => navigate("/distributor/returns")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          Process Incoming Returns ({pendingReturns.length})
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Inbound Returns</CardTitle>
            <Truck className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pendingReturns.length}</div>
            <p className="text-xs text-gray-400 mt-1">Awaiting physical handover</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Discrepancy Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{discrepancyAlerts.length}</div>
            <p className="text-xs text-red-500 font-medium mt-1">Quantity/Seal mismatch</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Reconciled & Accepted</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{processedReturns.length}</div>
            <p className="text-xs text-gray-400 mt-1">Ready for manufacturer dispatch</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ledger Audit Sync</CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">100%</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Hyperledger Fabric synced</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Action Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900">
            Recent Return Shipments
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/distributor/returns")}
            className="text-xs text-emerald-700"
          >
            View All Returns <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return ID</TableHead>
                <TableHead>Batch Info</TableHead>
                <TableHead>Retailer</TableHead>
                <TableHead>Requested Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.slice(0, 5).map((req) => (
                <TableRow key={req.returnId} className="hover:bg-gray-50">
                  <TableCell className="font-mono font-medium text-xs">{req.returnId}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{req.productName}</div>
                    <div className="text-xs font-mono text-gray-500">Batch: {req.batchNumber}</div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">{req.initiatedBy}</TableCell>
                  <TableCell className="font-semibold text-sm">{req.requestedQuantity} STRIPS</TableCell>
                  <TableCell><StatusBadge status={req.status as any} /></TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate("/distributor/returns")}
                      className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      Process
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
