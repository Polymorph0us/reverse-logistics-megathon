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
        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Inbound Returns</CardTitle>
            <Truck className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pendingReturns.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Discrepancy Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{discrepancyAlerts.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Reconciled & Accepted</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{processedReturns.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Verified Consignments</CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{processedReturns.length + pendingReturns.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Action Table */}
      <Card className="shadow-xs border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900">
            Recent Return Shipments
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/distributor/returns")}
            className="text-xs text-emerald-700 hover:text-emerald-800 cursor-pointer"
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
                <TableRow key={req.returnId} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono font-medium text-xs text-gray-900">{req.returnId}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm text-gray-900">{req.productName}</div>
                    <div className="text-xs font-mono text-gray-500 mt-0.5">Batch: {req.batchNumber}</div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">{req.initiatedBy}</TableCell>
                  <TableCell className="font-semibold text-sm font-mono text-gray-900">{req.requestedQuantity} STRIPS</TableCell>
                  <TableCell><StatusBadge status={req.status as any} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/passport/${req.batchId || req.batchNumber}`)}
                        className="text-xs border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Passport
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => navigate("/distributor/returns")}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        Process
                      </Button>
                    </div>
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
