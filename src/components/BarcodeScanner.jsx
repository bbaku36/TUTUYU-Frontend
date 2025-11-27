import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodeScanner({ open, onClose, onDetect }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setError('')
      return
    }

    const reader = new BrowserMultiFormatReader()
    reader
      .decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        (result, err, controls) => {
          controlsRef.current = controls
          if (result) {
            onDetect?.(result.getText().trim())
            onClose?.()
          }
          if (err && !(err.name === 'NotFoundException')) {
            setError(err.message || 'Танигдсангүй. Эхлээд дахин ойртуулж үзнэ үү.')
          }
        },
      )
      .catch((scanError) => {
        setError(scanError.message || 'Камерын эрх олдсонгүй.')
      })

    return () => {
      controlsRef.current?.stop()
      controlsRef.current = null
      reader.reset()
    }
  }, [open, onClose, onDetect])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md space-y-3 rounded-3xl bg-white/95 p-4 text-center text-[#3b231f] shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Камерын сканнер</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#efd2bf] px-3 py-1 text-xs font-semibold text-[#b5654f]"
          >
            Хаах
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#efd2bf] bg-black">
          <video ref={videoRef} className="h-64 w-full object-contain" autoPlay muted playsInline />
        </div>
        {error && <p className="text-xs text-[#c24b34]">{error}</p>}
        <p className="text-xs text-[#7b5447]">Баркодыг төвд тааруулж, амжилттай уншсны дараа камер автоматаар унтарна.</p>
      </div>
    </div>
  )
}
