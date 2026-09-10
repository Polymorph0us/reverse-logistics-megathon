import { useState, useEffect, useRef } from "react"
import { useSharedStore } from "@/store/useSharedStore"
import { runBlindScan, tagDenatured, getMasterConsignments, getDenaturedTags } from "@/api/mockApi"
import type { MasterConsignment, DenaturedBatchTag, BlindScanResult, DenaturationAgent } from "@/api/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  ScanLine, ShieldAlert, FlaskConical, CheckCircle2, XCircle,
  AlertTriangle, Plus, X, Loader2, Eye, EyeOff, FileCheck, Flame,
} from "lucide-react"

// ── Chemical agent registry ───────────────────────────────────────────────────
const AGENTS: { value: DenaturationAgent; label: string; description: string; color: string }[] = [
  {
    value: "METHYLENE_BLUE_DYE",
    label: "🔵 Methylene Blue Indelible Dye",
    description: "Permanent staining renders tablets/capsules unsalvageable. CPCB approved.",
    color: "blue",
  },
  {
    value: "ACTIVATED_CHARCOAL",
    label: "⚫ Activated Charcoal Slurry",
    description: "Absorbs active compounds, makes formulation bioavailable hazard.",
    color: "gray",
  },
  {
    value: "SODIUM_HYDROXIDE",
    label: "🟡 Sodium Hydroxide Crushed Deactivator",
    description: "Alkaline saponification destroys API structure. Used for Schedule-H drugs.",
    color: "yellow",
  },
  {
    value: "CRUSH_PUNCH",
    label: "🔨 Physical Crush / Punch",
    description: "Mechanical destruction of tablet matrix. For hard-coated & scored tablets.",
    color: "orange",
  },
  {
    value: "SOLVENT_SOAK",
    label: "💧 Solvent Dissolution",
    description: "Ethanol/acetone soak dissolves extended-release polymer coatings.",
    color: "teal",
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function ScanResultCard({ result }: { result: BlindScanResult }) {
  const passed = result.passed
  return (
    <div className={`p-4 rounded-xl border-2 space-y-3 ${passed ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50"}`}>
      <div className="flex items-center gap-2">
        {passed ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
        <span className={`font-bold text-sm ${passed ? "text-emerald-800" : "text-red-800"}`}>
          {passed ? "✅ Blind Scan PASSED — Merkle Root Verified" : "🚨 Blind Scan FAILED — Anomaly Detected & CDSCO Alerted"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: "Expected Bags",       value: result.expectedBagIds.length, ok: true },
          { label: "Scanned Bags",        value: result.scannedBagIds.length,  ok: result.scannedBagIds.length === result.expectedBagIds.length },
          { label: "Missing (Stolen?)",   value: result.missingBags.length,    ok: result.missingBags.length === 0 },
          { label: "Extra (Unregistered)",value: result.extraBags.length,      ok: result.extraBags.length === 0 },
          { label: "Hash Mismatches",     value: result.hashMismatches.length, ok: result.hashMismatches.length === 0 },
        ].map(item => (
          <div key={item.label} className="flex justify-between items-center bg-white/70 px-2 py-1.5 rounded border border-gray-100">
            <span className="text-gray-600">{item.label}</span>
            <span className={`font-bold ${item.ok ? "text-emerald-700" : "text-red-700"}`}>{item.value}</span>
          </div>
        ))}
      </div>
      {!passed && result.missingBags.length > 0 && (
        <div className="text-xs bg-red-100 border border-red-200 rounded p-2">
          <span className="font-semibold text-red-700">Missing Consignment Codes: </span>
          {result.missingBags.join(", ")}
        </div>
      )}
      {!passed && result.hashMismatches.length > 0 && (
        <div className="text-xs bg-red-100 border border-red-200 rounded p-2">
          <span className="font-semibold text-red-700">⚠ Hash Mismatches (Possible Counterfeit Swap): </span>
          {result.hashMismatches.join(", ")}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ManufacturerIntake() {
  const batches = useSharedStore(s => s.batches)
  const { toast } = useToast()

  const [mcms,  setMcms]  = useState<MasterConsignment[]>([])
  const [tags,  setTags]  = useState<DenaturedBatchTag[]>([])

  // Blind Scan
  const [selectedMCM,     setSelectedMCM]     = useState("")
  const [scanInput,       setScanInput]        = useState("")
  const [scannedCodes,    setScannedCodes]     = useState<string[]>([])
  const [manifestVisible, setManifestVisible]  = useState(false)
  const [scanResult,      setScanResult]       = useState<BlindScanResult | null>(null)
  const [scanning,        setScanning]         = useState(false)
  const scanRef = useRef<HTMLInputElement>(null)

  // Denaturing
  const [denatBatchId,    setDenatBatchId]    = useState("")
  const [denatAgent,      setDenatAgent]      = useState<DenaturationAgent>("METHYLENE_BLUE_DYE")
  const [agentLotNo,      setAgentLotNo]      = useState("")
  const [witnessId,       setWitnessId]       = useState("")
  const [witnessName,     setWitnessName]     = useState("")
  const [qtyDenatured,    setQtyDenatured]    = useState("")
  const [weightKg,        setWeightKg]        = useState("")
  const [denatPhoto,      setDenatPhoto]      = useState<string | null>(null)
  const [denaturing,      setDenaturing]      = useState(false)

  useEffect(() => {
    getMasterConsignments().then(setMcms)
    getDenaturedTags().then(setTags)
  }, [scanResult, denaturing])

  const mcmObj = mcms.find(m => m.mcmId === selectedMCM)
  const selectedAgent = AGENTS.find(a => a.value === denatAgent)

  const addCode = () => {
    const code = scanInput.trim().toUpperCase()
    if (!code || scannedCodes.includes(code)) return
    setScannedCodes(prev => [...prev, code])
    setScanInput("")
    scanRef.current?.focus()
  }

  const autoFillFromMCM = () => {
    if (!mcmObj) return
    const state = useSharedStore.getState()
    const codes = state.returns
      .filter(r => mcmObj.containedReturnIds.includes(r.returnId))
      .map(r => r.consignmentCode ?? r.returnId)
    setScannedCodes(codes)
    toast({ title: "Demo: All codes auto-filled", description: "Simulates a perfect blind scan." })
  }

  const handleBlindScan = async () => {
    if (!selectedMCM || scannedCodes.length === 0) return
    setScanning(true); setScanResult(null)
    try {
      const result = await runBlindScan(selectedMCM, scannedCodes)
      setScanResult(result)
      toast(result.passed
        ? { title: "Blind Scan Passed ✓", description: "Merkle root verified. Cleared for denaturing." }
        : { title: "Blind Scan Failed!", description: "Anomaly detected — CDSCO alerted.", variant: "destructive" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally { setScanning(false) }
  }

  const handleDenaturing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!denatBatchId || !witnessId || !witnessName || !qtyDenatured || !weightKg) return
    setDenaturing(true)
    try {
      const tag = await tagDenatured(
        denatBatchId,
        denatAgent,
        witnessId,
        witnessName,
        Number(qtyDenatured),
        Number(weightKg),
        agentLotNo || undefined,
        denatPhoto ?? undefined
      )
      setTags(prev => [tag, ...prev])
      toast({ title: "🧪 Denaturing Tag Issued", description: `${tag.tagId} — ${tag.batchNumber} → CONDITION_DENATURED_CONDEMNED` })
      setDenatBatchId(""); setWitnessId(""); setWitnessName("")
      setQtyDenatured(""); setWeightKg(""); setDenatPhoto(null); setAgentLotNo("")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally { setDenaturing(false) }
  }

  const receivedBatches = batches.filter(b =>
    b.currentStatus === "WITH_MANUFACTURER" || b.currentStatus === "CONDITION_DENATURED_CONDEMNED"
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-indigo-600" />
          OEM Intake &amp; Pre-Destruction Authorization
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Layer 4 — Blind Inward Reconciliation (Anti-Collusion) → Chemical Denaturing (CDSCO Witnessed) → E-WTN → Certificate.
        </p>
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "MCMs at Intake",      value: mcms.filter(m => m.status !== "SEALED").length,                color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
          { label: "Blind Scan Passed",   value: mcms.filter(m => m.status === "BLIND_SCAN_PASS").length,       color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { label: "Blind Scan Disputes", value: mcms.filter(m => m.status === "BLIND_SCAN_DISPUTE").length,    color: "bg-red-50 border-red-200 text-red-700" },
          { label: "Denaturing Tags",     value: tags.length,                                                    color: "bg-amber-50 border-amber-200 text-amber-800" },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold ${s.color}`}>
            <span className="text-lg font-bold">{s.value}</span>
            <span className="text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ══ STEP 1: BLIND SCAN ══════════════════════════════════════════════ */}
        <Card className="shadow-sm border-indigo-200">
          <CardHeader className="bg-indigo-50/60 border-b border-indigo-100">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-900">
              <ScanLine className="w-4 h-4" /> Step 1 — Blind Inward Scan
            </CardTitle>
            <CardDescription className="text-xs text-indigo-700">
              Screen is <strong>deliberately blank</strong> — scan each box code without seeing the expected manifest.
              Backend cross-checks against the sealed Merkle tree.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Select Arriving MCM</label>
              <Select value={selectedMCM} onValueChange={v => { setSelectedMCM(v); setScanResult(null); setScannedCodes([]) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a sealed Master Consignment…" />
                </SelectTrigger>
                <SelectContent>
                  {mcms.filter(m => m.status === "SEALED" || m.status === "IN_TRANSIT_TO_OEM").map(m => (
                    <SelectItem key={m.mcmId} value={m.mcmId}>
                      {m.mcmId} — {m.containedReturnIds.length} boxes — {m.manufacturerTarget}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMCM && mcmObj && (
              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-amber-50 border-amber-200">
                <div className="flex items-center gap-2 text-xs text-amber-800 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  BLIND PROTOCOL ACTIVE — Manifest hidden from scanner
                </div>
                <Button size="sm" variant="ghost" className="h-6 text-[11px] text-amber-700"
                  onClick={() => setManifestVisible(v => !v)}>
                  {manifestVisible ? <><EyeOff className="w-3 h-3 mr-1" />Hide</> : <><Eye className="w-3 h-3 mr-1" />Supervisor View</>}
                </Button>
              </div>
            )}

            {manifestVisible && mcmObj && (
              <div className="p-3 bg-white border border-amber-200 rounded-lg text-[11px] space-y-1">
                <div className="font-semibold text-amber-800 mb-1">📋 Expected Bags (Supervisor Only)</div>
                {useSharedStore.getState().returns
                  .filter(r => mcmObj.containedReturnIds.includes(r.returnId))
                  .map(r => (
                    <div key={r.returnId} className="flex justify-between">
                      <span className="font-mono text-gray-700">{r.consignmentCode}</span>
                      <span className="text-gray-500">{r.batchNumber}</span>
                    </div>
                  ))}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Scan Box Code (one at a time)</label>
              <div className="flex gap-2">
                <Input
                  ref={scanRef}
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCode()}
                  placeholder="e.g. BOX-8K2M · Press Enter to add"
                  className="font-mono text-sm"
                  disabled={!selectedMCM}
                />
                <Button size="icon" variant="outline" onClick={addCode} disabled={!selectedMCM}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {scannedCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {scannedCodes.map(code => (
                  <span key={code} className="inline-flex items-center gap-1 font-mono text-[11px] bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-full px-2 py-0.5">
                    {code}
                    <button onClick={() => setScannedCodes(prev => prev.filter(c => c !== code))}>
                      <X className="w-3 h-3 text-indigo-400 hover:text-red-500" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs h-7 border-indigo-200 text-indigo-700"
                onClick={autoFillFromMCM} disabled={!selectedMCM}>
                ✨ Auto-Fill (Demo — Perfect Scan)
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 border-red-200 text-red-700"
                onClick={() => setScannedCodes(prev => prev.slice(0, Math.max(0, prev.length - 1)))}
                disabled={scannedCodes.length === 0}>
                ✂ Remove Last (Simulate Missing)
              </Button>
            </div>

            <Button onClick={handleBlindScan} disabled={!selectedMCM || scannedCodes.length === 0 || scanning}
              className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold">
              {scanning
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Running Merkle Verification…</>
                : <><ScanLine className="w-4 h-4 mr-2" />Verify Blind Scan Against MCM Merkle Root</>}
            </Button>

            {scanResult && <ScanResultCard result={scanResult} />}
          </CardContent>
        </Card>

        {/* ══ STEP 2: CHEMICAL DENATURING ═════════════════════════════════════ */}
        <Card className="shadow-sm border-amber-200">
          <CardHeader className="bg-amber-50/60 border-b border-amber-100">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-900">
              <FlaskConical className="w-4 h-4" /> Step 2 — Pre-Destruction Denaturing Tag
            </CardTitle>
            <CardDescription className="text-xs text-amber-700">
              CDSCO witness officer must physically witness denaturing and enter their credentials.
              Status flips to <strong>CONDITION_DENATURED_CONDEMNED</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleDenaturing} className="space-y-4">

              {/* Batch */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Batch (Blind Scan Passed)</label>
                <Select value={denatBatchId} onValueChange={setDenatBatchId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select batch at OEM…" />
                  </SelectTrigger>
                  <SelectContent>
                    {receivedBatches.map(b => (
                      <SelectItem key={b.batchId} value={b.batchId}>
                        {b.product.name} — {b.batchNumber} ({b.currentQuantity} units)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chemical Agent */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Denaturing Agent</label>
                <Select value={denatAgent} onValueChange={v => setDenatAgent(v as DenaturationAgent)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENTS.map(a => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAgent && (
                  <p className="text-[10px] text-gray-500 mt-1 pl-1">{selectedAgent.description}</p>
                )}
              </div>

              {/* Agent Lot Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Chemical Lot / Batch Number (optional)</label>
                <Input value={agentLotNo} onChange={e => setAgentLotNo(e.target.value)}
                  placeholder="e.g. MB-DYE-LOT-2025-0042" className="font-mono text-sm" />
              </div>

              {/* Quantity & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Quantity Denatured (units)</label>
                  <Input type="number" value={qtyDenatured} onChange={e => setQtyDenatured(e.target.value)}
                    placeholder="e.g. 94" min={1} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Net Mass (kg)</label>
                  <Input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                    placeholder="e.g. 8.4" step="0.1" min={0.1} required />
                </div>
              </div>

              {/* CDSCO Witness */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">CDSCO Officer ID *</label>
                  <Input value={witnessId} onChange={e => setWitnessId(e.target.value)}
                    placeholder="CDSCO-RJ-2025-0042" className="font-mono text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Officer Full Name *</label>
                  <Input value={witnessName} onChange={e => setWitnessName(e.target.value)}
                    placeholder="Dr. Rajesh Sharma" required />
                </div>
              </div>

              {/* Photo Evidence */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Denaturing Photo Evidence</label>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center hover:border-amber-300 hover:bg-amber-50/40 transition-colors text-xs text-gray-500">
                      {denatPhoto ? "📸 Photo loaded — SHA-256 will be computed on submit" : "📷 Tap to capture denaturing photo"}
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = ev => setDenatPhoto(ev.target?.result as string)
                          reader.readAsDataURL(file)
                        }} />
                    </div>
                  </label>
                  <Button type="button" size="sm" variant="outline"
                    className="text-xs border-amber-200 text-amber-800 shrink-0"
                    onClick={() => setDenatPhoto("demo-denaturing-photo-evidence-" + Date.now())}>
                    Demo Photo
                  </Button>
                </div>
                {denatPhoto && (
                  <div className="text-[10px] text-emerald-600 font-mono">✓ Evidence captured — SHA-256 hash will be stored in the audit chain</div>
                )}
              </div>

              {/* Certificate Gate Warning */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                <div className="font-bold mb-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> 4-Gate Certificate Lock</div>
                <p>Gate 2 of 4. Destruction certificate cannot be issued without: ①&nbsp;Blind Scan ②&nbsp;This Denaturing Tag ③&nbsp;E-WTN ④&nbsp;Incineration Temp Log.</p>
              </div>

              <Button type="submit"
                disabled={!denatBatchId || !witnessId || !witnessName || !qtyDenatured || !weightKg || denaturing}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {denaturing
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Issuing Tag…</>
                  : <><FlaskConical className="w-4 h-4 mr-2" />Issue Denaturing Tag → CONDITION_DENATURED_CONDEMNED</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── Denaturing Audit Log ────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-gray-500" /> Denaturing Audit Log
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {tags.map(tag => {
                const agentLabel = AGENTS.find(a => a.value === tag.agent)?.label ?? tag.agent
                return (
                  <div key={tag.tagId} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="space-y-0.5">
                      <div className="font-mono text-xs font-bold text-gray-900">{tag.tagId}</div>
                      <div className="text-[10px] text-gray-500">
                        {tag.batchNumber} · {agentLabel} · {tag.quantityDenatured} units · {tag.weightKg} kg
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Witness: {tag.witnessOfficerName} ({tag.witnessOfficerId})
                      </div>
                      <div className="font-mono text-[9px] text-gray-300">Photo SHA-256: {tag.photoEvidenceHash.substring(0, 24)}…</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> CONDITION_DENATURED_CONDEMNED
                      </span>
                      <div className="text-[9px] text-gray-400 mt-1">{new Date(tag.denaturedAt).toLocaleString()}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info panel */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800 space-y-1">
        <div className="font-bold flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-amber-600" /> Layer 4 — Anti-Collusion Protocol</div>
        <ul className="list-disc list-inside space-y-0.5 text-indigo-700">
          <li><strong>Blind Scan:</strong> Screen is deliberately blank at the dock — prevents collusion between drivers and dock workers</li>
          <li><strong>Merkle Recomputation:</strong> Each bag's leaf hash is recomputed and checked against the sealed MCM root at OEM intake</li>
          <li><strong>Hash Mismatch → Counterfeit Alert:</strong> Any tampered bag invalidates its hash → immediate CDSCO CRITICAL alert</li>
          <li><strong>CDSCO Witness Gate:</strong> Denaturing MUST be physically witnessed by a CDSCO officer — cannot be self-certified</li>
          <li><strong>Status Lock:</strong> CONDITION_DENATURED_CONDEMNED → cannot be re-sold or re-entered at any POS counter</li>
        </ul>
      </div>
    </div>
  )
}
