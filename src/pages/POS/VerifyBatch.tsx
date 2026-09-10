import { useState } from "react"
import { verifyBatchForSale } from "@/api/mockApi"
import type { BatchVerifyResponse } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldAlert, CheckCircle, Search, AlertOctagon } from "lucide-react"

export function VerifyBatch() {
  const [batchId, setBatchId] = useState("")
  const [result, setResult] = useState<BatchVerifyResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchId.trim()) return
    setLoading(true)
    const res = await verifyBatchForSale(batchId.trim())
    setResult(res)
    setLoading(false)
  }

  if (result && !result.allowSale) {
    return (
      <div className="min-h-screen bg-red-600 flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in zoom-in duration-300">
        <AlertOctagon className="w-32 h-32 mb-6 text-white animate-pulse" />
        <h1 className="text-6xl font-black mb-4 tracking-tight border-4 border-white p-6">SALE BLOCKED</h1>
        <h2 className="text-3xl font-bold mb-8">BATCH PREVIOUSLY DESTROYED</h2>
        
        <div className="bg-red-800/50 p-8 rounded-xl max-w-2xl w-full backdrop-blur-sm border border-red-500">
          <div className="text-xl space-y-4 text-left font-mono">
            <div className="flex justify-between border-b border-red-500/50 pb-2">
              <span className="opacity-80">Risk Level:</span>
              <span className="font-bold text-red-200">CRITICAL</span>
            </div>
            <div className="flex justify-between border-b border-red-500/50 pb-2">
              <span className="opacity-80">Batch Number:</span>
              <span className="font-bold">{batchId.toUpperCase()}</span>
            </div>
            <div className="flex justify-between border-b border-red-500/50 pb-2">
              <span className="opacity-80">Manufacturer Notified:</span>
              <span className="font-bold text-green-400">✓ YES</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="opacity-80">Regulator Notified:</span>
              <span className="font-bold text-green-400">✓ YES</span>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="mt-12 text-red-600 border-white hover:bg-red-50 hover:text-red-700 h-14 px-8 text-lg font-bold bg-white"
          onClick={() => { setResult(null); setBatchId(""); }}
        >
          Acknowledge & Scan Next
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-slate-900 p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">POS Scanner Check</h1>
          <p className="text-slate-400 text-sm">Verify batch status before sale</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scan or Enter Batch Number</label>
              <div className="relative">
                <Input
                  autoFocus
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  placeholder="e.g. ABC12345 or DEF98765"
                  className="pl-10 h-14 text-lg font-mono uppercase bg-gray-50"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-4.5" />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={loading || !batchId.trim()}>
              {loading ? "Verifying..." : "Verify Batch"}
            </Button>
          </form>

          {result && result.allowSale && (
            <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col items-center text-center animate-in slide-in-from-bottom-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
              <h3 className="text-xl font-bold text-emerald-800">Batch Verified</h3>
              <p className="text-emerald-600 font-medium mt-1">Ready for sale</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
