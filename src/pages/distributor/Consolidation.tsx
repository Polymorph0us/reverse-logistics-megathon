import { useState, useEffect } from "react"
import { useSharedStore } from "@/store/useSharedStore"
import { generateMCM, getMasterConsignments } from "@/api/mockApi"
import type { ReturnRequest, MasterConsignment } from "@/api/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  PackageCheck,
  GitBranch,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Box,
  RefreshCw,
} from "lucide-react"

// ── helpers ─────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    RECEIVED_BY_DISTRIBUTOR: "bg-emerald-100 text-emerald-800 border-emerald-300",
    DISPUTE_WEIGHT_MISMATCH:  "bg-red-100 text-red-800 border-red-300",
    CONSOLIDATED:             "bg-purple-100 text-purple-800 border-purple-300",
    IN_TRANSIT:               "bg-sky-100 text-sky-800 border-sky-300",
    HANDOFF_PENDING:          "bg-amber-100 text-amber-800 border-amber-300",
  }
  return (
    <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${map[status] ?? "bg-gray-100 text-gray-600 border-gray-300"}`}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

function MCMStatusBadge({ status }: { status: MasterConsignment["status"] }) {
  const map: Record<MasterConsignment["status"], { cls: string; label: string }> = {
    SEALED:              { cls: "bg-amber-100 text-amber-800 border-amber-300", label: "🔒 Sealed" },
    IN_TRANSIT_TO_OEM:   { cls: "bg-sky-100 text-sky-800 border-sky-300",      label: "🚚 In Transit to OEM" },
    RECEIVED_BY_OEM:     { cls: "bg-indigo-100 text-indigo-800",               label: "📦 At OEM" },
    BLIND_SCAN_PASS:     { cls: "bg-emerald-100 text-emerald-800",             label: "✅ Blind Scan Pass" },
    BLIND_SCAN_DISPUTE:  { cls: "bg-red-100 text-red-800",                     label: "🚨 Blind Scan Dispute" },
  }
  const entry = map[status] ?? { cls: "bg-gray-100 text-gray-700", label: status }
  return <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${entry.cls}`}>{entry.label}</span>
}

// ── Merkle Tree Visualiser ───────────────────────────────────────────────────

