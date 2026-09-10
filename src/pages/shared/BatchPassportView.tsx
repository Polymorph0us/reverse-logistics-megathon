import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getBatchPassport } from "@/api/mockApi"
import type { BatchPassport } from "@/api/types"
import { VerticalTimeline } from "@/components/shared/VerticalTimeline"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RiskBadge } from "@/components/shared/RiskBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function BatchPassportView() {
  const { batchId } = useParams<{ batchId: string }>()
  const [batch, setBatch] = useState<BatchPassport | null>(null)

  useEffect(() => {
    if (batchId) getBatchPassport(batchId).then(setBatch)
  }, [batchId])

  if (!batch) return <div className="p-8 text-center">Loading batch...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batch {batch.batchNumber}</h1>
          <p className="text-gray-500">{batch.product.name} • {batch.product.manufacturer}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={batch.currentStatus} className="text-sm px-3 py-1" />
          <RiskBadge level={batch.riskLevel} className="text-sm px-3 py-1" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Current Quantity</p>
                <p className="text-xl font-bold">{batch.currentQuantity} / {batch.originalQuantity} {batch.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Owner</p>
                <p className="font-medium">{batch.currentOwner.organizationName}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <VerticalTimeline events={batch.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
