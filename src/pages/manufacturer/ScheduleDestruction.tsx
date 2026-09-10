import { useState } from "react"
import { useSharedStore } from "@/store/useSharedStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useToast } from "@/hooks/use-toast"
import { Flame, CheckCircle, ShieldAlert } from "lucide-react"

export function ScheduleDestruction() {
  const batches = useSharedStore(state => state.batches)
  const updateBatch = useSharedStore(state => state.updateBatch)
  const addTimelineEvent = useSharedStore(state => state.addTimelineEvent)
  const { toast } = useToast()

  const [selectedBatchId, setSelectedBatchId] = useState<string>("")
  const [selectedFacility, setSelectedFacility] = useState<string>("ORG-004")
  const [submitting, setSubmitting] = useState(false)

  // Filter batches eligible for destruction
  const eligibleBatches = batches.filter(
    b => b.currentStatus === "WITH_MANUFACTURER" || 
         b.currentStatus === "EXPIRED" || 
         b.currentStatus === "RETURN_INITIATED" ||
         b.currentStatus === "SCHEDULED_FOR_DESTRUCTION"
  )

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatchId) return

    setSubmitting(true)
    const batch = batches.find(b => b.batchId === selectedBatchId)

    updateBatch(selectedBatchId, { 
      currentStatus: "SCHEDULED_FOR_DESTRUCTION",
      currentOwner: {
        organizationId: selectedFacility,
        organizationName: "EcoWaste Management",
        role: "WASTE_FACILITY"
      }
    })

    addTimelineEvent(selectedBatchId, {
      eventId: "E-" + Date.now(),
      eventType: "SCHEDULED_FOR_DESTRUCTION",
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      actor: "Sun Pharmaceutical Industries",
      quantity: batch?.currentQuantity
    })

    toast({
      title: "Destruction Scheduled",
      description: `Batch ${batch?.batchNumber} transferred to EcoWaste Management for certified disposal.`,
    })

    setSelectedBatchId("")
    setSubmitting(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Flame className="w-8 h-8 text-amber-600" />
          Schedule Certified Medicine Destruction
        </h1>
        <p className="text-gray-500 mt-1">
          Initiate regulatory-compliant incineration protocol with licensed environmental waste facilities.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Scheduling Form */}
        <Card className="md:col-span-1 border-amber-200 shadow-sm">
          <CardHeader className="bg-amber-50/50 border-b border-amber-100">
            <CardTitle className="text-base font-bold text-gray-900">
              Dispatch to Waste Facility
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Select an expired batch to transfer for eco-certified disposal
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSchedule} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Select Batch</label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleBatches.map(b => (
                      <SelectItem key={b.batchId} value={b.batchId}>
                        {b.product.name} ({b.batchNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Authorized Waste Facility</label>
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORG-004">EcoWaste Management (Jaipur EPA Facility)</SelectItem>
                    <SelectItem value="ORG-007">GreenShield Incinerators Ltd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Regulatory Protocol
                </div>
                <p>Transfer will lock the batch from commercial sale and notify CDSCO auditors.</p>
              </div>

              <Button 
                type="submit" 
                disabled={!selectedBatchId || submitting}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                <Flame className="w-4 h-4 mr-2" />
                Schedule Incineration
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Batches Table */}
        <Card className="md:col-span-2 shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">
              Eligible Batches for Destruction
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Batches nearing or past expiration returned through the reverse supply chain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleBatches.map(b => (
                  <TableRow key={b.batchId}>
                    <TableCell>
                      <div className="font-medium text-sm">{b.product.name}</div>
                      <div className="text-xs text-gray-400">{b.product.genericName}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{b.batchNumber}</TableCell>
                    <TableCell className="font-semibold text-sm">{b.currentQuantity} {b.unit}</TableCell>
                    <TableCell><StatusBadge status={b.currentStatus} /></TableCell>
                    <TableCell className="text-right">
                      {b.currentStatus !== "SCHEDULED_FOR_DESTRUCTION" ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedBatchId(b.batchId)}
                          className="text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                        >
                          Select
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Scheduled
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
