import { useState } from "react"
import { verifyBatchForSale } from "@/api/mockApi"
import type { BatchVerifyResponse } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldAlert, CheckCircle, Search, AlertOctagon } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function VerifyBatch() {
  const [batchId, setBatchId] = useState("")
  const [result, setResult] = useState<BatchVerifyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchId) return
    
    setLoading(true)
    setResult(null)
    const res = await verifyBatchForSale(batchId)
    setResult(res)
    setLoading(false)
  }

  // WOW MOMENT: Full-screen block for DESTROYED batch
  if (result && !result.allowSale && result.status === "DESTROYED") {
    return (
      <div className="fixed inset-0 z-50 bg-red-950 flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="animate-in zoom-in-50 duration-500 ease-out flex flex-col items-center max-w-2xl text-center px-6">
          <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center mb-8 animate-pulse">
            <AlertOctagon className="w-20 h-20 text-white" />
          </div>
          
          <h1 className="text-6xl font-black text-white tracking-tight mb-4 uppercase">
            Sale Blocked
          </h1>
          
          <div className="bg-red-900/50 border border-red-500 rounded-xl p-8 mb-8 w-full backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-red-200 mb-2">BATCH PREVIOUSLY DESTROYED</h2>
            <p className="text-red-300 font-mono text-xl mb-6">ID: {batchId.toUpperCase()}</p>
            
            <div className="flex justify-center gap-6 text-sm font-medium">
              <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg border border-red-500/30">
                Risk: CRITICAL
              </div>
              <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg border border-red-500/30 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-red-400" />
                Manufacturer Notified
              </div>
              <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg border border-red-500/30 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-red-400" />
                Regulator Notified
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-red-500 text-red-500 hover:bg-red-900 hover:text-red-100 bg-transparent"
            onClick={() => {
              setResult(null);
              setBatchId("");
            }}
          >
            Acknowledge & Clear Terminal
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 px-4">
      <div className="mb-8 cursor-pointer" onClick={() => navigate(-1)}>
        <h1 className="text-2xl font-bold text-emerald-800 flex items-center">
          <ShieldAlert className="w-6 h-6 mr-2" />
          DrugLines POS Terminal
        </h1>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900">Scan Batch to Verify</h2>
          <p className="text-sm text-gray-500 mt-1">Check registry before completing sale</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Scan or enter batch number..."
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="h-14 text-center text-xl font-mono uppercase"
              autoFocus
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg"
            disabled={!batchId || loading}
          >
            {loading ? "Verifying..." : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Verify
              </>
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-8 pt-8 border-t border-gray-100 animate-in slide-in-from-bottom-4">
            {result.allowSale ? (
              <div className="bg-emerald-50 text-emerald-800 p-6 rounded-lg border border-emerald-200 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <h3 className="font-bold text-lg">Verified Authentic</h3>
                <p className="text-emerald-600 text-sm mt-1">{result.message}</p>
              </div>
            ) : (
              <div className="bg-orange-50 text-orange-800 p-6 rounded-lg border border-orange-200 text-center">
                <ShieldAlert className="w-12 h-12 mx-auto text-orange-500 mb-3" />
                <h3 className="font-bold text-lg">Warning: Do Not Sell</h3>
                <p className="text-orange-600 text-sm mt-1">{result.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-12 text-center text-sm text-gray-400">
        <p>Enter "DEF98765" to test the wow-moment destroyed batch flow.</p>
      </div>
    </div>
  )
}
