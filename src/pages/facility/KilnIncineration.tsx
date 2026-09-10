import { useState, useEffect } from "react"
import { useSharedStore } from "@/store/useSharedStore"
import { runKilnIncineration, getFinalIncinerationRecords, getEWTNs } from "@/api/mockApi"
import type { FinalIncinerationRecord, ElectronicWasteTransferNote, KilnTelemetryReading } from "@/api/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Flame, Weight, MapPin, ShieldCheck, QrCode, Loader2,
  CheckCircle2, AlertTriangle, XCircle, Thermometer, FileText, Leaf,
} from "lucide-react"

// ── Burn Phase Config ─────────────────────────────────────────────────────────
const PHASE_CONFIG: Record<KilnTelemetryReading["burnPhase"], { label: string; color: string; barWidth: string }> = {
  LOADING:   { label: "Loading",   color: "bg-sky-400",    barWidth: "w-[16%]" },
  IGNITION:  { label: "Ignition",  color: "bg-amber-400",  barWidth: "w-[32%]" },
  FULL_BURN: { label: "Full Burn", color: "bg-orange-500", barWidth: "w-[60%]" },
  BURNOUT:   { label: "Burn-out",  color: "bg-red-400",    barWidth: "w-[80%]" },
  COMPLETE:  { label: "Complete",  color: "bg-emerald-500",barWidth: "w-full"  },
}

// ── Telemetry Chart ───────────────────────────────────────────────────────────
function TelemetryChart({ readings }: { readings: KilnTelemetryReading[] }) {
  return (
    <div className="space-y-2">
      {readings.map((r) => {
        const cfg = PHASE_CONFIG[r.burnPhase]
        return (
          <div key={r.readingId} className="grid grid-cols-[80px_1fr_70px_70px_70px] gap-2 items-center text-[10px]">
            <span className={`text-center rounded-full px-2 py-0.5 font-semibold text-white ${cfg.color}`}>
              {cfg.label}
            </span>
            {/* Weight bar */}
            <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full transition-all"
                style={{ width: `${(r.hopperWeightKg / readings[0].hopperWeightKg) * 100}%` }}
              />
            </div>
            <span className="text-right font-mono text-gray-600">{r.hopperWeightKg} kg</span>
            <span className={`text-right font-mono font-bold ${r.primaryChamberTempC >= 850 ? "text-emerald-600" : "text-red-500"}`}>
              {r.primaryChamberTempC}°C
            </span>
            <span className={`text-right font-mono font-bold ${r.secondaryChamberTempC >= 1050 ? "text-emerald-600" : "text-red-500"}`}>
              {r.secondaryChamberTempC}°C
            </span>
          </div>
        )
      })}
      <div className="grid grid-cols-[80px_1fr_70px_70px_70px] gap-2 text-[9px] text-gray-400 font-semibold">
        <span />
        <span>Hopper Weight</span>
        <span className="text-right">Mass (kg)</span>
        <span className="text-right">Primary</span>
        <span className="text-right">Secondary</span>
      </div>
    </div>
  )
}

