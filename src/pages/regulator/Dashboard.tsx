import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getRegulatorDashboard } from "@/api/mockApi"
import type { RegulatorDashboard } from "@/api/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { AlertTriangle, Package, ShieldAlert, BarChart3, Building2, Eye, ArrowUpRight, ShieldCheck, ArrowRight } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from "recharts"
import { useSharedStore } from "@/store/useSharedStore"

export function RegulatorDashboardView() {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState<RegulatorDashboard | null>(null)
  
  const liveAlerts = useSharedStore(state => state.fraudAlerts)
  const destructions = useSharedStore(state => state.destructions)
  const batches = useSharedStore(state => state.batches)
  const organizations = useSharedStore(state => state.organizations)

  useEffect(() => {
    getRegulatorDashboard().then(setKpis)
  }, [])

  if (!kpis) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading dashboard...</div>

  const destroyedBatchesCount = batches.filter(b => b.currentStatus === 'DESTROYED').length
  const destroyedCount = destroyedBatchesCount > 0 ? destroyedBatchesCount : (destructions.length > 0 ? 1 : 0)

  const chartData = [
    { name: "Day 1", fraud: 0, destructions: 0 },
    { name: "Day 2", fraud: 0, destructions: 0 },
    { name: "Day 3", fraud: 0, destructions: 0 },
    { name: "Day 4", fraud: 0, destructions: 0 },
    { name: "Day 5", fraud: 0, destructions: 0 },
    { name: "Day 6", fraud: 0, destructions: 0 },
    { name: "Today", fraud: liveAlerts.length, destructions: destroyedCount },
  ]

  const complianceData = [
    { org: "Sun Pharma (Mfr)", score: 100 },
    { org: "ABC Distributors Ltd", score: 100 },
    { org: "EcoWaste Management", score: 100 },
    { org: liveAlerts[0]?.organization || "Rogue POS Terminal", score: liveAlerts.length > 0 ? 0 : 100 },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-700" />
            CDSCO Regulatory Sentinel
          </h1>
          <p className="text-gray-500 mt-1">
            National pharmaceutical reverse tracking, cryptographic custody verification, and fraud anomaly detection.
          </p>
        </div>
        <div className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 self-start md:self-auto">
          <Eye className="w-3.5 h-3.5 mr-1.5 animate-pulse text-emerald-600" />
          Live Monitoring Active
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Tracked Batches</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpis.totalTrackedBatches.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card 
          onClick={() => navigate("/regulator/organizations")}
          className="cursor-pointer hover:shadow-md transition-all hover:border-emerald-300 group shadow-xs border-gray-200"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-emerald-700 transition-colors">
              Organizations (4 Sectors)
            </CardTitle>
            <div className="flex items-center text-emerald-600">
              <Building2 className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              <ArrowUpRight className="h-3.5 w-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
              {organizations.length > 0 ? organizations.length : 14}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-red-600">Total Fraud Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {liveAlerts.length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-xs border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Certified Destroyed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {destroyedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xs border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 text-base font-bold">
              <BarChart3 className="w-4 h-4 mr-2 text-emerald-600" />
              Incidents & Destructions (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDestruction" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" dataKey="fraud" stroke="#ef4444" fillOpacity={1} fill="url(#colorFraud)" name="Fraud Alerts" isAnimationActive={true} />
                  <Area type="monotone" dataKey="destructions" stroke="#f97316" fillOpacity={1} fill="url(#colorDestruction)" name="Destructions" isAnimationActive={true} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 text-base font-bold">
              <ShieldAlert className="w-4 h-4 mr-2 text-blue-600" />
              Organization Compliance Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} />
                  <YAxis dataKey="org" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} width={100} />
                  <RechartsTooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="score" fill="#10b981" radius={[0, 4, 4, 0]} name="Compliance Score" isAnimationActive={true}>
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score < 90 ? '#ef4444' : entry.score < 95 ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Batches & National Investigation Stream Table */}
      <Card className="shadow-xs border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            National Monitored Batches &amp; Sentinel Alerts
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/regulator/alerts")}
            className="text-xs text-emerald-700 hover:text-emerald-800 cursor-pointer"
          >
            All Alerts ({liveAlerts.length}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Identifier</TableHead>
                <TableHead>Product Formulation</TableHead>
                <TableHead>Holder Organization</TableHead>
                <TableHead>Current Status</TableHead>
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
                  <TableCell className="text-sm text-gray-700">{batch.currentOwner.organizationName}</TableCell>
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
                        Inspect Passport
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => navigate("/regulator/alerts")}
                        className="text-xs bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                      >
                        Alerts
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
