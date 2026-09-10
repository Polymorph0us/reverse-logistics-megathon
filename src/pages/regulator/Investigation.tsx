import { useParams, useNavigate } from "react-router-dom"
import { useSharedStore } from "@/store/useSharedStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useToast } from "@/hooks/use-toast"
import { 
  ShieldAlert, 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  AlertOctagon, 
  Building2, 
  Calendar,
  Lock
} from "lucide-react"

export function Investigation() {
  const { alertId } = useParams<{ alertId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const fraudAlerts = useSharedStore(state => state.fraudAlerts)
  const batches = useSharedStore(state => state.batches)

  const alert = fraudAlerts.find(a => a.alertId === alertId) || fraudAlerts[0]
  const batch = batches.find(b => b.batchId === alert?.batchId) || batches[0]

  const handleAction = (actionName: string) => {
    toast({
      title: "Regulatory Action Dispatched",
      description: `${actionName} officially registered on ledger for ${batch?.batchNumber}.`,
    })
  }

  if (!alert) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Investigation alert not found.</p>
        <Button onClick={() => navigate("/regulator/alerts")} className="mt-4">
          Return to Fraud Alerts
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/regulator/alerts")}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Alerts
        </Button>

        <span className="text-xs font-mono bg-red-100 text-red-800 px-2.5 py-1 rounded-full font-bold border border-red-200">
          CASE #{alert.alertId}
        </span>
      </div>

      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-xl p-6 shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Formal Regulatory Case Investigation</h1>
            <p className="text-red-100 mt-1 text-sm">
              Central Drugs Standard Control Organisation (CDSCO) Enforcement Audit
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Incident Summary */}
        <Card className="md:col-span-2 shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Incident Details & Evidence</CardTitle>
            <CardDescription>Automated discrepancy flagged during reverse logistics transit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Violation Type</span>
                <span className="font-bold text-gray-900">{alert.type}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Severity Assessment</span>
                <span className={`font-bold ${alert.severity === "CRITICAL" ? "text-red-600" : "text-amber-600"}`}>
                  {alert.severity}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Suspect Organization</span>
                <span className="font-medium text-gray-900">{alert.organization || "Rogue POS Terminal"}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Detection Timestamp</span>
                <span className="font-medium text-gray-900">
                  {new Date(alert.detectedAt || Date.now()).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Detailed Narrative</h3>
              <p className="text-sm text-gray-700 bg-red-50 p-4 rounded-lg border border-red-100 font-medium">
                {alert.message}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Subject Batch Information</h3>
              <div className="border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Product Name:</span>
                  <span className="font-bold text-gray-900">{batch?.product?.name || "Augmentin 625 Duo"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Batch Number:</span>
                  <span className="font-mono font-bold text-gray-900">{batch?.batchNumber || alert.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Manufacturer:</span>
                  <span className="font-medium text-gray-900">{batch?.product?.manufacturer || "Sun Pharmaceutical Industries"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ledger Status:</span>
                  <StatusBadge status={(batch?.currentStatus as any) || "DESTROYED"} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regulatory Actions Panel */}
        <Card className="shadow-sm border-gray-200 h-fit">
          <CardHeader className="bg-gray-50/70 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900">
              Enforcement Orders
            </CardTitle>
            <CardDescription className="text-xs">
              Execute legally binding administrative orders
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <Button 
              onClick={() => handleAction("Legal Notice (Form 21-A)")}
              variant="outline"
              className="w-full justify-start text-xs border-amber-300 text-amber-900 hover:bg-amber-50"
            >
              <FileText className="w-4 h-4 mr-2 text-amber-600" />
              Issue Statutory Show-Cause Notice
            </Button>

            <Button 
              onClick={() => handleAction("Supply Chain Freeze Order")}
              variant="outline"
              className="w-full justify-start text-xs border-red-300 text-red-900 hover:bg-red-50"
            >
              <Lock className="w-4 h-4 mr-2 text-red-600" />
              Freeze Associated Batch Transfers
            </Button>

            <Button 
              onClick={() => handleAction("Case Closed with Compliance Clearance")}
              className="w-full justify-start text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Compliant & Resolve Case
            </Button>

            <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
              All enforcement orders are recorded on Hyperledger Fabric with non-repudiation audit trails.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
