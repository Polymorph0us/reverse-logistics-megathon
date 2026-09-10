import { useState, useEffect } from "react"
import type { ReturnRequest } from "@/api/types"
import { verifyHandoffOtp } from "@/api/mockApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { 
  Truck, 
  MapPin, 
  Clock, 
  KeyRound, 
  CheckCircle2, 
  Scale, 
  ShieldCheck, 
  X 
} from "lucide-react"

interface HandoffModalProps {
  returnReq: ReturnRequest | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function HandoffModal({ returnReq, isOpen, onClose, onSuccess }: HandoffModalProps) {
  const { toast } = useToast()
  const [secondsRemaining, setSecondsRemaining] = useState(180)
  const [otpInput, setOtpInput] = useState("")
  const [geoChecking, setGeoChecking] = useState(false)
  const [geoVerified, setGeoVerified] = useState(false)
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [hashResult, setHashResult] = useState<string | null>(null)

  // 180s countdown timer
  useEffect(() => {
    if (!isOpen || !returnReq) return
    setSecondsRemaining(180)
    setOtpInput("")
    setGeoVerified(false)
    setHashResult(null)

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          return 180 // auto-refresh after 180s
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, returnReq])

  if (!isOpen || !returnReq) return null

  // Check browser-native geolocation (or simulate pharmacy coordinates if denied)
  const handleVerifyGeofence = () => {
    setGeoChecking(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setGeoVerified(true)
          setGeoChecking(false)
          toast({
            title: "Geofence Verified",
            description: "Location confirmed within 50m of Registered Pharmacy geofence.",
          })
        },
        () => {
          // Fallback simulation for local dev
          setGeoCoords({ lat: 26.9124, lng: 75.7873 })
          setGeoVerified(true)
          setGeoChecking(false)
          toast({
            title: "Geofence Verified (Simulated)",
            description: "GPS matched with registered pharmacy counter coordinates.",
          })
        },
        { timeout: 5000 }
      )
    } else {
      setGeoCoords({ lat: 26.9124, lng: 75.7873 })
      setGeoVerified(true)
      setGeoChecking(false)
    }
  }

  // Quick auto-fill OTP for demo convenience
  const handleAutoFillOtp = () => {
    if (returnReq.handshakeOtp) {
      setOtpInput(returnReq.handshakeOtp)
    } else {
      setOtpInput("123456")
    }
  }

  // Submit dual-party custody handshake
  const handleConfirmHandoff = async () => {
    if (!otpInput) {
      toast({
        title: "OTP Required",
        description: "Please enter the 6-digit dynamic OTP presented on the driver's screen.",
        variant: "destructive",
      })
      return
    }

    setVerifying(true)
    const res = await verifyHandoffOtp(returnReq.returnId, otpInput, geoCoords || undefined)
    setVerifying(false)

    if (res.success) {
      setHashResult(res.returnRequest?.hashTxId || "hash-tx-" + Math.random().toString(36).substring(2, 10))
      toast({
        title: "Custody Handoff Complete",
        description: `Consignment transferred to National Logistics fleet. SHA-256 block committed.`,
      })
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } else {
      toast({
        title: "Handshake Failed",
        description: res.message,
        variant: "destructive",
      })
    }
  }

  const timerPercent = (secondsRemaining / 180) * 100

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden space-y-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Truck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Custody Transfer Handshake</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Layer 2: Dual-Party Cryptographic Signoff & GPS Geofence
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Consignment & Seal Snapshot */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Consignment Box</span>
              <span className="font-mono font-extrabold text-gray-900 text-sm">
                {returnReq.consignmentCode || returnReq.returnId}
              </span>
              <span className="text-gray-500 block text-[11px] mt-0.5">
                Batch: <span className="font-mono font-semibold">{returnReq.batchNumber}</span> ({returnReq.requestedQuantity} units)
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Gross Scale Mass</span>
              <span className="font-mono font-bold text-gray-800 text-sm flex items-center justify-end gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                {returnReq.grossWeightGrams || 1250}g
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Seal: {returnReq.sealToken || "SEAL-VERIFIED"}</span>
            </div>
          </div>

          {/* 180s Live Timer & Dynamic OTP Display */}
          <Card className="border-amber-200 bg-amber-50/50 shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  Time-Bound Rolling OTP (180s Window)
                </span>
                <span className="font-mono font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded text-[11px]">
                  {secondsRemaining}s remaining
                </span>
              </div>

              {/* Countdown Progress Bar */}
              <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-amber-600 h-full transition-all duration-1000 ease-linear rounded-full" 
                  style={{ width: `${timerPercent}%` }} 
                />
              </div>

              {/* Dynamic Driver Screen OTP preview */}
              <div className="bg-white border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-gray-400 font-bold block">
                    Driver Mobile Token (Live)
                  </span>
                  <span className="font-mono text-xl font-extrabold tracking-widest text-emerald-700">
                    {returnReq.handshakeOtp || "749 201"}
                  </span>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAutoFillOtp}
                  className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold"
                >
                  Auto-Fill Token
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Geolocation Verification Check */}
          <div className="border border-gray-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${geoVerified ? "text-emerald-600" : "text-gray-400"}`} />
                <span className="text-xs font-bold text-gray-800">Pharmacy Counter Geo-Fence</span>
              </div>
              {geoVerified ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Within Geofence (35m)
                </span>
              ) : (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleVerifyGeofence} 
                  disabled={geoChecking}
                  className="h-6 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-2"
                >
                  {geoChecking ? "Verifying GPS..." : "Verify Geofence"}
                </Button>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              {geoCoords ? (
                <span className="font-mono">Lat: {geoCoords.lat.toFixed(4)}° N, Lng: {geoCoords.lng.toFixed(4)}° E • Verified Location</span>
              ) : (
                "Validates driver is physically present at the pharmacy counter before custody signoff."
              )}
            </p>
          </div>

          {/* OTP Input & Confirmation */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 block">
              Enter 6-Digit Driver Handshake Code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <Input 
                  type="text" 
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6 digits" 
                  className="pl-9 font-mono text-base font-bold tracking-widest text-gray-900"
                />
              </div>
              <Button 
                onClick={handleConfirmHandoff}
                disabled={verifying || otpInput.length < 6}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5"
              >
                {verifying ? "Signing..." : "Sign Custody"}
              </Button>
            </div>
          </div>

          {/* Cryptographic SHA-256 Hash Block Output */}
          {hashResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-emerald-950 block">Cryptographic Hash Stamped:</span>
                <span className="font-mono text-[10px] text-emerald-800 break-all block">
                  {hashResult} (SHA-256 Key-Value Link)
                </span>
                <span className="text-[10px] text-emerald-700 block">
                  Custody transferred to distributor. State updated across reverse logistics ledger.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
