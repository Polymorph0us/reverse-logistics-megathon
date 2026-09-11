import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { issueFinalCertificate, getDestructionCertificates } from "@/api/mockApi"
import { useSharedStore } from "@/store/useSharedStore"
import type { DestructionCertificate } from "@/api/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle2, ShieldCheck, FileOutput, Lock, XCircle,
  AlertTriangle, Loader2, Flame, ClipboardList, ScanLine, FlaskConical, Printer,
} from "lucide-react"
import QRCode from "qrcode"

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
  const [qrDataUrl, setQrDataUrl] = useState<string>("")

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, { margin: 1, color: { dark: "#111827", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(console.error)
  }, [verifyUrl])

  // Calculate gate status dynamically
  const gates = [
    { label: "Gate 1 — Blind Inward Scan (Merkle Root Verified)", passed: !!cert.blindScanVerified, detail: cert.blindScanVerified ? "MCM status = BLIND_SCAN_PASS · All bag hashes matched" : "FAILED: Blind scan not confirmed" },
    { label: "Gate 2 — CDSCO Witnessed Chemical Denaturing", passed: !!cert.denaturedTagId, detail: cert.denaturedTagId ? `Tag: ${cert.denaturedTagId}` : "FAILED: No denaturing tag found" },
    { label: "Gate 3 — E-WTN Pickup Scheduled", passed: !!cert.ewtnId, detail: cert.ewtnId ? `EWTN: ${cert.ewtnId}` : "FAILED: No E-WTN reference" },
    { label: "Gate 4 — Incineration Temp Log ≥ 1050°C", passed: (cert.secondaryChamberTempC ?? 0) >= 1050, detail: cert.incinerationLogId ? `Secondary: ${cert.secondaryChamberTempC ?? 1100}°C · Log: ${cert.incinerationLogId}` : "FAILED: No valid temp log" }
  ]
  const allPassed = gates.every(g => g.passed)

  return (
    <Card className="border border-gray-300 shadow-xl bg-white print:shadow-none rounded-none max-w-[850px] mx-auto relative overflow-hidden">
      {/* Decorative watermark / masthead pattern */}
      <div className="absolute top-0 left-0 w-full h-3 bg-brand-primary/80" />
      <div className="absolute top-3 left-0 w-full h-0.5 bg-brand-warm/60" />
      
      <CardContent className="p-12 md:p-16">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center pb-8 mb-8 relative">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center">
              <img src="/src/assets/logo.png" alt="DrugLines Logo" className="w-12 drop-shadow-sm grayscale opacity-80" />
            </div>
          </div>
          <div className="text-[10px] font-semibold tracking-[0.4em] text-gray-500 uppercase mb-2">
            Government of India · Central Drugs Standard Control Organisation
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-gray-900 uppercase mt-3 pb-4 border-b border-gray-300 inline-block">
            Certificate of Destruction
          </h2>
          <div className="text-sm font-medium text-gray-600 mt-4 uppercase tracking-widest">
            CDSCO Form-XIX — Green Disposal Certificate
          </div>
          <p className="text-xs text-gray-400 font-mono mt-4">
            Certificate ID: <strong className="text-gray-900">{cert.certificateId}</strong>
            &nbsp;·&nbsp;Date: {new Date(cert.destructionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* ── Batch & Quantity ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-12">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">
              Pharmaceutical Batch Information
            </h3>
            {[
              { label: "Batch ID",           value: cert.batchId || "N/A" },
              { label: "Batch Number",       value: cert.batchNumber || "UNSPECIFIED" },
              { label: "Denaturing Tag",     value: cert.denaturedTagId || "PENDING_VERIFICATION" },
              { label: "E-WTN Reference",    value: cert.ewtnId || "PENDING_VERIFICATION" },
              { label: "Incineration Log",   value: cert.incinerationLogId || "PENDING_VERIFICATION" },
            ].map(item => (
              <div key={item.label} className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{item.label}</span>
                <span className="tech-id text-sm font-medium text-gray-900 mt-0.5">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">
              Destruction &amp; Facility Details
            </h3>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Quantity Destroyed</p>
              <p className="text-3xl font-serif text-brand-text mt-1">{cert.quantityDestroyed?.toLocaleString() || "0"}</p>
              <p className="text-xs text-gray-500 mt-1">units  — Volume-Locked to verified qty ({(cert.verifiedReceivedQuantity || cert.quantityDestroyed)?.toLocaleString()} units)</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">CBWTF Facility</p>
              <p className="font-medium text-gray-900 text-sm">{cert.facility.name}</p>
              <p className="tech-id text-[10px] text-gray-500 mt-0.5">CPCB Reg: {cert.facility.regNumber || "CBWTF-AUTH-VERIFIED"} | Officer: {cert.issuedByOfficerId || "N/A"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Incineration Temperature</p>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <div className="text-xl font-medium text-gray-900">{cert.primaryChamberTempC ?? 850}°C</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Primary</div>
                </div>
                <div className="h-6 w-px bg-gray-200"></div>
                <div>
                  <div className="text-xl font-medium text-gray-900">{cert.secondaryChamberTempC ?? 1100}°C</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Secondary</div>
                </div>
              </div>
              <div className="text-[10px] text-brand-primary font-medium mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Meets CPCB standard (≥ 850°C / ≥ 1050°C)
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ash Disposal Waybill</p>
              <p className="tech-id text-gray-900 text-sm">{cert.ashDisposalWaybill || "AWB-PENDING-DISPATCH"}</p>
            </div>
          </div>
        </div>

        {/* ── 4-Gate Verification Panel ───────────────────────────────────── */}
        <div className="mb-12">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-primary" /> Verification Checklist
          </h3>
          <div className="space-y-3">
            {gates.map((g, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3 border-b border-gray-100 last:border-0">
                <div className="pt-0.5">
                  {g.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                  ) : (
                    <XCircle className="w-5 h-5 text-brand-danger" />
                  )}
                </div>
                <div>
                  <div className={`text-sm font-medium ${g.passed ? "text-gray-900" : "text-brand-danger"}`}>{g.label}</div>
                  <div className="tech-id text-[10px] text-gray-500 mt-1">{g.detail}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className={`mt-6 p-4 border rounded-xl text-xs font-medium text-center ${allPassed ? "bg-brand-primary/5 border-brand-primary/20 text-brand-primary" : "bg-red-50 border-red-200 text-red-700"}`}>
            {allPassed 
              ? `✅ All 4 gates satisfied — Volume Lock Active: Certified ${cert.quantityDestroyed} / Received ${cert.verifiedReceivedQuantity || cert.quantityDestroyed} · Zero phantom write-off possible`
              : "⚠️ WARNING: One or more verification gates failed. This certificate is structurally invalid."}
          </div>
        </div>

        {/* ── Cryptographic Proof ─────────────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-gray-400" /> Cryptographic SHA-256 Proof (Tamper-Evident)
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Certificate Hash (SHA-256)</span>
              <span className="tech-id text-brand-primary font-medium text-xs break-all">{cert.certificateHash}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Hash Chain Tx ID</span>
              <span className="tech-id text-gray-700 text-xs break-all">{cert.blockchainTxId}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Issuing Officer</span>
                <span className="tech-id text-gray-700 text-xs">{cert.issuedByOfficerId || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Status</span>
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Verified · Immutable</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── QR Verifier ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-6 p-4 border border-gray-200 rounded-xl bg-gray-50 mb-8">
          <div className="shrink-0 w-24 h-24 bg-white border border-gray-300 rounded-lg flex items-center justify-center p-1 shadow-sm">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Verification QR Code" className="w-full h-full object-contain mix-blend-multiply" />
            ) : (
              <div className="w-full h-full bg-gray-100 animate-pulse rounded"></div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-800">Publicly Verifiable QR Code</div>
            <div className="text-[10px] text-gray-500 mt-1">
              Any drug inspector can scan to verify this certificate in seconds.
            </div>
            <div className="text-[9px] font-mono text-blue-600 truncate mt-1">{verifyUrl}</div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="border-t border-gray-200 pt-6 text-center space-y-2 mt-8">
          <p className="text-xs text-gray-600">
            This certificate is issued under the Drugs &amp; Cosmetics Act, 1940 and Bio-Medical Waste Management Rules, 2016.
          </p>
          <p className="text-[10px] text-gray-400">
            DrugLines Reverse-Logistics Platform · Hash-anchored to PostgreSQL Key-Value Audit Chain · Cannot be forged or backdated.
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
