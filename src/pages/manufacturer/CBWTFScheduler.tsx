import { useState, useEffect } from "react"
import { useSharedStore } from "@/store/useSharedStore"
import { generateEWTN, logIncineration, getEWTNs, getDenaturedTags } from "@/api/mockApi"
import type { ElectronicWasteTransferNote, DenaturedBatchTag } from "@/api/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Truck, Flame, CheckCircle2, AlertTriangle, Loader2,
  ClipboardList, Thermometer, FileText, RefreshCw,
} from "lucide-react"

// ── CBWTF Facilities ──────────────────────────────────────────────────────────
const FACILITIES = {
  ECOWASTE: {
    name: "EcoWaste Solutions CBWTF",
    regNumber: "CBWTF-RAJ-2019-0042",
    address: "Plot 14, RIICO Industrial Area Phase II, Jaipur, Rajasthan 302022",
    category: "Class A — Incinerator + Autoclave",
  },
  GREENSHIELD: {
    name: "GreenShield Incinerators Ltd",
    regNumber: "CBWTF-MH-2017-0018",
    address: "Survey No. 82/3, Ambernath MIDC, Thane, Maharashtra 421506",
    category: "Class A — High-temperature Dual-Chamber",
  },
} as const

type FacilityKey = keyof typeof FACILITIES

