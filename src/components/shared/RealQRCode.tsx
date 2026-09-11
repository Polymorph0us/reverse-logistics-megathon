import { useEffect, useState } from "react"
import QRCode from "qrcode"

interface RealQRCodeProps {
  value: string
  size?: number
  className?: string
  alt?: string
}

export function RealQRCode({ value, size = 120, className = "", alt = "Verification QR Code" }: RealQRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("")
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    if (!value) return
    setError(false)
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then(url => setDataUrl(url))
      .catch(err => {
        console.error("QR generation error:", err)
        setError(true)
      })
  }, [value, size])

  if (error) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-500 text-center p-1 ${className}`}
      >
        QR Unavailable
      </div>
    )
  }

  if (!dataUrl) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-gray-100 border border-gray-200 rounded animate-pulse ${className}`} 
      />
    )
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`rounded border border-gray-300 bg-white shadow-xs select-none ${className}`}
    />
  )
}
