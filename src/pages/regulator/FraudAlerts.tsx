import { useNavigate } from "react-router-dom"
import { useSharedStore } from "@/store/useSharedStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldAlert, MapPin, Building2, Search, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

export function FraudAlerts() {
  const alerts = useSharedStore(state => state.fraudAlerts)
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fraud Alerts</h1>
          <p className="text-gray-500 mt-1">Live monitoring across the national network</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search alerts..." className="pl-9 w-64" />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-red-50/50 border-b border-red-100">
          <CardTitle className="text-red-800 flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2" />
            Active Incidents
            <span className="ml-3 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              {alerts.length} LIVE
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No active alerts. Network is secure.
                  </TableCell>
                </TableRow>
              ) : alerts.map(alert => (
                <TableRow key={alert.alertId} className="animate-in slide-in-from-top-2 duration-300">
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                      alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-200' :
                      alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {alert.severity}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{alert.type.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm font-mono text-gray-600">{alert.batchNumber}</p>
                      <p className="text-xs text-gray-500 truncate mt-1" title={alert.message}>{alert.message}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900 flex items-center">
                      <Building2 className="w-3 h-3 mr-1 text-gray-400" />
                      {alert.organization}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                      {alert.location}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(alert.detectedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                      onClick={() => navigate(`/regulator/investigation/${alert.alertId}`)}
                    >
                      Investigate <ArrowRight className="w-4 h-4 ml-2" />
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