function EWTNStatusBadge({ status }: { status: ElectronicWasteTransferNote["status"] }) {
  const map: Record<ElectronicWasteTransferNote["status"], string> = {
    SCHEDULED:          "bg-sky-100 text-sky-800 border-sky-300",
    IN_TRANSIT_TO_CBWTF:"bg-amber-100 text-amber-800 border-amber-300",
    RECEIVED_AT_CBWTF:  "bg-indigo-100 text-indigo-800 border-indigo-300",
    INCINERATED:        "bg-emerald-100 text-emerald-800 border-emerald-300",
  }
  const labels: Record<ElectronicWasteTransferNote["status"], string> = {
    SCHEDULED:          "📅 Scheduled",
    IN_TRANSIT_TO_CBWTF:"🚚 In Transit",
    RECEIVED_AT_CBWTF:  "📦 At CBWTF",
    INCINERATED:        "🔥 Incinerated",
  }
  return (
    <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${map[status]}`}>
      {labels[status]}
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function CBWTFScheduler() {
  const { toast } = useToast()
  const incinerationLogs = useSharedStore(s => s.incinerationLogs)

  const [tags,  setTags]  = useState<DenaturedBatchTag[]>([])
  const [ewtns, setEwtns] = useState<ElectronicWasteTransferNote[]>([])

  // E-WTN form
  const [selectedTagId, setSelectedTagId]   = useState("")
  const [facility,      setFacility]        = useState<FacilityKey>("ECOWASTE")
  const [vehicleNo,     setVehicleNo]       = useState("")
  const [driverName,    setDriverName]      = useState("")
  const [hazmatLicense, setHazmatLicense]   = useState("")
  const [pickupStart,   setPickupStart]     = useState("")
  const [pickupEnd,     setPickupEnd]       = useState("")
  const [generating,    setGenerating]      = useState(false)

  // Incineration log form
  const [selectedEwtnId,   setSelectedEwtnId]   = useState("")
  const [primaryTemp,      setPrimaryTemp]       = useState("")
  const [secondaryTemp,    setSecondaryTemp]     = useState("")
  const [operatorId,       setOperatorId]        = useState("")
  const [ashWaybill,       setAshWaybill]        = useState("")
  const [loggingIncin,     setLoggingIncin]      = useState(false)

  useEffect(() => {
    getDenaturedTags().then(setTags)
    getEWTNs().then(setEwtns)
  }, [generating, loggingIncin])

  const selectedTag = tags.find(t => t.tagId === selectedTagId)
  const facilityInfo = FACILITIES[facility]

  const primTempNum = Number(primaryTemp)
  const secTempNum  = Number(secondaryTemp)
  const tempPassPrimary   = primTempNum >= 850
  const tempPassSecondary = secTempNum  >= 1050

  const handleGenerateEWTN = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTagId || !vehicleNo || !driverName || !hazmatLicense || !pickupStart || !pickupEnd) return
    setGenerating(true)
    try {
      const ewtn = await generateEWTN(
        selectedTagId, vehicleNo, driverName, hazmatLicense,
        new Date(pickupStart).toISOString(),
        new Date(pickupEnd).toISOString(),
        facility
      )
      setEwtns(prev => [ewtn, ...prev])
      toast({ title: "📋 E-WTN Generated", description: `${ewtn.ewtnId} — ${ewtn.cbwtfName}. Vehicle: ${ewtn.vehicleNumber}` })
      setSelectedTagId(""); setVehicleNo(""); setDriverName("")
      setHazmatLicense(""); setPickupStart(""); setPickupEnd("")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally { setGenerating(false) }
  }

  const handleLogIncineration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEwtnId || !primaryTemp || !secondaryTemp || !operatorId || !ashWaybill) return
    setLoggingIncin(true)
    try {
      await logIncineration(selectedEwtnId, primTempNum, secTempNum, operatorId, ashWaybill)
      await getEWTNs().then(setEwtns)
      toast(
        tempPassPrimary && tempPassSecondary
          ? { title: "🔥 Incineration Log Recorded", description: `Secondary: ${secTempNum}°C ≥ 1050°C ✓. Certificate issuable.` }
          : { title: "⚠ Below Temperature Standard", description: `Secondary ${secTempNum}°C < 1050°C. Log saved but flagged.`, variant: "destructive" }
      )
      setSelectedEwtnId(""); setPrimaryTemp(""); setSecondaryTemp("")
      setOperatorId(""); setAshWaybill("")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally { setLoggingIncin(false) }
  }

  // Auto-fill demo defaults
  const demoFill = () => {
    setVehicleNo("RJ-14-GA-9021"); setDriverName("Mahesh Kumar Sharma")
    setHazmatLicense("HAZMAT-RJ-2023-00892")
    const now = new Date(); const end = new Date(now.getTime() + 4 * 3600000)
    setPickupStart(now.toISOString().slice(0, 16))
    setPickupEnd(end.toISOString().slice(0, 16))
  }

  const demoFillIncin = () => {
    setPrimaryTemp("920"); setSecondaryTemp("1085")
    setOperatorId("CBWTF-OP-2025-0014")
    setAshWaybill(`ASH-WB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
  }

  const confirmedTags = tags.filter(t => t.status === "CONFIRMED")

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Truck className="w-8 h-8 text-emerald-600" />
          CBWTF Pickup Scheduler &amp; Incineration Log
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Step 3 &amp; 4 of destruction pipeline — Generate E-WTN, schedule hazmat vehicle pickup, and record dual-chamber temperature log.
        </p>
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Confirmed Denaturing Tags",  value: confirmedTags.length,                                 color: "bg-amber-50 border-amber-200 text-amber-800" },
          { label: "E-WTNs Issued",              value: ewtns.length,                                         color: "bg-sky-50 border-sky-200 text-sky-800" },
          { label: "Incineration Logs",          value: incinerationLogs.length,                              color: "bg-orange-50 border-orange-200 text-orange-800" },
          { label: "Temp Logs Passed",           value: incinerationLogs.filter(l => l.passed).length,        color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold ${s.color}`}>
            <span className="text-lg font-bold">{s.value}</span>
            <span className="text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        {/* ══ STEP 3: E-WTN GENERATOR ════════════════════════════════════════ */}
        <Card className="shadow-sm border-sky-200">
          <CardHeader className="bg-sky-50/60 border-b border-sky-100">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-sky-900">
              <ClipboardList className="w-4 h-4" /> Step 3 — Generate E-WTN
            </CardTitle>
            <CardDescription className="text-xs text-sky-700">
              Electronic Waste Transfer Note connecting your facility to the authorized CBWTF incinerator.
              Gate: Requires a <strong>confirmed denaturing tag</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleGenerateEWTN} className="space-y-4">

              {/* Tag selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Denaturing Tag (confirmed)</label>
                <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a confirmed denaturing tag…" />
                  </SelectTrigger>
                  <SelectContent>
                    {confirmedTags.map(t => (
                      <SelectItem key={t.tagId} value={t.tagId}>
                        {t.tagId} — {t.batchNumber} ({t.quantityDenatured} units, {t.weightKg} kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTag && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] space-y-1">
                  <div className="font-semibold text-amber-800">Linked Denaturing Tag</div>
                  <div className="flex justify-between"><span className="text-gray-600">Agent</span><span className="font-mono font-semibold">{selectedTag.agent}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Witness</span><span className="font-semibold">{selectedTag.witnessOfficerName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Net Mass</span><span className="font-semibold">{selectedTag.weightKg} kg</span></div>
                </div>
              )}

              {/* CBWTF Facility */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Authorized CBWTF Facility</label>
                <Select value={facility} onValueChange={v => setFacility(v as FacilityKey)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FACILITIES).map(([key, f]) => (
                      <SelectItem key={key} value={key}>
                        {f.name} ({f.regNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[10px] text-gray-400 pl-1">{facilityInfo.address} · {facilityInfo.category}</div>
              </div>

              {/* Vehicle & Driver */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Hazmat Vehicle No.</label>
                  <Input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)}
                    placeholder="RJ-14-GA-9021" className="font-mono text-sm uppercase" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Driver Name</label>
                  <Input value={driverName} onChange={e => setDriverName(e.target.value)}
                    placeholder="Mahesh Kumar Sharma" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Hazmat License No.</label>
                <Input value={hazmatLicense} onChange={e => setHazmatLicense(e.target.value)}
                  placeholder="HAZMAT-RJ-2023-00892" className="font-mono text-sm uppercase" required />
              </div>

              {/* Pickup Window */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Pickup Window Start</label>
                  <Input type="datetime-local" value={pickupStart}
                    onChange={e => setPickupStart(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Pickup Window End</label>
                  <Input type="datetime-local" value={pickupEnd}
                    onChange={e => setPickupEnd(e.target.value)} required />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline"
                  className="text-xs border-sky-200 text-sky-700"
                  onClick={demoFill}>
                  ✨ Demo Fill
                </Button>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-md text-xs text-sky-800 space-y-1">
                <div className="font-semibold">E-WTN Contents</div>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Facility: <strong>{facilityInfo.name}</strong> (CPCB Reg: {facilityInfo.regNumber})</li>
                  <li>Waste Category: Category 4 — Expired/Condemned Pharmaceuticals (Schedule H/X)</li>
                  {selectedTag && <li>Total Net Mass: <strong>{selectedTag.weightKg} kg</strong></li>}
                </ul>
              </div>

              <Button type="submit"
                disabled={!selectedTagId || !vehicleNo || !driverName || !hazmatLicense || !pickupStart || !pickupEnd || generating}
                className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold">
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating E-WTN…</>
                  : <><ClipboardList className="w-4 h-4 mr-2" />Generate Official E-WTN Document</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ══ STEP 4: INCINERATION TEMP LOG ══════════════════════════════════ */}
        <Card className="shadow-sm border-orange-200">
          <CardHeader className="bg-orange-50/60 border-b border-orange-100">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-orange-900">
              <Thermometer className="w-4 h-4" /> Step 4 — Incineration Temperature Log
            </CardTitle>
            <CardDescription className="text-xs text-orange-700">
              CPCB dual-chamber standard: Primary ≥ <strong>850°C</strong>, Secondary ≥ <strong>1050°C</strong>.
              Certificate issuance is blocked if temperature is below standard.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleLogIncineration} className="space-y-4">

              {/* E-WTN Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">E-WTN Reference</label>
                <Select value={selectedEwtnId} onValueChange={setSelectedEwtnId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an E-WTN…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ewtns.filter(e => e.status !== "INCINERATED").map(e => (
                      <SelectItem key={e.ewtnId} value={e.ewtnId}>
                        {e.ewtnId} — {e.batchNumber} — {e.cbwtfName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Temperatures */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Primary Chamber (°C)</label>
                  <Input type="number" value={primaryTemp}
                    onChange={e => setPrimaryTemp(e.target.value)}
                    placeholder="e.g. 920" min={0} required />
                  {primaryTemp && (
                    <div className={`text-[10px] font-semibold ${tempPassPrimary ? "text-emerald-600" : "text-red-600"}`}>
                      {tempPassPrimary ? `✓ ≥ 850°C` : `✗ Below 850°C minimum`}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Secondary Chamber (°C)</label>
                  <Input type="number" value={secondaryTemp}
                    onChange={e => setSecondaryTemp(e.target.value)}
                    placeholder="e.g. 1085" min={0} required />
                  {secondaryTemp && (
                    <div className={`text-[10px] font-semibold ${tempPassSecondary ? "text-emerald-600" : "text-red-600"}`}>
                      {tempPassSecondary ? `✓ ≥ 1050°C` : `✗ Below 1050°C minimum — Certificate BLOCKED`}
                    </div>
                  )}
                </div>
              </div>

              {/* Live temp gauge */}
              {primaryTemp && secondaryTemp && (
                <div className={`p-3 rounded-lg border-2 text-xs font-semibold text-center ${tempPassPrimary && tempPassSecondary ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-red-400 bg-red-50 text-red-800"}`}>
                  {tempPassPrimary && tempPassSecondary
                    ? "🔥 Dual-chamber criteria met — Certificate issuable upon logging"
                    : "⛔ Temperature below CPCB standard — Certificate BLOCKED"}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">CBWTF Operator ID</label>
                  <Input value={operatorId} onChange={e => setOperatorId(e.target.value)}
                    placeholder="CBWTF-OP-2025-0014" className="font-mono text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Ash Disposal Waybill No.</label>
                  <Input value={ashWaybill} onChange={e => setAshWaybill(e.target.value)}
                    placeholder="ASH-WB-2025-0042" className="font-mono text-sm" required />
                </div>
              </div>

              <Button type="button" size="sm" variant="outline"
                className="text-xs border-orange-200 text-orange-700"
                onClick={demoFillIncin}>
                ✨ Demo Fill (1085°C — Passing)
              </Button>

              <Button type="submit"
                disabled={!selectedEwtnId || !primaryTemp || !secondaryTemp || !operatorId || !ashWaybill || loggingIncin}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                {loggingIncin
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Recording Log…</>
                  : <><Thermometer className="w-4 h-4 mr-2" />Record Incineration Temperature Log</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── E-WTN Document List ─────────────────────────────────────────────── */}
      {ewtns.length > 0 && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-100 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" /> E-WTN Document Register
            </CardTitle>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => getEWTNs().then(setEwtns)}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {ewtns.map(ewtn => (
                <div key={ewtn.ewtnId} className="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-sm font-bold text-gray-900">{ewtn.ewtnId}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{ewtn.cbwtfName} · {ewtn.cbwtfRegNumber}</div>
                    </div>
                    <EWTNStatusBadge status={ewtn.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    {[
                      { label: "Batch",    value: ewtn.batchNumber },
                      { label: "Vehicle",  value: ewtn.vehicleNumber },
                      { label: "Driver",   value: ewtn.driverName },
                      { label: "Hazmat License", value: ewtn.hazmatLicenseNumber },
                      { label: "Net Mass", value: `${ewtn.totalNetMassKg} kg` },
                      { label: "Pickup",   value: new Date(ewtn.scheduledPickupStart).toLocaleString() },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider">{item.label}</div>
                        <div className="font-semibold text-gray-800 font-mono truncate">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono">{ewtn.wasteCategory}</div>

                  {/* Incineration log for this EWTN */}
                  {incinerationLogs.filter(l => l.ewtnId === ewtn.ewtnId).map(log => (
                    <div key={log.logId} className={`mt-2 p-2 rounded-md border text-[10px] ${log.passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                      <div className="flex items-center gap-2 font-semibold">
                        {log.passed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-red-600" />}
                        Incineration Log: Primary {log.primaryChamberTempC}°C · Secondary {log.secondaryChamberTempC}°C
                        {log.passed ? " ✓ Passed" : " ✗ Below Standard"}
                      </div>
                      <div className="text-gray-500 mt-0.5">Ash Waybill: {log.ashDisposalWaybill} · Operator: {log.operatorId}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info panel */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
        <div className="font-bold flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-500" /> CPCB / CDSCO Incineration Standard</div>
        <ul className="list-disc list-inside space-y-0.5 text-emerald-700">
          <li>Dual-chamber incinerator: Primary combustion ≥ 850°C, Secondary combustion ≥ 1050°C (Bio-Medical Waste Rules 2016)</li>
          <li>Ash must be tested for heavy metals and disposed via authorized ash landfill (Ash Disposal Waybill required)</li>
          <li>E-WTN is an official document — vehicle number, driver hazmat license, and facility CPCB reg number are mandatory</li>
          <li>Volume Lock: Certificate can only be issued for the physically denatured quantity — phantom write-offs are mathematically impossible</li>
        </ul>
      </div>
    </div>
  )
}
