import { useSharedStore } from "@/store/useSharedStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Trash2, CheckCircle, FileText, Flame, ShieldAlert, FileCheck2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export function FacilityDashboard() {
  const batches = useSharedStore(state => state.batches)
  const destructions = useSharedStore(state => state.destructions)
  const navigate = useNavigate()

  const assignedDestructions = batches.filter(b => b.currentStatus === 'SCHEDULED_FOR_DESTRUCTION')

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Flame className="w-8 h-8 text-orange-600" />
            Waste Facility Operations (CBWTF)
          </h1>
          <p className="text-gray-500 mt-1">
            EcoWaste Management • High-temperature rotary kiln incineration and CPCB compliance certification.
          </p>
        </div>

        <Button 
          onClick={() => navigate("/facility/kiln")}
          className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 cursor-pointer text-xs"
        >
          <Flame className="w-4 h-4" />
          Start Kiln Incineration
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Destructions</CardTitle>
            <Trash2 className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {assignedDestructions.length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Certified Destroyed</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {destructions.length}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Rotary Kilns</CardTitle>
            <Flame className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              2 Units
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">CPCB Certificates</CardTitle>
            <FileCheck2 className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {destructions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Queue Table */}
      <Card className="shadow-xs border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-600" />
            Assigned Incineration Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Number</TableHead>
                <TableHead>Product Formulation</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Scheduled Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedDestructions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-400 text-xs">
                    No pending destructions assigned to your facility.
                  </TableCell>
                </TableRow>
              ) : assignedDestructions.map(batch => (
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
                  <TableCell className="text-sm text-gray-700">{batch.currentOwner.organizationName}</TableCell>
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
                        onClick={() => navigate(`/facility/certificate/${batch.batchId}`)} 
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Certify
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