function MerkleVisualiser({ tree, leaves }: { tree: string[][]; leaves: string[] }) {
  if (!tree || tree.length === 0) return null
  const levels = [...tree].reverse() // root first for display

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
        Merkle Proof Tree (root → leaves)
      </div>
      <div className="space-y-3">
        {levels.map((level, li) => (
          <div key={li} className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] text-gray-400 w-10 shrink-0">
              {li === 0 ? "Root" : li === levels.length - 1 ? "Leaves" : `L${li}`}
            </span>
            {level.map((hash, hi) => (
              <div key={hi} className="flex items-center gap-1">
                <div
                  className={`font-mono text-[9px] px-2 py-1 rounded border ${
                    li === 0
                      ? "bg-purple-50 border-purple-300 text-purple-800 font-bold"
                      : li === levels.length - 1
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-sky-50 border-sky-200 text-sky-700"
                  }`}
                  title={hash}
                >
                  {hash.substring(0, 8)}…
                </div>
                {hi < level.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 text-[9px] text-gray-400">
        Leaf count: {leaves.length} · Tree depth: {tree.length}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function Consolidation() {
  const returns  = useSharedStore(s => s.returns)
  const { toast } = useToast()

  const [mcms, setMcms] = useState<MasterConsignment[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sealing, setSealing] = useState(false)
  const [sealedMCM, setSealedMCM] = useState<MasterConsignment | null>(null)

  // Only show returns that are received and not yet consolidated
  const eligible = returns.filter(
    r => r.status === "RECEIVED_BY_DISTRIBUTOR" && r.transitStatus !== "CONSOLIDATED" && r.transitStatus !== "DISPUTE_WEIGHT_MISMATCH"
  )

  const disputed = returns.filter(r => r.transitStatus === "DISPUTE_WEIGHT_MISMATCH")

  useEffect(() => {
    getMasterConsignments().then(setMcms)
  }, [sealedMCM])

  const toggleSelect = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const selectAll = () => setSelected(new Set(eligible.map(r => r.returnId)))
  const clearAll  = () => setSelected(new Set())

  const handleSeal = async () => {
    if (selected.size === 0) return
    setSealing(true)
    setSealedMCM(null)
    try {
      const mcm = await generateMCM([...selected])
      setSealedMCM(mcm)
      setSelected(new Set())
      toast({
        title: "✅ Master Crate Sealed",
        description: `${mcm.mcmId} — Merkle root computed over ${mcm.containedReturnIds.length} consignments.`,
      })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSealing(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <GitBranch className="w-8 h-8 text-purple-600" />
          Distributor Consolidation &amp; MCM Sealing
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Layer 3 — Multi-box crate consolidation with software Merkle Tree sealing for tamper-evident OEM dispatch.
        </p>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Eligible for Consolidation", value: eligible.length, color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
          { label: "Disputed (Locked Out)", value: disputed.length, color: "bg-red-50 border-red-200 text-red-700" },
          { label: "MCMs Sealed", value: mcms.length, color: "bg-purple-50 border-purple-200 text-purple-800" },
          { label: "Selected", value: selected.size, color: "bg-sky-50 border-sky-200 text-sky-800" },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold ${s.color}`}>
            <span className="text-lg font-bold">{s.value}</span>
            <span className="font-medium text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Left: Selection Queue ─────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Box className="w-4 h-4 text-gray-500" /> Verified Return Boxes — Consolidation Queue
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Select boxes to include in the Master Crate. Disputed boxes are locked out.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={selectAll}>All</Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={clearAll}>Clear</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {eligible.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No verified returns awaiting consolidation.
                </div>
              )}
              {eligible.map((r: ReturnRequest) => {
                const isSelected = selected.has(r.returnId)
                return (
                  <div
                    key={r.returnId}
                    onClick={() => toggleSelect(r.returnId)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "border-purple-400 bg-purple-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-purple-600 border-purple-600" : "border-gray-300"
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-900">{r.consignmentCode}</span>
                        <StatusPill status={r.transitStatus ?? r.status} />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {r.productName} · {r.batchNumber} · {r.requestedQuantity} units · {r.grossWeightGrams}g
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-[10px] text-gray-400">{r.returnId}</div>
                      {r.geoVerified && (
                        <div className="text-[10px] text-emerald-600 flex items-center gap-1 justify-end">
                          <ShieldCheck className="w-3 h-3" /> Geo ✓
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Disputed boxes — locked out */}
              {disputed.map((r: ReturnRequest) => (
                <div
                  key={r.returnId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50/60 opacity-70 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-700">{r.consignmentCode}</span>
                      <StatusPill status="DISPUTE_WEIGHT_MISMATCH" />
                    </div>
                    <div className="text-[10px] text-red-500 mt-0.5">⚠ Locked — Resolve weight dispute before consolidation</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Seal Button */}
          <Button
            onClick={handleSeal}
            disabled={selected.size === 0 || sealing}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 text-sm flex items-center justify-center gap-2 shadow-md"
          >
            {sealing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Computing Merkle Tree…</>
            ) : (
              <><PackageCheck className="w-4 h-4" /> Seal Master Crate ({selected.size} boxes) &amp; Generate MCM</>
            )}
          </Button>
        </div>

        {/* ── Right: Sealed MCM Panel ───────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Latest MCM Card */}
          {sealedMCM ? (
            <Card className="border-purple-300 shadow-lg bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="pb-3 border-b border-purple-100">
                <CardTitle className="text-base font-bold text-purple-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  MCM Sealed Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "MCM ID",          value: sealedMCM.mcmId },
                    { label: "OEM Target",       value: sealedMCM.manufacturerTarget },
                    { label: "Consignments",     value: sealedMCM.containedReturnIds.length.toString() },
                    { label: "Total Units",      value: sealedMCM.totalQuantity.toString() },
                    { label: "Total Weight",     value: `${sealedMCM.totalWeightGrams.toLocaleString()} g` },
                    { label: "Status",           value: sealedMCM.status },
                  ].map(item => (
                    <div key={item.label} className="space-y-0.5">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</div>
                      <div className="font-semibold text-gray-800 truncate">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Merkle Root */}
                <div className="p-3 bg-purple-900 rounded-lg">
                  <div className="text-[10px] text-purple-300 uppercase tracking-wider mb-1">Merkle Root Hash</div>
                  <div className="font-mono text-[10px] text-purple-100 break-all">{sealedMCM.merkleRoot}</div>
                </div>

                {/* Transit Hash */}
                <div className="p-2 bg-gray-900 rounded-lg">
                  <div className="text-[10px] text-gray-400 mb-0.5">Hash Chain Tx ID</div>
                  <div className="font-mono text-[9px] text-green-400 break-all">{sealedMCM.transitHashTxId}</div>
                </div>

                {/* Merkle Tree Visualiser */}
                <MerkleVisualiser
                  tree={sealedMCM.merkleTree}
                  leaves={sealedMCM.merkleTree[0] ?? []}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-gray-300 shadow-none bg-gray-50/60">
              <CardContent className="py-12 text-center text-gray-400">
                <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select returns and seal a crate to see the Merkle proof here.</p>
              </CardContent>
            </Card>
          )}

          {/* MCM History */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-2 border-b border-gray-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-gray-800">MCM History</CardTitle>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => getMasterConsignments().then(setMcms)}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-3">
              {mcms.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No MCMs generated yet.</p>
              ) : (
                <div className="space-y-2">
                  {mcms.map(m => (
                    <div key={m.mcmId} className="flex items-start justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div>
                        <div className="font-mono text-xs font-bold text-gray-900">{m.mcmId}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {m.containedReturnIds.length} boxes · {m.totalQuantity} units · {m.totalWeightGrams.toLocaleString()}g
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Root: {m.merkleRoot.substring(0, 12)}…
                        </div>
                      </div>
                      <MCMStatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info panel */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800 space-y-1">
        <div className="font-bold flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" /> How Merkle Sealing Works</div>
        <ul className="list-disc list-inside space-y-0.5 text-purple-700">
          <li>Each box gets a <strong>leaf hash</strong> = SHA-256(returnId | batchNumber | grossWeight | sealToken)</li>
          <li>Pairs of leaf hashes are recursively hashed until a single <strong>Merkle Root</strong> remains</li>
          <li>The root is logged in the key-value hash chain — any tampered bag invalidates the root at OEM intake</li>
          <li>Disputed boxes (weight delta &gt; 2%) are permanently <strong>locked out</strong> until resolved</li>
        </ul>
      </div>
    </div>
  )
}
