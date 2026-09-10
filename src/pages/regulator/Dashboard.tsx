import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getRegulatorDashboard } from "@/api/mockApi"
import type { RegulatorDashboard } from "@/api/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Package, ShieldAlert, BarChart3, TrendingUp, Building2, Eye, ArrowUpRight } from "lucide-react"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Regulator Overview</h1>
          <p className="text-gray-500 mt-1">National Tracking Network</p>
        </div>
        <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <Eye className="w-4 h-4 mr-2 animate-pulse" />
          Live Monitoring Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Tracked Batches</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalTrackedBatches.toLocaleString()}</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card 
          onClick={() => navigate("/regulator/organizations")}
          className="cursor-pointer hover:shadow-md transition-all hover:border-emerald-300 group"
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
            <p className="text-xs text-gray-500 mt-1 flex items-center justify-between">
              <span>Mfr · Dist · Ret · CBWTF</span>
              <span className="text-emerald-600 font-medium group-hover:underline">Manage & Onboard →</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-red-600">Total Fraud Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            {/* Animate key to force count up re-render if it changes */}
            <div key={liveAlerts.length} className="text-2xl font-bold text-red-700 animate-in slide-in-from-bottom-2">
              {liveAlerts.length}
            </div>
            <p className="text-xs text-red-500 mt-1">
              {liveAlerts.filter(a => a.severity === 'CRITICAL').length} CRITICAL
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Destroyed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div key={destroyedCount} className="text-2xl font-bold text-orange-600 animate-in slide-in-from-bottom-2">
              {destroyedCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total batches securely destroyed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-700">
              <BarChart3 className="w-5 h-5 mr-2" />
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-700">
              <ShieldAlert className="w-5 h-5 mr-2" />
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
    </div>
  )
}