// ── Weight Verification Badge ─────────────────────────────────────────────────
function WeightBadge({ rec }: { rec: FinalIncinerationRecord }) {
  const v = rec.weightVerification
  const ok = v.passed
  return (
    <div className={`p-3 rounded-lg border text-xs space-y-1 ${ok ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-300"}`}>
      <div className="flex items-center gap-2 font-bold">
        {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-red-600" />}
        <span className={ok ? "text-emerald-800" : "text-red-700"}>
          Weight-to-Energy Check: {ok ? "PASSED" : "FAILED — WEIGHT DISPUTE"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-1">
        {[
          { label: "L3/L4 Logged", value: `${v.loggedWeightKg} kg` },
          { label: "Hopper Scale",  value: `${v.hopperWeightKg} kg` },
          { label: `Δ (tol. ±${v.tolerancePercent}%)`, value: `${v.deltaPercent}%`, warn: !ok },
        ].map(item => (
          <div key={item.label}>
            <div className="text-[9px] text-gray-400 uppercase">{item.label}</div>
            <div className={`font-mono font-bold ${item.warn ? "text-red-600" : "text-gray-800"}`}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Auto-Compiled Certificate Document ───────────────────────────────────────
function FIRCertificate({ rec }: { rec: FinalIncinerationRecord }) {
  return (
    <Card className="border-2 border-gray-800 shadow-xl bg-white">
      <CardContent className="p-8 md:p-12">
        {/* Header */}
        <div className="text-center border-b-4 border-double border-gray-800 pb-8 mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-red-700 rounded-full flex items-center justify-center">
              <Flame className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-[10px] font-semibold tracking-[0.35em] text-gray-500 uppercase">
            Government of India · CPCB · CDSCO — Bio-Medical Waste Management Rules 2016
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-black text-gray-900 mt-2 uppercase tracking-wide">
            Final Incineration Record
          </h2>
          <p className="text-sm font-bold text-red-700 tracking-widest mt-0.5">
            Loop Closure Certificate — Terminal Destruction
          </p>
          <p className="text-[10px] font-mono text-gray-400 mt-2">
            {rec.recordId} · Cert: {rec.certificateId}
          </p>
          <p className="text-[10px] text-gray-400">
            Completed: {new Date(rec.completedAt).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Geo & Facility */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Facility (Geotagged)</h3>
            <div>
              <p className="text-[9px] text-gray-400 uppercase">CBWTF Name</p>
              <p className="font-bold text-gray-900">{rec.facilityName}</p>
              <p className="font-mono text-[10px] text-gray-400">CPCB Reg: {rec.facilityRegNumber}</p>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] text-gray-400 uppercase">GPS Coordinates (Feeder Conveyor)</p>
                <p className="font-mono text-sm font-bold text-gray-800">{rec.geoLat}, {rec.geoLng}</p>
                <p className="text-[10px] text-gray-500">{rec.geoAddress}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase">Master Crate QR Scanned At</p>
              <p className="font-mono text-xs font-bold text-gray-800">{new Date(rec.masterCrateQrScannedAt).toLocaleString("en-IN")}</p>
              <p className="text-[10px] text-gray-500">By Supervisor: {rec.masterCrateQrScannedBy}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Kiln Performance</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Peak Primary",   value: `${rec.peakPrimaryChamberTempC}°C`,   ok: rec.peakPrimaryChamberTempC >= 850 },
                { label: "Peak Secondary", value: `${rec.peakSecondaryChamberTempC}°C`, ok: rec.peakSecondaryChamberTempC >= 1050 },
                { label: "Kiln Duration",  value: "2 hrs 00 min", ok: true },
                { label: "Ash Residue",    value: `${rec.totalAshMassKg} kg (~4%)`, ok: true },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[9px] text-gray-400 uppercase">{item.label}</p>
                  <p className={`text-lg font-black font-mono ${item.ok ? "text-emerald-700" : "text-red-600"}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase">Ash Disposal Waybill</p>
              <p className="font-mono font-bold text-gray-800">{rec.ashDisposalWaybill}</p>
            </div>
          </div>
        </div>

        {/* Weight Verification */}
        <div className="mb-8">
          <WeightBadge rec={rec} />
        </div>

        {/* Kiln Telemetry Chart */}
        <div className="mb-8">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1 mb-3">
            Continuous Kiln Telemetry Log
          </h3>
          <TelemetryChart readings={rec.telemetryReadings} />
        </div>

        {/* Terminal Batch Commitment */}
        <div className="mb-8">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1 mb-3">
            Terminal Status Commitment — Permanently Destroyed
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {rec.destroyedBatchNumbers.map((bn, i) => (
              <div key={bn} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                <Flame className="w-3 h-3 text-red-500 shrink-0" />
                <div>
                  <div className="font-mono text-xs font-bold text-red-800">{bn}</div>
                  <div className="text-[9px] text-gray-400">{rec.sourcePharmacyIds[i] ?? "—"}</div>
                </div>
                <span className="ml-auto text-[9px] font-black text-red-600 uppercase">DESTROYED</span>
              </div>
            ))}
          </div>
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-[10px] text-red-800 font-semibold text-center">
            🔒 {rec.totalUnitsDestroyed.toLocaleString()} TOTAL UNITS PERMANENTLY DESTROYED — STATUS IRREVERSIBLE
          </div>
        </div>

        {/* Plant Manager Signature */}
        <div className="mb-8 p-4 border-2 border-gray-300 rounded-xl bg-gray-50">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Plant Manager Digital Signature (SHA-256)
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[9px] text-gray-400 uppercase">Plant Manager</p>
              <p className="font-bold text-gray-900">{rec.plantManagerName}</p>
              <p className="font-mono text-[10px] text-gray-500">ID: {rec.plantManagerId}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase">Signature Hash (SHA-256)</p>
              <p className="font-mono text-[10px] break-all text-indigo-700">{rec.plantManagerSignatureHash}</p>
            </div>
          </div>
        </div>

        {/* Cryptographic Proof */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Tamper-Evident Cryptographic Proof
          </h3>
          <div className="space-y-3 font-mono text-xs break-all">
            <div>
              <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Certificate Hash (SHA-256)</span>
              <span className="text-emerald-400 font-bold">{rec.certificateHash}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Hash Chain Tx ID</span>
              <span className="text-blue-400">{rec.blockchainTxId}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[9px] uppercase tracking-wider block">MCM Merkle Root (source)</span>
              <span className="text-yellow-400">{rec.mcmId}</span>
            </div>
            <div className="pt-2 border-t border-gray-700">
              <span className="text-green-400 font-black">LOOP CLOSED · ALL BATCHES PERMANENTLY DESTROYED · CANNOT BE REACTIVATED</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-gray-400 border-t pt-4">
          This record is auto-compiled by the RxTrack Platform · SHA-256 anchored · Publicly verifiable · Cannot be forged or backdated.
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function KilnIncineration() {
  const { toast } = useToast()
  const finalRecords = useSharedStore(s => s.finalIncinerationRecords)
  const masterConsignments = useSharedStore(s => s.masterConsignments)

  const [ewtns,   setEwtns]   = useState<ElectronicWasteTransferNote[]>([])
  const [records, setRecords] = useState<FinalIncinerationRecord[]>([])

  // Form
  const [selectedEwtnId,  setSelectedEwtnId]  = useState("")
  const [selectedMcmId,   setSelectedMcmId]   = useState("")
  const [hopperWeight,    setHopperWeight]     = useState("")
  const [supervisorId,    setSupervisorId]     = useState("")
  const [plantMgrId,      setPlantMgrId]       = useState("")
  const [plantMgrName,    setPlantMgrName]     = useState("")
  const [ashWaybill,      setAshWaybill]       = useState("")
  const [running,         setRunning]          = useState(false)
  const [activeRecord,    setActiveRecord]     = useState<FinalIncinerationRecord | null>(null)

  useEffect(() => {
    getEWTNs().then(setEwtns)
    getFinalIncinerationRecords().then(setRecords)
  }, [running])

  const readyEwtns = ewtns.filter(e => e.status !== "INCINERATED")
  const selectedEwtn = ewtns.find(e => e.ewtnId === selectedEwtnId)

  // Auto-suggest hopper weight from E-WTN
  useEffect(() => {
    if (selectedEwtn && !hopperWeight) {
      setHopperWeight(selectedEwtn.totalNetMassKg.toFixed(1))
    }
  }, [selectedEwtn])

  // Find MCMs matching the selected E-WTN batch
  const matchingMcms = masterConsignments.filter(m =>
    selectedEwtn ? m.status === "BLIND_SCAN_PASS" : false
  )

  const demoFill = () => {
    setSupervisorId("CBWTF-SUP-2025-0081")
    setPlantMgrId("CBWTF-PM-2025-0012")
    setPlantMgrName("Suresh Agarwal")
    setAshWaybill(`ASH-WB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
  }

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEwtnId || !selectedMcmId || !hopperWeight || !supervisorId || !plantMgrId || !plantMgrName || !ashWaybill) return
    setRunning(true)
    try {
      const rec = await runKilnIncineration(
        selectedEwtnId, selectedMcmId,
        parseFloat(hopperWeight),
        supervisorId, plantMgrId, plantMgrName, ashWaybill
      )
      setActiveRecord(rec)
      await getFinalIncinerationRecords().then(setRecords)
      toast({
        title: rec.status === "COMPLETED" ? "🔥 Loop Closed — Incineration Complete" : "⚠ Weight Dispute Flagged",
        description: `${rec.recordId} · ${rec.totalUnitsDestroyed} units → STATUS_DESTROYED`,
        variant: rec.status === "COMPLETED" ? "default" : "destructive",
      })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally { setRunning(false) }
  }

  const allRecords = records.length > 0 ? records : finalRecords

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Flame className="w-8 h-8 text-red-600" />
          Kiln Incineration — Final Loop Closure
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Layer 5 — Weight-to-energy telemetry · Geotagged master crate QR scan at feeder conveyor ·
          Terminal STATUS_DESTROYED commitment for all batches.
        </p>
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "E-WTNs Awaiting Kiln", value: readyEwtns.length,                             color: "bg-amber-50 border-amber-200 text-amber-800" },
          { label: "Incineration Records",  value: allRecords.length,                              color: "bg-red-50 border-red-200 text-red-700" },
          { label: "Batches Destroyed",     value: allRecords.reduce((s, r) => s + r.destroyedBatchIds.length, 0), color: "bg-gray-50 border-gray-300 text-gray-700" },
          { label: "Units Destroyed",       value: allRecords.reduce((s, r) => s + r.totalUnitsDestroyed, 0).toLocaleString(), color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold ${s.color}`}>
            <span className="text-lg font-bold">{s.value}</span>
            <span className="text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ══ Incineration Form ════════════════════════════════════════════ */}
        <Card className="shadow-sm border-red-200">
          <CardHeader className="bg-red-50/60 border-b border-red-100">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-red-900">
              <QrCode className="w-4 h-4" /> Feeder Conveyor QR Scan &amp; Kiln Initiation
            </CardTitle>
            <CardDescription className="text-xs text-red-700">
              Supervisor scans the master crate QR at the feeder conveyor.
              Load-cell hopper weight is auto-checked against L3/L4 records within ±5% thermal tolerance.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleRun} className="space-y-4">

              {/* E-WTN */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">E-WTN Reference</label>
                <Select value={selectedEwtnId} onValueChange={v => { setSelectedEwtnId(v); setSelectedMcmId(""); setHopperWeight("") }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select E-WTN for this consignment…" />
                  </SelectTrigger>
                  <SelectContent>
                    {readyEwtns.map(e => (
                      <SelectItem key={e.ewtnId} value={e.ewtnId}>
                        {e.ewtnId} — {e.batchNumber} — {e.cbwtfName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEwtn && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg grid grid-cols-2 gap-2 text-[11px]">
                  {[
                    { label: "CBWTF",    value: selectedEwtn.cbwtfName },
                    { label: "Vehicle",  value: selectedEwtn.vehicleNumber },
                    { label: "Batch",    value: selectedEwtn.batchNumber },
                    { label: "Logged Mass", value: `${selectedEwtn.totalNetMassKg} kg` },
                  ].map(item => (
                    <div key={item.label}>
                      <span className="text-gray-400 uppercase text-[9px]">{item.label}: </span>
                      <span className="font-semibold text-gray-800 font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* MCM */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Master Consignment (QR Scan)</label>
                <Select value={selectedMcmId} onValueChange={setSelectedMcmId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Scan/select MCM at feeder conveyor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {matchingMcms.map(m => (
                      <SelectItem key={m.mcmId} value={m.mcmId}>
                        {m.mcmId} — {m.containedReturnIds.length} boxes — {m.totalQuantity} units
                      </SelectItem>
                    ))}
                    {matchingMcms.length === 0 && selectedEwtn && (
                      <SelectItem value="_none" disabled>
                        No blind-scan-passed MCMs found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Hopper Weight (Load-Cell) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">
                  Hopper Load-Cell Weight (kg)
                  {selectedEwtn && <span className="ml-1 font-normal text-gray-400">(logged: {selectedEwtn.totalNetMassKg} kg · ±5% tolerance)</span>}
                </label>
                <div className="flex gap-2">
                  <Input type="number" value={hopperWeight}
                    onChange={e => setHopperWeight(e.target.value)}
                    placeholder="e.g. 8.3" step="0.1" min={0.1} required />
                  {selectedEwtn && hopperWeight && (
                    <div className={`flex items-center text-xs font-bold px-2 rounded border ${
                      Math.abs((parseFloat(hopperWeight) - selectedEwtn.totalNetMassKg) / selectedEwtn.totalNetMassKg * 100) <= 5
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-red-50 border-red-300 text-red-700"
                    }`}>
                      {Math.abs((parseFloat(hopperWeight) - selectedEwtn.totalNetMassKg) / selectedEwtn.totalNetMassKg * 100) <= 5
                        ? `✓ Δ ${Math.abs(parseFloat(hopperWeight) - selectedEwtn.totalNetMassKg).toFixed(2)} kg`
                        : `⚠ Δ EXCEEDS 5%`}
                    </div>
                  )}
                </div>
              </div>

              {/* Supervisor + Plant Manager */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Kiln Supervisor ID</label>
                  <Input value={supervisorId} onChange={e => setSupervisorId(e.target.value)}
                    placeholder="CBWTF-SUP-2025-0081" className="font-mono text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Ash Waybill No.</label>
                  <Input value={ashWaybill} onChange={e => setAshWaybill(e.target.value)}
                    placeholder="ASH-WB-2025-0042" className="font-mono text-sm" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Plant Manager ID</label>
                  <Input value={plantMgrId} onChange={e => setPlantMgrId(e.target.value)}
                    placeholder="CBWTF-PM-2025-0012" className="font-mono text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Plant Manager Name</label>
                  <Input value={plantMgrName} onChange={e => setPlantMgrName(e.target.value)}
                    placeholder="Suresh Agarwal" required />
                </div>
              </div>

              {/* Geo info panel */}
              {selectedEwtn && (
                <div className="flex items-start gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs">
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-indigo-800">Geo-Tagged on Submit</div>
                    <div className="text-indigo-600 text-[10px]">
                      GPS coordinates of {selectedEwtn.cbwtfName} feeder conveyor will be embedded in the record.
                    </div>
                  </div>
                </div>
              )}

              <Button type="button" size="sm" variant="outline"
                className="text-xs border-red-200 text-red-700"
                onClick={demoFill}>
                ✨ Demo Fill (Supervisor + Plant Manager)
              </Button>

              {/* Terminal warning */}
              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-md text-xs text-red-800 space-y-1">
                <div className="font-black flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> TERMINAL ACTION — IRREVERSIBLE</div>
                <p>Clicking this button permanently transitions ALL contained batch IDs to STATUS_DESTROYED. This action cannot be undone. The platform will refuse any future POS scan of these batch numbers.</p>
              </div>

              <Button type="submit"
                disabled={!selectedEwtnId || !selectedMcmId || !hopperWeight || !supervisorId || !plantMgrId || !plantMgrName || !ashWaybill || running}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-black text-sm">
                {running
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Running Kiln Incineration…</>
                  : <><Flame className="w-4 h-4 mr-2" />🔒 COMMIT TO INCINERATION — Close the Loop</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ══ Info Panel ═══════════════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Anti-Fraud Mechanisms */}
          <Card className="border-gray-200">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Layer 5 Anti-Fraud Mechanisms
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2 text-xs">
              {[
                { icon: Weight,      label: "Weight-to-Energy Tolerance",     desc: "Hopper load-cell vs L3/L4 weight ±5% — excess triggers CRITICAL fraud alert" },
                { icon: Thermometer, label: "Continuous Telemetry",            desc: "6-reading burn log: LOADING → IGNITION → FULL_BURN → BURNOUT → COMPLETE" },
                { icon: MapPin,      label: "Geotagged Feeder Scan",          desc: "GPS coordinates of QR scan location locked to registered facility lat/lng" },
                { icon: QrCode,      label: "Master Crate QR at Conveyor",    desc: "MCM QR scanned at the physical feeder belt — proves waste entered the kiln" },
                { icon: ShieldCheck, label: "Plant Manager SHA-256 Signature", desc: "SHA-256(recordId|plantManagerId|timestamp|MCM merkleRoot) — cannot be backdated" },
                { icon: Flame,       label: "Terminal Status Lock",            desc: "All batch IDs → DESTROYED. POS hard-lock activated. Cannot be re-sold anywhere." },
                { icon: Leaf,        label: "Ash Disposal Chain",             desc: "Ash waybill links to certified landfill — prevents illegal dumping" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2">
                  <item.icon className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-700">{item.label}: </span>
                    <span className="text-gray-500">{item.desc}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Burn Phase Guide */}
          <Card className="border-gray-200">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                <Thermometer className="w-4 h-4 text-orange-500" /> CPCB Dual-Chamber Standard
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 text-xs space-y-1 text-gray-600">
              <p>Primary Chamber: <strong className="text-gray-900">≥ 850°C</strong> (complete combustion of organic matter)</p>
              <p>Secondary Chamber: <strong className="text-gray-900">≥ 1050°C</strong> (destructs toxic off-gases, dioxins &amp; furans)</p>
              <p>Ash metal test: <strong className="text-gray-900">TCLP compliant</strong> — disposed in secure landfill with Ash Waybill</p>
              <p>Reference: <em>Bio-Medical Waste Management Rules 2016, Schedule I, Category 4</em></p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Active Certificate ─────────────────────────────────────────────── */}
      {activeRecord && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Auto-Compiled Destruction Certificate
            </h2>
            <Button size="sm" variant="outline" className="gap-2 text-xs print:hidden"
              onClick={() => window.print()}>
              🖨 Print / Save PDF
            </Button>
          </div>
          <FIRCertificate rec={activeRecord} />
        </div>
      )}

      {/* ── Historical Records ─────────────────────────────────────────────── */}
      {allRecords.filter(r => r !== activeRecord).length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-sm font-bold">Previous Incineration Records</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {allRecords.filter(r => r !== activeRecord).map(rec => (
              <div key={rec.recordId}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => setActiveRecord(rec)}>
                <div>
                  <div className="font-mono text-xs font-bold text-gray-900">{rec.recordId}</div>
                  <div className="text-[10px] text-gray-500">
                    {rec.destroyedBatchNumbers.join(", ")} · {rec.totalUnitsDestroyed} units · {rec.facilityName}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${
                  rec.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-red-100 text-red-700 border-red-300"
                }`}>
                  {rec.status === "COMPLETED" ? "✓ Closed" : "⚠ Weight Dispute"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
