import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getBatchPassport, createReturn } from "@/api/mockApi"
import type { BatchPassport } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { PackageOpen, Camera } from "lucide-react"

export function CreateReturn() {
  const { batchId } = useParams<{ batchId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [batch, setBatch] = useState<BatchPassport | null>(null)
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (batchId) getBatchPassport(batchId).then(setBatch)
  }, [batchId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchId || !quantity) return
    
    setSubmitting(true)
    const result = await createReturn(batchId, parseInt(quantity), reason)
    
    toast({
      title: "Return Initiated Successfully",
      description: `Return ${result.returnId} created for ${result.requestedQuantity} units.`,
    })
    
    navigate("/retailer/dashboard")
  }

  if (!batch) return <div className="p-8 text-center text-gray-500">Loading batch details...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Initiate Return</h1>
      
      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-100">
          <CardTitle className="text-lg flex items-center">
            <PackageOpen className="w-5 h-5 mr-2 text-emerald-600" />
            Batch Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block mb-1">Product</span>
              <span className="font-medium text-gray-900">{batch.product.name}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Batch Number</span>
              <span className="font-mono text-gray-900">{batch.batchNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Current Quantity</span>
              <span className="font-medium text-gray-900">{batch.currentQuantity} {batch.unit}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Return Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Quantity to Return</label>
              <Input 
                type="number" 
                required 
                max={batch.currentQuantity}
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter exact quantity"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Reason for Return</label>
              <Textarea 
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Expired, Damaged packaging"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">Condition Photo (Optional)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer">
                <Camera className="w-8 h-8 mb-2 text-gray-400" />
                <span className="text-sm font-medium">Click to upload photo</span>
                <span className="text-xs mt-1">Simulated file picker</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Initiate Return"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
