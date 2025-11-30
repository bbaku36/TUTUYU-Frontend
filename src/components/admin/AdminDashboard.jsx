import { useState } from 'react'
import { lookupPin } from '../../api.js'
import CustomerContentPanel from './CustomerContentPanel.jsx'

export default function AdminDashboard({
  analytics,
  addressInfo,
  setAddressInfo,
  priceInfo,
  setPriceInfo,
  scheduleInfo,
  setScheduleInfo,
  scheduleImage,
  onScheduleImageChange,
  onClearScheduleImage,
  heroImage,
  setHeroImage,
  heroBackground,
  setHeroBackground,
  attentionInfo,
  setAttentionInfo,
  addressLines,
  copiedKey,
  handleCopyLine,
  handleCustomerContentSave,
  formatCurrency,
}) {
  const [pinPhone, setPinPhone] = useState('')
  const [pinResult, setPinResult] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [heroFeedback, setHeroFeedback] = useState('')

  const handlePinLookup = async (event) => {
    event.preventDefault()
    setPinError('')
    setPinResult('')
    const phone = pinPhone.trim()
    const normalized = phone.replace(/\D+/g, '')
    if (!normalized) {
      setPinError('Утасны дугаарыг зөв оруулна уу.')
      return
    }
    setPinLoading(true)
    try {
      const res = await lookupPin(normalized)
      if (res?.pin) {
        setPinResult(`PIN: ${res.pin} (${res.phone})`)
      } else {
        setPinError('PIN олдсонгүй. Сервер дээр PIN_SECRET тохирсон эсэхийг шалгана уу.')
      }
    } catch (error) {
      console.error('PIN лавлахад алдаа', error)
      setPinError(`PIN лавлахад алдаа гарлаа: ${error.message || ''}`)
    } finally {
      setPinLoading(false)
    }
  }

  const compressImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const maxEdge = 1800
          const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
          const width = Math.round(img.width * scale)
          const height = Math.round(img.height * scale)
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const isPng = file.type === 'image/png'
          const quality = isPng ? 0.92 : 0.88
          resolve(canvas.toDataURL(file.type || 'image/jpeg', quality))
        }
        img.onerror = reject
        img.src = reader.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleHeroUpload = async (event, target) => {
    const file = event.target.files?.[0]
    if (!file) return
    const input = event.target
    try {
      const dataUrl = await compressImage(file)
      if (target === 'main') {
        setHeroImage(dataUrl)
        setHeroFeedback('Нүүрний зураг шинэчлэгдлээ.')
        if (handleCustomerContentSave) handleCustomerContentSave({ heroImage: dataUrl })
      } else {
        setHeroBackground(dataUrl)
        setHeroFeedback('Дэвсгэр зураг шинэчлэгдлээ.')
        if (handleCustomerContentSave) handleCustomerContentSave({ heroBackground: dataUrl })
      }
    } catch (error) {
      console.error('Зураг шахахад алдаа', error)
      setHeroFeedback('Зураг боловсруулах үед алдаа гарлаа. Дахин оруулж үзнэ үү.')
    } finally {
      if (input) input.value = ''
    }
  }

  const handleHeroClear = (target) => {
    if (target === 'main') {
      setHeroImage('')
      if (handleCustomerContentSave) handleCustomerContentSave({ heroImage: '' })
      setHeroFeedback('Нүүрний зураг устгагдлаа.')
    } else {
      setHeroBackground('')
      if (handleCustomerContentSave) handleCustomerContentSave({ heroBackground: '' })
      setHeroFeedback('Дэвсгэр зураг устгагдлаа.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm">
          <p className="text-xs text-[#b27b66] uppercase">Агуулахад</p>
          <p className="mt-2 text-3xl font-semibold text-[#3b231f]">{analytics.warehouseCount}</p>
          <p className="text-sm text-[#8a6455]">байршил: агуулах</p>
        </div>
        <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm">
          <p className="text-xs text-[#b27b66] uppercase">Хүргэлтэнд</p>
          <p className="mt-2 text-3xl font-semibold text-[#3b231f]">{analytics.deliveryCount}</p>
          <p className="text-sm text-[#8a6455]">байршил: хүргэлт</p>
        </div>
        <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm">
          <p className="text-xs text-[#b27b66] uppercase">Үлдэгдэл</p>
          <p className="mt-2 text-3xl font-semibold text-[#3b231f]">{formatCurrency(analytics.balance)}</p>
          <p className="text-sm text-[#8a6455]">Нийт үлдэгдэл төлбөр</p>
        </div>
        <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm">
          <p className="text-xs text-[#b27b66] uppercase">Энэ сар</p>
          <p className="mt-2 text-3xl font-semibold text-[#3b231f]">
            {analytics.days.reduce((sum, [, count]) => sum + count, 0)}
          </p>
          <p className="text-sm text-[#8a6455]">Буусан ачааны тоо</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm space-y-3">
        <h3 className="text-base font-semibold text-[#3b231f]">PIN лавлах</h3>
        <form className="flex flex-wrap items-center gap-2" onSubmit={handlePinLookup}>
          <input
            type="tel"
            value={pinPhone}
            onChange={(event) => setPinPhone(event.target.value)}
            placeholder="Утасны дугаар..."
            className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f] md:w-64"
          />
          <button
            type="submit"
            disabled={pinLoading}
            className="rounded-full border border-[#b5654f] bg-gradient-to-r from-[#b5654f] to-[#e2a07d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pinLoading ? 'Лавлаж байна...' : 'PIN харуулах'}
          </button>
        </form>
        {pinResult ? (
          <div className="rounded-xl border border-[#cde7da] bg-[#f3fbf6] px-3 py-2 text-sm font-semibold text-[#2f8552]">
            {pinResult}
          </div>
        ) : null}
        {pinError ? (
          <div className="rounded-xl border border-[#f7c8c8] bg-[#fff2f2] px-3 py-2 text-sm font-semibold text-[#b42318]">
            {pinError}
          </div>
        ) : null}
        <p className="text-xs text-[#8a6455]">
          Утасны дугаарт тохирох 4 оронтой PIN-ийг эндээс хурдан лавлана. Байхгүй бол автоматаар үүсгээд харуулна.
        </p>
      </div>

      <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[#3b231f]">Нүүрний зургууд</h3>
          <p className="text-xs text-[#8a6455]">1800px дотор шахаж хадгална (чанар алдагдахгүй).</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-[#efd2bf] bg-[#fff9f4] p-3">
            <p className="text-sm font-semibold text-[#3b231f]">Гол зураг</p>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#f0d9c5] bg-white">
              {heroImage ? (
                <img src={heroImage} alt="Нүүрний зураг" className="h-full w-full object-contain" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#b27b66]">Зураг байхгүй</div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[#6f4a3b]">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e2a07d] bg-white px-3 py-1.5 font-semibold text-[#b5654f]">
                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleHeroUpload(event, 'main')} />
                Зураг сонгох
              </label>
              {heroImage ? (
                <button
                  type="button"
                  onClick={() => handleHeroClear('main')}
                  className="rounded-full border border-[#f0d9c5] px-3 py-1.5 font-semibold text-[#8d6457]"
                >
                  Цэвэрлэх
                </button>
              ) : null}
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-[#efd2bf] bg-[#fff9f4] p-3">
            <p className="text-sm font-semibold text-[#3b231f]">Дэвсгэр зураг</p>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#f0d9c5] bg-white">
              {heroBackground ? (
                <img src={heroBackground} alt="Дэвсгэр зураг" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#b27b66]">Зураг байхгүй</div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[#6f4a3b]">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e2a07d] bg-white px-3 py-1.5 font-semibold text-[#b5654f]">
                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleHeroUpload(event, 'bg')} />
                Зураг сонгох
              </label>
              {heroBackground ? (
                <button
                  type="button"
                  onClick={() => handleHeroClear('bg')}
                  className="rounded-full border border-[#f0d9c5] px-3 py-1.5 font-semibold text-[#8d6457]"
                >
                  Цэвэрлэх
                </button>
              ) : null}
            </div>
          </div>
        </div>
        {heroFeedback ? (
          <p className="text-xs font-semibold text-[#b5654f]">{heroFeedback}</p>
        ) : (
          <p className="text-xs text-[#8a6455]">JPG/PNG, web-д ээлтэй шахалттайгаар хадгална.</p>
        )}
      </div>

      <CustomerContentPanel
        addressInfo={addressInfo}
        setAddressInfo={setAddressInfo}
        priceInfo={priceInfo}
        setPriceInfo={setPriceInfo}
        scheduleInfo={scheduleInfo}
        setScheduleInfo={setScheduleInfo}
        scheduleImage={scheduleImage}
        onScheduleImageChange={onScheduleImageChange}
        onClearScheduleImage={onClearScheduleImage}
        attentionInfo={attentionInfo}
        setAttentionInfo={setAttentionInfo}
        addressLines={addressLines}
        copiedKey={copiedKey}
        handleCopyLine={handleCopyLine}
        onSave={handleCustomerContentSave}
      />

      <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm">
        <h3 className="text-base font-semibold text-[#3b231f]">Энэ сарын өдрүүд</h3>
        {analytics.days.length === 0 ? (
          <p className="mt-2 text-sm text-[#9b6b58]">Энэ сарын буусан барааны бүртгэл алга.</p>
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {analytics.days.map(([day, count]) => (
              <div
                key={day}
                className="flex items-center justify-between rounded-xl border border-[#f0d9c5] bg-white px-3 py-2 text-sm text-[#3b231f]"
              >
                <span className="font-semibold">{day}</span>
                <span className="rounded-full bg-[#f5ede4] px-3 py-1 text-xs">{count} ш</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
