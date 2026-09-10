import { useEffect, useState } from "react"
import { getDashboardKPIs } from "@/api/mockApi"
import type { DashboardKPIs } from "@/api/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, ArrowRightLeft, ShieldAlert } from "lucide-react"

export function RetailerDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)

  useEffect(() => {
    getDashboardKPIs().then(setKpis)
  }, [])

  if (!kpis) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>

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
            <div className="text-2xl font-bold text-gray-900">{kpis.activeBatches}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Expiring Soon</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{kpis.expiringSoon}</div>
            <p className="text-xs text-gray-400 mt-1">Within 60 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Returns Pending</CardTitle>
            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpis.returnsPending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Fraud Alerts</CardTitle>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpis.fraudAlerts}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
