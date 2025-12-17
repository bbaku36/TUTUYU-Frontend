import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodeScanner({ open, onClose, onDetect }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const [error, setError] = useState('')
  const [hasResult, setHasResult] = useState(false)

  useEffect(() => {
    if (!open) {
      setError('')
      setHasResult(false)
      return
    }

    setHasResult(false)
    const reader = new BrowserMultiFormatReader()
    let handled = false

    // Try simplest potential config first
    reader.decodeFromConstraints(
      {
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      },
      videoRef.current,
      (result, err, controls) => {
        controlsRef.current = controls
        if (result && !handled) {
          handled = true
          setHasResult(true)
          controlsRef.current?.stop()
          setError('')
          onDetect?.(result.getText().trim())
          // Auto close immediately
          onClose?.()
        }
      }
    ).catch((scanError) => {
      console.error(scanError)
      if (scanError.name === 'NotAllowedError' || scanError.message.includes('Permission denied')) {
          setError('Таны төхөөрөмж камерын эрхийг хаасан байна. Browser-ийн тохиргооноос камерын эрхийг зөвшөөрнө үү.')
      } else {
          setError(scanError.message || 'Камерын эрх олдсонгүй (HTTPS холболт шаардлагатай).')
      }
    })

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop()
        controlsRef.current = null
      }
    }
  }, [open, onClose, onDetect])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 px-4">
      <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-4 text-center shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#3d241c]">Баркод уншуулах</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Хаах
          </button>
        </div>
        
        <div className="relative overflow-hidden rounded-xl bg-black aspect-[4/3] border-2 border-[#efd2bf]">
           <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover ${hasResult ? 'opacity-50' : 'opacity-100'}`}
            autoPlay
            muted
            playsInline
          />
           {!hasResult && !error && (
             <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs pointer-events-none">
               [Камер ачаалж байна...]
             </div>
           )}
        </div>

        {error ? (
           <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100">
             {error}
           </div>
        ) : hasResult ? (
          <p className="text-sm font-semibold text-green-700">Амжилттай уншлаа!</p>
        ) : (
          <p className="text-sm text-[#8d6457]">Камерыг баркод руу чиглүүлнэ үү.</p>
        )}
      </div>
    </div>
  )
}
