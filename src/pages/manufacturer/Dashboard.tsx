import { useSharedStore } from "@/store/useSharedStore"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Factory, Package, AlertTriangle, ArchiveX, CheckCircle, ArrowRight, Calendar } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts"

export function ManufacturerDashboard() {
  const navigate = useNavigate()
  const destructions = useSharedStore(state => state.destructions)
  const returns = useSharedStore(state => state.returns)
  const batches = useSharedStore(state => state.batches)

  const pendingDestructions = batches.filter(
    b => b.currentStatus === "SCHEDULED_FOR_DESTRUCTION" || 
         b.currentStatus === "CONDITION_DENATURED_CONDEMNED"
  ).length
  const completedDestructions = batches.filter(b => b.currentStatus === "DESTROYED").length || destructions.length

  const totalUnitsDestroyed = destructions.reduce((acc, d) => acc + (d.quantityDestroyed || 0), 0)
  const currentMonth = new Date().toLocaleString('default', { month: 'short' })

  const chartData = [
    { month: "Cycle 1", volume: 0 },
    { month: "Cycle 2", volume: 0 },
    { month: `${currentMonth} (Live)`, volume: totalUnitsDestroyed },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Factory className="w-8 h-8 text-emerald-700" />
            Manufacturer Operations & Intake
          </h1>
          <p className="text-gray-500 mt-1">
            Reconciliation of distributor returns, quarantine staging, and CBWTF disposal scheduling.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            onClick={() => navigate("/manufacturer/intake")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <Package className="w-3.5 h-3.5" />
            Warehouse Intake ({returns.length})
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/manufacturer/cbwtf-scheduler")}
            className="border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            Schedule CBWTF
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Inbound Returns</CardTitle>
            <Package className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{returns.length}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Awaiting Destruction</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingDestructions}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Certified Destroyed</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{completedDestructions}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Market Batches</CardTitle>
            <Factory className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{batches.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-xs border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 text-base font-bold">
              <ArchiveX className="w-4 h-4 mr-2 text-amber-600" />
              Destruction Volume Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                  <RechartsTooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} name="Units Destroyed" isAnimationActive={true}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#059669' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quarantine & Intake Batches Table */}
      <Card className="shadow-xs border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900">
            Batches Under Reverse Custody
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/manufacturer/intake")}
            className="text-xs text-emerald-700 hover:text-emerald-800 cursor-pointer"
          >
            Open Intake Station <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Number</TableHead>
                <TableHead>Product Formulation</TableHead>
                <TableHead>Current Volume</TableHead>
                <TableHead>Custody Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.slice(0, 5).map(batch => (
                <TableRow key={batch.batchId} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="font-mono text-xs font-bold text-gray-900">
                      {batch.batchNumber}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{batch.batchId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm text-gray-900">{batch.product.name}</div>
                    <div className="text-xs text-gray-500">{batch.product.genericName}</div>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-sm text-gray-900">
                    {batch.currentQuantity} {batch.unit}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={batch.currentStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/passport/${batch.batchId}`)}
                        className="text-xs border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Passport
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => navigate("/manufacturer/cbwtf-scheduler")}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        Schedule
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
