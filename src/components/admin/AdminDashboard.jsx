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
