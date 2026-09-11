import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getBatchPassport } from "@/api/mockApi"
import type { BatchPassport, TimelineEvent } from "@/api/types"
import { VerticalTimeline } from "@/components/shared/VerticalTimeline"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RiskBadge } from "@/components/shared/RiskBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Scale, 
  ShieldCheck, 
  Clock, 
  Calendar,
  FileText,
  Award,
  FileCheck2
} from "lucide-react"
import { format } from "date-fns"

export function BatchPassportView() {
  const { batchId } = useParams<{ batchId: string }>()
  const navigate = useNavigate()
  const [batch, setBatch] = useState<BatchPassport | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [activeTab, setActiveTab] = useState<"passport" | "timeline">("passport")

  useEffect(() => {
    if (batchId) {
      getBatchPassport(batchId).then((data) => {
        setBatch(data)
        if (data?.timeline && data.timeline.length > 0) {
          setSelectedEvent(data.timeline[data.timeline.length - 1])
        }
      })
    }
  }, [batchId])

  if (!batch) return (
    <div className="p-12 text-center text-gray-500 font-medium animate-pulse">
      Loading official batch passport...
    </div>
  )

  const events = batch.timeline || []
  const selectedIndex = selectedEvent ? events.findIndex(e => e.eventId === selectedEvent.eventId) : 0

  const mfgFormatted = batch.manufacturingDate 
    ? format(new Date(batch.manufacturingDate), "dd MMM yyyy") 
    : "15 Mar 2026"
  const expFormatted = batch.expiryDate 
    ? format(new Date(batch.expiryDate), "dd MMM yyyy") 
    : "15 Aug 2026"

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header - Clicking Title toggles between Passport & Chronological Audit Trail */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer mt-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          
          <div>
            <button
              type="button"
              onClick={() => setActiveTab(prev => prev === "passport" ? "timeline" : "passport")}
              className="text-left group cursor-pointer focus:outline-hidden"
              title="Click to switch between Passport Document and Chronological Audit Trail"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 group-hover:text-emerald-800 transition-colors">
                Batch Digital Passport: <span className="font-mono text-emerald-700 underline decoration-dotted underline-offset-4">{batch.batchNumber}</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                {batch.product.name} ({batch.product.genericName}) • Manufactured by {batch.product.manufacturer}
              </p>
            </button>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("passport")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "passport"
                ? "bg-white text-emerald-900 shadow-xs border border-gray-200/80"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
            Official Passport
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "timeline"
                ? "bg-white text-emerald-900 shadow-xs border border-gray-200/80"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Audit Trail ({events.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: Real-Life Pharmaceutical Batch Passport Document */}
      {activeTab === "passport" && (
        <div className="space-y-4">
          <Card className="border-2 border-slate-700 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl overflow-hidden rounded-2xl">
            {/* Passport Header: Emblem & Official Authority */}
            <div className="p-6 border-b border-slate-700/80 bg-slate-950/60 text-center relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-7 h-7 text-amber-400" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300 font-semibold">
                Government of India • Ministry of Health &amp; Family Welfare
              </p>
              <h2 className="text-xl md:text-2xl font-serif tracking-wider font-bold text-amber-200 mt-1 uppercase">
                Official Pharmaceutical Batch Passport
              </h2>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-1">
                CENTRAL DRUGS STANDARD CONTROL ORGANISATION (CDSCO) • RULE 65 / SCHEDULE M COMPLIANT
              </p>

              <div className="absolute right-6 top-6 hidden md:block">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  AUTHENTIC DOCUMENT
                </span>
              </div>
            </div>

            {/* Passport Bio-Page Body */}
            <CardContent className="p-6 md:p-8 bg-slate-900/90 text-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Security Seal & Document Identity */}
                <div className="md:col-span-4 bg-slate-950/80 p-5 rounded-xl border border-slate-700 text-center space-y-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Passport Document ID</span>
                    <span className="font-mono text-xs font-bold text-amber-300 block mt-1 tracking-wider">
                      {batch.batchId}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Regulatory Status</span>
                    <StatusBadge status={batch.currentStatus} className="text-xs px-3 py-1 font-bold" />
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold mb-1">Risk Evaluation</span>
                    <RiskBadge level={batch.riskLevel} className="text-xs px-3 py-0.5 font-bold" />
                  </div>
                </div>

                {/* Right Column: Standard Official Passport Fields */}
                <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Batch Number / Lot ID</span>
                    <span className="font-mono text-base font-bold text-white tracking-wider">
                      {batch.batchNumber}
                    </span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Specification Code</span>
                    <span className="font-mono text-sm font-semibold text-slate-200">
                      CLASS-A / SCHEDULE-H1
                    </span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Commercial Trade Name</span>
                    <span className="text-sm font-bold text-amber-200 block">
                      {batch.product.name}
                    </span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Generic Active Formulation</span>
                    <span className="text-xs font-medium text-slate-300 block">
                      {batch.product.genericName}
                    </span>
                  </div>

                  <div className="border-b border-slate-800 pb-2 sm:col-span-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Licensed Manufacturer</span>
                    <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                      {batch.product.manufacturer}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Date of Manufacture
                    </span>
                    <span className="font-mono text-sm font-bold text-white block mt-1">
                      {mfgFormatted}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Date of Expiry
                    </span>
                    <span className="font-mono text-sm font-bold text-amber-300 block mt-1">
                      {expFormatted}
                    </span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Available Stock Volume</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono block mt-0.5">
                      {batch.currentQuantity} {batch.unit}
                      <span className="text-[11px] font-normal text-slate-400 ml-1.5">
                        (Orig: {batch.originalQuantity} {batch.unit})
                      </span>
                    </span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Current Custody Holder</span>
                    <span className="text-xs font-bold text-slate-200 block mt-0.5 truncate">
                      {batch.currentOwner.organizationName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Role: {batch.currentOwner.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Machine Readable Zone (MRZ) Passport Footer */}
              <div className="mt-8 pt-4 border-t border-slate-800 bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-amber-300/80 tracking-[0.25em] leading-relaxed break-all select-all">
                <div>P&lt;IND{batch.batchNumber.replace(/[^A-Z0-9]/g, "")}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                <div>{batch.batchId.replace(/[^A-Z0-9]/g, "")}&lt;&lt;IND{batch.product.name.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 10)}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;01</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW 2: Chronological Audit Trail with Event Inspection */}
      {activeTab === "timeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Vertical Interactive Timeline */}
          <div className="lg:col-span-5">
            <Card className="shadow-xs border-gray-200">
              <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Chronological Audit Trail
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">Click any event node to view full details</p>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {events.length} Events
                </span>
              </CardHeader>
              <CardContent className="p-3 pt-4">
                <VerticalTimeline 
                  events={events} 
                  selectedEventId={selectedEvent?.eventId}
                  onSelectEvent={(evt) => setSelectedEvent(evt)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Selected Event Inspection (Clean, Stable, with Mfg & Exp Dates) */}
          <div className="lg:col-span-7">
            {selectedEvent ? (
              <Card className="shadow-md border-gray-200 overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-emerald-500 text-white">
                      Step {selectedIndex + 1} of {events.length}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      {selectedEvent.eventId}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white tracking-wide">
                      {selectedEvent.eventType.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      {format(new Date(selectedEvent.timestamp), "EEEE, MMMM dd, yyyy • HH:mm:ss")}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-xs">
                  {/* Manufacturing Date & Expiry Date Cards (Replaces Hyperledger proof) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-emerald-50/70 rounded-lg border border-emerald-200 space-y-1">
                      <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        Manufacturing Date
                      </span>
                      <p className="text-sm font-bold font-mono text-emerald-950 mt-0.5">
                        {mfgFormatted}
                      </p>
                    </div>

                    <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-200 space-y-1">
                      <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Expiry Date
                      </span>
                      <p className="text-sm font-bold font-mono text-amber-950 mt-0.5">
                        {expFormatted}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Authorized Entity / Actor</span>
                      <span className="font-bold text-gray-900 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        {selectedEvent.actor}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px]">Physical Facility / Location</span>
                      <span className="font-medium text-gray-800 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        {selectedEvent.location || "Central Regional Hub"}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px]">Handled Quantity</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5 font-mono">
                        <Scale className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {selectedEvent.quantity ? `${selectedEvent.quantity} ${batch.unit}` : `${batch.currentQuantity} ${batch.unit}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px]">Custody Status</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                        {selectedEvent.status || "COMPLETED"}
                      </span>
                    </div>
                  </div>

                  {/* Narrative Audit Description */}
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      Audit Log Description
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {selectedEvent.eventType === "BATCH_CREATED" || selectedEvent.eventType === "BATCH_MANUFACTURED"
                        ? `Batch ${batch.batchNumber} was formally synthesized, packaged, and stamped with tamper-proof cryptographic barcodes by ${selectedEvent.actor} in compliance with GMP protocols.`
                        : selectedEvent.eventType === "DISPATCHED_TO_DISTRIBUTOR" || selectedEvent.eventType === "STOCK_RECEIVED"
                        ? `Consignment verified upon dock intake at ${selectedEvent.location || "Regional Facility"}. Package seals and gross tare mass confirmed before entry into regional supply stock.`
                        : selectedEvent.eventType === "EXPIRY_ALERT" || selectedEvent.eventType === "EXPIRY_WARNING"
                        ? `Automated 60-day reverse sentinel detected threshold crossing for expiry date (${expFormatted}). Mandatory CDSCO Rule 65 staging triggered for return handoff.`
                        : selectedEvent.eventType === "RETURN_INITIATED"
                        ? `Pharmacist initiated reverse logistics custody request. Dual-party 180s OTP handshake generated for mapped logistics driver transfer.`
                        : `Event ${selectedEvent.eventType.replace(/_/g, ' ')} recorded by ${selectedEvent.actor} at ${selectedEvent.location || "Facility"}.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                Select any event on the left to inspect its timeline flow.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
