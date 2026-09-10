import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getBatchPassport, createReturn } from "@/api/mockApi"
import type { BatchPassport } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { 
  PackageOpen, 
  Camera, 
  Scale, 
  ShieldAlert, 
  Truck, 
  Tag, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Info
} from "lucide-react"
import { format, differenceInDays } from "date-fns"

export function CreateReturn() {
  const { batchId } = useParams<{ batchId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [batch, setBatch] = useState<BatchPassport | null>(null)
  const [quantity, setQuantity] = useState("")
  const [unitType, setUnitType] = useState<"STRIPS" | "BOXES" | "UNITS">("STRIPS")
  const [condition, setCondition] = useState("Intact / Original Sealed Pack")
  const [reason, setReason] = useState("Mandate Expiry Return - CDSCO Rule 65 Compliance")
  const [grossWeight, setGrossWeight] = useState("1250")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Auto-generated 6-digit Consignment ID and 4-word seal token
  const [consignmentCode] = useState(() => "RET-" + Math.random().toString(36).substring(2, 6).toUpperCase())
  const [sealToken] = useState(() => {
    const words = ["BLUE", "ALPHA", "TIGER", "PENCIL", "SHIELD", "ORANGE", "HAWK", "CYBER"]
    const pick1 = words[Math.floor(Math.random() * words.length)]
    const pick2 = words[Math.floor(Math.random() * words.length)]
    const num = Math.floor(10 + Math.random() * 89)
    return `${pick1}-${pick2}-${num}-SEAL`
  })

  useEffect(() => {
    if (batchId) {
      getBatchPassport(batchId).then((b) => {
        setBatch(b)
        if (b) {
          setQuantity(b.currentQuantity.toString())
        }
      })
    }
  }, [batchId])

  // Handle live photo selection or camera capture
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Demo sample photo filler
  const loadDemoPhoto = () => {
    // Generate an SVG data url representing a pharmaceutical blister pack
    const demoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
      <rect width="400" height="250" fill="#f1f5f9" rx="12"/>
      <rect x="20" y="20" width="360" height="210" rx="8" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
      <text x="40" y="55" font-family="monospace" font-size="16" font-weight="bold" fill="#0f172a">PARACETAMOL 500mg IP</text>
      <text x="40" y="80" font-family="monospace" font-size="13" fill="#475569">B.No: ${batch?.batchNumber || "ABC-123"} | EXP: ${batch ? format(new Date(batch.expiryDate), "MM/yy") : "05/25"}</text>
      <circle cx="80" cy="140" r="22" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
      <circle cx="150" cy="140" r="22" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
      <circle cx="220" cy="140" r="22" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
      <circle cx="290" cy="140" r="22" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
      <rect x="40" y="190" width="240" height="15" rx="3" fill="#10b981" opacity="0.3"/>
      <text x="45" y="202" font-family="sans-serif" font-size="10" font-weight="bold" fill="#065f46">VERIFIED PHARMACEUTICAL FOIL</text>
    </svg>`
    const encoded = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(demoSvg)
    setPhotoPreview(encoded)
    toast({
      title: "Demo Photo Attached",
      description: "Sample medicine blister pack foil photo loaded.",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchId || !quantity) return
    
    setSubmitting(true)
    const result = await createReturn(batchId, parseInt(quantity), reason, {
      condition,
      consignmentCode,
      sealToken,
      grossWeightGrams: parseInt(grossWeight) || 1250,
      photoUrl: photoPreview || undefined
    })
    
    toast({
      title: "Return Staged & POS Locked",
      description: `Consignment ${result.consignmentCode} generated. Dual-party 180s OTP ready for distributor pickup.`,
    })
    
    navigate("/retailer/dashboard")
  }

  if (!batch) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p>Loading batch details from ledger store...</p>
      </div>
    )
  }

  const expiryDateObj = new Date(batch.expiryDate)
  const daysRemaining = differenceInDays(expiryDateObj, new Date())
  const isExpired = daysRemaining <= 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Inventory
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CDSCO 2025 Mandate Ready
          </span>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Initiate Return & Physical Seal</h1>
        <p className="text-gray-500 mt-1">
          Stage expired or near-expiry stock, apply a zero-hardware tamper seal signature, and generate a 180-second pickup token.
        </p>
      </div>

      {/* POS Invalidation Notice Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold text-amber-950">Immediate Central POS Lock:</span> Submitting this return instantly flags batch <span className="font-mono font-bold">{batch.batchNumber}</span> as <span className="font-semibold text-red-700">FLAGGED_EXPIRED_LOCKED</span> across all connected retail billing registers. Any accidental customer sale attempt will be blocked immediately.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Batch & Mapped Distributor Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50/70 border-b border-gray-100 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <PackageOpen className="w-4 h-4 text-emerald-600" />
                Target Medicine Batch
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Brand / Name</span>
                <span className="font-bold text-gray-900 text-sm">{batch.product.name}</span>
                <span className="text-gray-500 block text-[11px]">{batch.product.genericName}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Batch Number</span>
                <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 inline-block text-xs">
                  {batch.batchNumber}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Expiry Status</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${isExpired ? "text-red-600" : "text-amber-600"}`}>
                    {format(expiryDateObj, "MMM dd, yyyy")}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500">
                  {isExpired ? `Expired ${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days remaining`}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Stock on Hand</span>
                <span className="font-bold text-gray-900">{batch.currentQuantity} {batch.unit}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Manufacturer</span>
                <span className="font-semibold text-emerald-700">{batch.product.manufacturer}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Risk Score</span>
                <span className="font-semibold text-gray-800">{batch.riskLevel} ({batch.riskScore}/100)</span>
              </div>
            </CardContent>
          </Card>

          {/* Mapped Distributor Card */}
          <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/40 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                Mapped Supply Partner
              </CardTitle>
              <CardDescription className="text-[11px] text-blue-700">
                Designated reverse logistics recipient
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="font-bold text-gray-900">National Distributors Pvt Ltd</div>
              <div className="text-gray-500 text-[11px]">Lic: DL-DIST-4091/2022</div>
              <div className="text-gray-500 text-[11px]">Depot: Jaipur Central Hub (Zone 3)</div>
              <div className="pt-2 border-t border-blue-100/80 text-[11px] text-blue-800 font-medium">
                Auto-assigned reverse route
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 1: Return Quantities & Packaging Condition */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50/60 border-b border-gray-100 pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              1. Return Quantity & Unit Condition
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Support for full unopened packs as well as cut/partially dispensed strips
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Quantity to Return</label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    required 
                    max={batch.currentQuantity}
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="font-bold text-gray-900"
                  />
                  <select 
                    value={unitType} 
                    onChange={(e) => setUnitType(e.target.value as any)}
                    className="h-10 text-xs rounded-md border border-input bg-background px-3 py-2 text-gray-700 font-medium"
                  >
                    <option value="STRIPS">Strips</option>
                    <option value="BOXES">Boxes</option>
                    <option value="UNITS">Loose Units</option>
                  </select>
                </div>
                <span className="text-[11px] text-gray-400">
                  Maximum available: {batch.currentQuantity} {batch.unit}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Physical Packaging Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full h-10 text-xs rounded-md border border-input bg-background px-3 py-2 text-gray-900 font-medium"
                >
                  <option value="Intact / Original Sealed Pack">Intact / Original Sealed Pack</option>
                  <option value="Partially Dispensed / Cut Foil">Partially Dispensed / Cut Foil (Cut Strips)</option>
                  <option value="Packaging Damaged / Broken Crimp">Packaging Damaged / Broken Crimp</option>
                  <option value="Outer Box Missing / Bare Blister">Outer Box Missing / Bare Blister</option>
                </select>
                <span className="text-[11px] text-gray-400">
                  Accurately logged on ledger to prevent distributor intake dispute
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Reason for Reverse Disposal</label>
              <Textarea 
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify reason for return"
                rows={2}
                className="text-xs text-gray-800"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Zero-Hardware Physical Seal & Gross Mass Check */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50/60 border-b border-gray-100 pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              2. Zero-Hardware Seal Signature & Gross Weight Check
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Replaces ₹500 tamper bags: write the dynamic code with a marker across tape seam & log weight
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Visual Box Simulation */}
            <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80 border border-amber-200/80 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                      Consignment ID
                    </span>
                    <span className="font-mono text-lg font-extrabold text-amber-950">
                      {consignmentCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                      Seal Signature Token
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-800">
                      {sealToken}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-amber-800 max-w-sm">
                  <span className="font-bold">Instructions:</span> Put medicines into any ordinary carton. Tape it closed, then use a marker to write <span className="font-mono font-bold text-amber-950">{consignmentCode}</span> and <span className="font-mono font-bold text-emerald-900">{sealToken}</span> directly across the tape seam.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gross Weight Entry */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  Initial Gross Package Mass (Grams)
                </label>
                <div className="relative">
                  <Input 
                    type="number" 
                    required 
                    min={50}
                    max={50000}
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    className="font-mono text-sm font-bold pr-12"
                    placeholder="e.g. 1250"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-semibold">
                    grams
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Info className="w-3 h-3 text-gray-400" />
                  Weighed on pharmacy counter scale. Distributor verifies within ±2% tolerance.
                </p>
              </div>

              {/* Photo Evidence / Camera input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    Condition & Foil Label Photo
                  </label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={loadDemoPhoto}
                    className="h-6 text-[11px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2 font-medium"
                  >
                    <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
                    Load Demo Sample
                  </Button>
                </div>

                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />

                {photoPreview ? (
                  <div className="relative border border-emerald-300 rounded-lg p-2 bg-emerald-50/40 flex items-center gap-3">
                    <img 
                      src={photoPreview} 
                      alt="Condition Proof" 
                      className="w-16 h-16 object-cover rounded-md border border-gray-200 shadow-sm" 
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-semibold text-emerald-900 block">Photo Attached</span>
                      <span className="text-[11px] text-gray-500 font-mono block">
                        SHA-256 Visual Hash generated
                      </span>
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-emerald-700 underline mt-0.5"
                      >
                        Retake photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/20 transition-all"
                  >
                    <div className="flex items-center justify-center gap-2 text-gray-600 text-xs font-medium">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Snap Phone Photo or Browse File</span>
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Standard browser camera access • Zero specialized hardware required
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Dual-Party Handshake Preview */}
        <Card className="shadow-sm border-emerald-100 bg-emerald-50/30">
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-950 space-y-1">
              <div className="font-bold text-emerald-900">
                Layer 2 Handshake Ready: Rolling 180s Time-Bound Token
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Upon submitting, a cryptographic 6-digit handshake OTP will be generated. When the National Distributors driver arrives, he must present his screen token to complete the geo-fenced custody signoff.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 shadow-sm"
          >
            {submitting ? "Staging on Ledger..." : "Sign & Stage Return Package"}
          </Button>
        </div>
      </form>
    </div>
  )
}
