import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSharedStore } from "@/store/useSharedStore"
import { getOrganizations } from "@/api/mockApi"
import type { OrganizationNode } from "@/api/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useToast } from "@/hooks/use-toast"
import { Flame, CheckCircle, ArrowLeft } from "lucide-react"

export function ScheduleDestruction() {
  const navigate = useNavigate()
  const batches = useSharedStore(state => state.batches)
  const updateBatch = useSharedStore(state => state.updateBatch)
  const addTimelineEvent = useSharedStore(state => state.addTimelineEvent)
  const { toast } = useToast()

  const [wasteFacilities, setWasteFacilities] = useState<OrganizationNode[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>("")
  const [selectedFacility, setSelectedFacility] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getOrganizations().then(orgs => {
      const facilities = orgs.filter(o => o.type === "WASTE_FACILITY" && o.active !== false)
      setWasteFacilities(facilities)
      if (facilities.length > 0) {
        setSelectedFacility(facilities[0].id)
      }
    })
  }, [])

  // Filter batches eligible for destruction
  const eligibleBatches = batches.filter(
    b => b.currentStatus === "WITH_MANUFACTURER" || 
         b.currentStatus === "EXPIRED" || 
         b.currentStatus === "RETURN_INITIATED" ||
         b.currentStatus === "SCHEDULED_FOR_DESTRUCTION"
  )

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatchId || !selectedFacility) return

    setSubmitting(true)
    const batch = batches.find(b => b.batchId === selectedBatchId)
    const targetFacility = wasteFacilities.find(f => f.id === selectedFacility)

    updateBatch(selectedBatchId, { 
      currentStatus: "SCHEDULED_FOR_DESTRUCTION",
      currentOwner: {
        organizationId: selectedFacility,
        organizationName: targetFacility?.name || "EcoWaste Management CBWTF",
        role: "WASTE_FACILITY"
      }
    })

    addTimelineEvent(selectedBatchId, {
      eventId: "E-" + Date.now(),
      eventType: "SCHEDULED_FOR_DESTRUCTION",
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      actor: "Sun Pharmaceutical Industries",
      location: targetFacility?.city || "Authorized CBWTF",
      quantity: batch?.currentQuantity
    })

    toast({
      title: "Destruction Scheduled",
      description: `Batch ${batch?.batchNumber} transferred to ${targetFacility?.name || "CBWTF Facility"}.`,
    })

    setSelectedBatchId("")
    setSubmitting(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Flame className="w-8 h-8 text-amber-600" />
            Schedule Certified Medicine Destruction
          </h1>
          <p className="text-gray-500 mt-1">
            Assign expired and denatured pharmaceutical consignments to licensed environmental waste facilities.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/manufacturer/dashboard")}
          className="border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Dashboard
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Scheduling Form */}
        <Card className="md:col-span-1 border-gray-200 shadow-xs">
          <CardHeader className="bg-amber-50/40 border-b border-amber-100 pb-3">
            <CardTitle className="text-base font-bold text-gray-900">
              Dispatch to Waste Facility
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
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
                    <SelectValue placeholder="Select authorized facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {wasteFacilities.length === 0 ? (
                      <SelectItem value="none" disabled>No registered waste facilities</SelectItem>
                    ) : (
                      wasteFacilities.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} ({f.city})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                disabled={!selectedBatchId || !selectedFacility || submitting}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer text-xs"
              >
                <Flame className="w-4 h-4 mr-2" />
                Schedule Incineration
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Batches Table */}
        <Card className="md:col-span-2 shadow-xs border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-900">
              Eligible Batches for Destruction
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch Identifier</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-400 text-xs">
                      No batches currently eligible for destruction.
                    </TableCell>
                  </TableRow>
                ) : (
                  eligibleBatches.map(b => (
                    <TableRow key={b.batchId} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="font-semibold text-sm text-gray-900">{b.product.name}</div>
                        <div className="text-xs text-gray-500">{b.product.genericName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs font-bold text-gray-900">{b.batchNumber}</div>
                        <div className="font-mono text-[10px] text-gray-400 mt-0.5">{b.batchId}</div>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-sm text-gray-900">
                        {b.currentQuantity} {b.unit}
                      </TableCell>
                      <TableCell><StatusBadge status={b.currentStatus} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/batch/${b.batchId}`)}
                            className="text-xs border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            Passport
                          </Button>
                          {b.currentStatus !== "SCHEDULED_FOR_DESTRUCTION" ? (
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedBatchId(b.batchId)}
                              className="text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                            >
                              Select
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Scheduled
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
