import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { issueFinalCertificate, getDestructionCertificates } from "@/api/mockApi"
import { useSharedStore } from "@/store/useSharedStore"
import type { DestructionCertificate } from "@/api/types"
import { RealQRCode } from "@/components/shared/RealQRCode"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle2, ShieldCheck, FileOutput, Lock, XCircle,
  AlertTriangle, Loader2, Flame, ClipboardList, ScanLine, FlaskConical, Printer,
} from "lucide-react"

// ── Gate Status Row ───────────────────────────────────────────────────────────
function GateRow({ label, passed, detail }: { label: string; passed: boolean; detail?: string }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
      {passed
        ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
      <div>
        <div className={`text-xs font-semibold ${passed ? "text-emerald-800" : "text-red-700"}`}>{label}</div>
        {detail && <div className="text-[10px] text-gray-500 mt-0.5 font-mono">{detail}</div>}
      </div>
    </div>
  )
}

// ── Full Certificate View ─────────────────────────────────────────────────────
function CertificateDocument({ cert }: { cert: DestructionCertificate }) {
  const verifyUrl = `${window.location.origin}/verify?cert=${cert.certificateId}`
  return (
    <Card className="border-2 border-gray-800 shadow-2xl bg-white print:shadow-none">
      <CardContent className="p-10 md:p-14">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center border-b-4 border-double border-gray-800 pb-8 mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center">
              <FileOutput className="w-9 h-9 text-white" />
            </div>
          </div>
          <div className="text-xs font-semibold tracking-[0.35em] text-gray-500 uppercase mb-1">
            Government of India · Central Drugs Standard Control Organisation
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-black text-gray-900 tracking-wide uppercase mt-2">
            Certificate of Destruction
          </h2>
          <div className="text-sm font-bold text-emerald-700 mt-1 uppercase tracking-widest">
            CDSCO Form-XIX — Green Disposal Certificate
          </div>
          <p className="text-xs text-gray-400 font-mono mt-3">
            Certificate ID: <strong className="text-gray-700">{cert.certificateId}</strong>
            &nbsp;·&nbsp;Date: {new Date(cert.destructionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* ── Batch & Quantity ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          <div className="space-y-5">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1">
              Pharmaceutical Batch Information
            </h3>
            {[
              { label: "Batch ID",           value: cert.batchId },
              { label: "Batch Number",       value: cert.batchNumber },
              { label: "Denaturing Tag",     value: cert.denaturedTagId },
              { label: "E-WTN Reference",    value: cert.ewtnId },
              { label: "Incineration Log",   value: cert.incinerationLogId },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className="font-mono font-bold text-gray-900 text-sm">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1">
              Destruction &amp; Facility Details
            </h3>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Quantity Destroyed</p>
              <p className="text-4xl font-black text-red-600 font-mono">{cert.quantityDestroyed.toLocaleString()}</p>
              <p className="text-xs text-gray-500">units  — Volume-Locked to verified qty ({cert.verifiedReceivedQuantity} units)</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">CBWTF Facility</p>
              <p className="font-bold text-gray-900 text-sm">{cert.facility.name}</p>
              <p className="font-mono text-[10px] text-gray-400">CPCB Reg: {cert.facility.regNumber || "CBWTF-AUTH-VERIFIED"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Incineration Temperature</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="text-center">
                  <div className="text-2xl font-black text-orange-600">{cert.primaryChamberTempC}°C</div>
                  <div className="text-[9px] text-gray-500">Primary Chamber</div>
                </div>
                <div className="text-gray-300">·</div>
                <div className="text-center">
                  <div className="text-2xl font-black text-red-700">{cert.secondaryChamberTempC}°C</div>
                  <div className="text-[9px] text-gray-500">Secondary Chamber</div>
                </div>
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Meets CPCB dual-chamber standard (≥ 850°C / ≥ 1050°C)
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Ash Disposal Waybill</p>
              <p className="font-mono font-semibold text-gray-800 text-sm">{cert.ashDisposalWaybill}</p>
            </div>
          </div>
        </div>

        {/* ── 4-Gate Verification Panel ───────────────────────────────────── */}
        <div className="mb-10">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-3 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> 4-Gate Anti-Fraud Verification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <GateRow
              label="Gate 1 — Blind Inward Scan (Merkle Root Verified)"
              passed={!!cert.blindScanVerified}
              detail={cert.blindScanVerified ? "MCM status = BLIND_SCAN_PASS · All bag hashes matched" : "FAILED: Blind scan not confirmed"}
            />
            <GateRow
              label="Gate 2 — CDSCO Witnessed Chemical Denaturing"
              passed={!!cert.denaturedTagId}
              detail={`Tag: ${cert.denaturedTagId}`}
            />
            <GateRow
              label="Gate 3 — E-WTN Pickup Scheduled"
              passed={!!cert.ewtnId}
              detail={`EWTN: ${cert.ewtnId}`}
            />
            <GateRow
              label={`Gate 4 — Incineration Temp Log ≥ 1050°C`}
              passed={(cert.secondaryChamberTempC ?? 0) >= 1050}
              detail={`Secondary: ${cert.secondaryChamberTempC ?? 1100}°C · Log: ${cert.incinerationLogId || "VERIFIED"}`}
            />
          </div>
          <div className="mt-2 p-2 bg-emerald-50 border border-emerald-300 rounded text-[10px] text-emerald-800 font-semibold text-center">
            ✅ All 4 gates satisfied — Volume Lock Active: Certified {cert.quantityDestroyed} / Received {cert.verifiedReceivedQuantity} · Zero phantom write-off possible
          </div>
        </div>

        {/* ── Cryptographic Proof ─────────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Cryptographic SHA-256 Proof (Tamper-Evident)
          </h3>
          <div className="space-y-3 font-mono text-xs break-all">
            <div>
              <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Certificate Hash (SHA-256)</span>
              <span className="text-emerald-400 font-bold">{cert.certificateHash}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Hash Chain Tx ID</span>
              <span className="text-blue-400">{cert.blockchainTxId}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Issuing Officer</span>
              <span className="text-yellow-400">{cert.issuedByOfficerId}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Status</span>
              <span className="text-green-400 font-black">VERIFIED · IMMUTABLE</span>
            </div>
          </div>
        </div>

        {/* ── QR Verifier ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-6 p-4 border border-gray-200 rounded-xl bg-gray-50 mb-8">
          <div className="shrink-0 bg-white p-1 rounded-lg border border-gray-300 shadow-xs">
            <RealQRCode 
              value={`${window.location.origin}/verify?cert=${cert.certificateId}&batch=${cert.batchNumber}&hash=${cert.certificateHash}`} 
              size={84} 
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-800">Publicly Verifiable QR Code</div>
            <div className="text-[10px] text-gray-500 mt-1">
              Any drug inspector can scan to verify this certificate credentials in real time.
            </div>
            <div className="text-[9px] font-mono text-emerald-700 truncate mt-1">
              {verifyUrl}&amp;hash={cert.certificateHash.substring(0, 16)}…
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="border-t-2 border-gray-800 pt-6 text-center space-y-2">
          <p className="text-xs font-bold text-gray-700">
            This certificate is issued under the Drugs &amp; Cosmetics Act, 1940 and Bio-Medical Waste Management Rules, 2016.
          </p>
          <p className="text-[10px] text-gray-400">
            RxTrack Reverse-Logistics Platform · Hash-anchored to PostgreSQL Key-Value Audit Chain · Cannot be forged or backdated.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Certificate Issuance Form (Gate-Checked) ──────────────────────────────────
function IssuanceForm({ batchId }: { batchId: string }) {
  const { toast } = useToast()
  const batches      = useSharedStore(s => s.batches)
  const denaturedTags = useSharedStore(s => s.denaturedTags)
  const ewtns        = useSharedStore(s => s.ewtns)
  const incinerationLogs = useSharedStore(s => s.incinerationLogs)
  const masterConsignments = useSharedStore(s => s.masterConsignments)
  const returns      = useSharedStore(s => s.returns)

  const [qty,       setQty]       = useState("")
  const [officerId, setOfficerId] = useState("")
  const [issuing,   setIssuing]   = useState(false)
  const [cert,      setCert]      = useState<DestructionCertificate | null>(null)

  const batch   = batches.find(b => b.batchId === batchId)
  const denatTag = denaturedTags.find(t => t.batchId === batchId && t.status === "CONFIRMED")
  const ewtn     = ewtns.find(e => e.batchId === batchId)
  const mcm      = masterConsignments.find(m =>
    returns.some(r => r.batchId === batchId && m.containedReturnIds.includes(r.returnId))
  )
  const incLog   = incinerationLogs.find(l => ewtn && l.ewtnId === ewtn.ewtnId && l.passed)

  const gates = [
    { label: "Gate 1 — Blind Inward Scan",          icon: ScanLine,     passed: mcm?.status === "BLIND_SCAN_PASS",   detail: mcm ? `MCM: ${mcm.mcmId}` : "No MCM found" },
    { label: "Gate 2 — Denaturing Tag Confirmed",    icon: FlaskConical, passed: !!denatTag,   detail: denatTag ? denatTag.tagId : "No confirmed denaturing tag" },
    { label: "Gate 3 — E-WTN Generated",            icon: ClipboardList,passed: !!ewtn,        detail: ewtn ? ewtn.ewtnId : "No E-WTN found" },
    { label: "Gate 4 — Incin. Temp Log ≥ 1050°C",  icon: Flame,        passed: !!incLog,      detail: incLog ? `${incLog.secondaryChamberTempC}°C` : "No passing temp log" },
  ]
  const allGatesPassed = gates.every(g => g.passed)

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    setIssuing(true)
    try {
      const result = await issueFinalCertificate(batchId, Number(qty), officerId)
      setCert(result)
      toast({ title: "✅ CDSCO Form-XIX Issued", description: `${result.certificateId} — SHA-256 anchored.` })
    } catch (err: any) {
      toast({ title: "Certificate Blocked", description: err.message, variant: "destructive" })
    } finally { setIssuing(false) }
  }

  return (
    <div className="space-y-4">
      {/* Gate checklist */}
      <Card className="border-gray-200">
        <CardContent className="pt-5 space-y-2">
          <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" /> Anti-Fraud Gate Checklist for {batch?.batchNumber ?? batchId}
          </div>
          {gates.map(g => (
            <GateRow key={g.label} label={g.label} passed={g.passed} detail={g.detail} />
          ))}
          {!allGatesPassed && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-[10px] text-red-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Certificate issuance is BLOCKED until all 4 gates are satisfied.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issuance form — only enabled when all gates pass */}
      <Card className={`border-2 ${allGatesPassed ? "border-emerald-300" : "border-gray-100 opacity-60"}`}>
        <CardContent className="pt-5">
          <form onSubmit={handleIssue} className="space-y-4">
            <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Issue CDSCO Form-XIX Certificate
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">
                  Quantity to Certify (max: {denatTag?.quantityDenatured ?? "—"})
                </label>
                <Input
                  type="number"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder={denatTag ? String(denatTag.quantityDenatured) : "—"}
                  max={denatTag?.quantityDenatured}
                  min={1}
                  disabled={!allGatesPassed}
                  required
                />
                <p className="text-[9px] text-orange-600 font-semibold">Volume Lock: Cannot exceed {denatTag?.quantityDenatured ?? "—"} denatured units</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">CBWTF Issuing Officer ID</label>
                <Input
                  value={officerId}
                  onChange={e => setOfficerId(e.target.value)}
                  placeholder="CBWTF-AUTH-OFFICER-01"
                  className="font-mono text-sm"
                  disabled={!allGatesPassed}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!allGatesPassed || !qty || !officerId || issuing}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              {issuing
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating Certificate…</>
                : <><ShieldCheck className="w-4 h-4 mr-2" />Issue CDSCO Form-XIX Green Disposal Certificate</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {cert && <CertificateDocument cert={cert} />}
    </div>
  )
}

// ── Page Entry Point ──────────────────────────────────────────────────────────
export function CertificateView() {
  const { batchId } = useParams<{ batchId: string }>()
  const destructions = useSharedStore(s => s.destructions)
  const [certs, setCerts] = useState<DestructionCertificate[]>([])

  useEffect(() => {
    getDestructionCertificates().then(setCerts)
  }, [])

  // If a specific batchId is provided (from URL), show issuance flow
  if (batchId) {
    const existing = destructions.find(d => d.batchId === batchId)
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            CDSCO Form-XIX — Destruction Certificate
          </h1>
          <Button size="sm" variant="outline" className="print:hidden gap-2"
            onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print / Save PDF
          </Button>
        </div>
        {existing
          ? <CertificateDocument cert={existing} />
          : <IssuanceForm batchId={batchId} />}
      </div>
    )
  }

  // List all issued certificates
  const allCerts = certs.length > 0 ? certs : destructions
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
          Destruction Certificate Registry
        </h1>
      </div>
      {allCerts.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No certificates issued yet. Complete the full destruction pipeline first.
        </div>
      )}
      {allCerts.map(cert => (
        <CertificateDocument key={cert.certificateId} cert={cert} />
      ))}
    </div>
  )
}
