import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useSharedStore } from "@/store/useSharedStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldAlert, MapPin, Building2, Search, ArrowRight, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

export function FraudAlerts() {
  const alerts = useSharedStore(state => state.fraudAlerts) || []
  const seedIfEmpty = useSharedStore(state => state.seedIfEmpty)
  const navigate = useNavigate()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("ALL")

  useEffect(() => {
    seedIfEmpty()
  }, [seedIfEmpty])

  const formatSafeDistance = (dateStr?: string) => {
    if (!dateStr) return "Just now"
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return "Recently"
      return formatDistanceToNow(d, { addSuffix: true })
    } catch {
      return "Recently"
    }
  }

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Severity filter
      if (severityFilter !== "ALL" && alert.severity !== severityFilter) {
        return false
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matches = 
          (alert.alertId || "").toLowerCase().includes(q) ||
          (alert.batchNumber || "").toLowerCase().includes(q) ||
          (alert.organization || "").toLowerCase().includes(q) ||
          (alert.location || "").toLowerCase().includes(q) ||
          (alert.type || "").toLowerCase().includes(q) ||
          (alert.message || "").toLowerCase().includes(q) ||
          (alert.severity || "").toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })
  }, [alerts, severityFilter, searchTerm])

  const criticalCount = useMemo(() => alerts.filter(a => a.severity === 'CRITICAL').length, [alerts])
  const highCount = useMemo(() => alerts.filter(a => a.severity === 'HIGH').length, [alerts])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fraud & Risk Alerts</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Live surveillance across national supply chains: detecting diversion, expired dispensing, and forged custody records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search batch, entity, location..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 md:w-80 bg-white" 
            />
          </div>
        </div>
      </div>

      {/* KPI Alert Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setSeverityFilter("ALL")}
          className={`p-3 rounded-xl border text-left transition-all ${
            severityFilter === "ALL" 
              ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="text-xs font-semibold uppercase opacity-80">All Incidents</div>
          <div className="text-2xl font-bold mt-1">{alerts.length}</div>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter("CRITICAL")}
          className={`p-3 rounded-xl border text-left transition-all ${
            severityFilter === "CRITICAL" 
              ? "bg-red-600 text-white border-red-600 shadow-sm" 
              : "bg-red-50/70 text-red-900 border-red-200 hover:bg-red-100"
          }`}
        >
          <div className="text-xs font-semibold uppercase opacity-80 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Critical
          </div>
          <div className="text-2xl font-bold mt-1">{criticalCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter("HIGH")}
          className={`p-3 rounded-xl border text-left transition-all ${
            severityFilter === "HIGH" 
              ? "bg-amber-600 text-white border-amber-600 shadow-sm" 
              : "bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100"
          }`}
        >
          <div className="text-xs font-semibold uppercase opacity-80">High Severity</div>
          <div className="text-2xl font-bold mt-1">{highCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter("MEDIUM")}
          className={`p-3 rounded-xl border text-left transition-all ${
            severityFilter === "MEDIUM" 
              ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
              : "bg-blue-50/70 text-blue-900 border-blue-200 hover:bg-blue-100"
          }`}
        >
          <div className="text-xs font-semibold uppercase opacity-80">Medium / Review</div>
          <div className="text-2xl font-bold mt-1">
            {alerts.filter(a => a.severity === 'MEDIUM' || a.severity === 'LOW').length}
          </div>
        </button>
      </div>

      <Card className="border-red-100 shadow-xs">
        <CardHeader className="bg-red-50/50 border-b border-red-100 py-3.5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-red-900 flex items-center text-base font-bold">
              <ShieldAlert className="w-5 h-5 mr-2 text-red-600" />
              Active Surveillance Incidents
              <span className="ml-3 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                {filteredAlerts.length} Active
              </span>
            </CardTitle>
            {severityFilter !== "ALL" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSeverityFilter("ALL")}
                className="h-7 text-xs text-red-700 hover:bg-red-100"
              >
                Clear filter ({severityFilter})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/70">
              <TableRow>
                <TableHead className="w-24 text-xs font-semibold">Severity</TableHead>
                <TableHead className="text-xs font-semibold">Anomaly Type</TableHead>
                <TableHead className="text-xs font-semibold">Batch &amp; Narrative</TableHead>
                <TableHead className="text-xs font-semibold">Flagged Entity &amp; Location</TableHead>
                <TableHead className="text-xs font-semibold">Detected</TableHead>
                <TableHead className="text-right text-xs font-semibold">Regulatory Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <ShieldAlert className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-700">No active incidents found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchTerm ? "Try broadening your search query" : "All supply chain nodes are operating within compliance thresholds"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : filteredAlerts.map(alert => (
                <TableRow key={alert.alertId} className="hover:bg-red-50/30 transition-colors">
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider ${
                      alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-200' :
                      alert.severity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {alert.severity}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900 text-xs">
                    {(alert.type || "ANOMALY").replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="text-xs font-mono font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded inline-block border border-gray-200">
                        {alert.batchNumber}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed" title={alert.message}>
                        {alert.message}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-gray-900 font-semibold flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-gray-400 shrink-0" />
                      <span className="truncate">{alert.organization || "Unregistered Terminal"}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center mt-0.5">
                      <MapPin className="w-3 h-3 mr-1 text-gray-400 shrink-0" />
                      <span>{alert.location || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    {formatSafeDistance(alert.detectedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 h-8 text-xs font-semibold cursor-pointer"
                      onClick={() => navigate(`/regulator/investigation/${alert.alertId}`)}
                    >
                      Investigate <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
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
