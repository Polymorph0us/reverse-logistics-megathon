import { useSharedStore } from "@/store/useSharedStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldAlert, Trash2, CheckCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export function FacilityDashboard() {
  const batches = useSharedStore(state => state.batches)
  const destructions = useSharedStore(state => state.destructions)
  const navigate = useNavigate()

  const assignedDestructions = batches.filter(b => b.currentStatus === 'SCHEDULED_FOR_DESTRUCTION')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Waste Facility Dashboard</h1>
          <p className="text-gray-500 mt-1">EcoWaste Management Operations</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-orange-100 bg-orange-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Pending Destructions</CardTitle>
            <Trash2 className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 animate-in slide-in-from-bottom-2">
              {assignedDestructions.length}
            </div>
            <p className="text-xs text-orange-600/70 mt-1">Awaiting physical verification & disposal</p>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Certified Destroyed</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 animate-in slide-in-from-bottom-2">
              {destructions.length}
            </div>
            <p className="text-xs text-emerald-600/70 mt-1">Hashes anchored to blockchain</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-700">
            <ShieldAlert className="w-5 h-5 mr-2" />
            Assigned Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Number</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>From Manufacturer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedDestructions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No pending destructions assigned to your facility.
                  </TableCell>
                </TableRow>
              ) : assignedDestructions.map(batch => (
                <TableRow key={batch.batchId}>
                  <TableCell className="font-mono font-medium">{batch.batchNumber}</TableCell>
                  <TableCell>{batch.product.name}</TableCell>
                  <TableCell>{batch.currentOwner.organizationName}</TableCell>
                  <TableCell>{batch.currentQuantity} {batch.unit}</TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => navigate(`/facility/certificate/${batch.batchId}`)} className="bg-orange-600 hover:bg-orange-700 text-white">
                      <FileText className="w-4 h-4 mr-2" />
                      Certify Destruction
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
