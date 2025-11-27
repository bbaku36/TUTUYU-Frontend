import { useMemo, useState } from 'react'
import {
  ADDRESS_SECTION_TITLE,
  ATTENTION_SECTION_TITLE,
  PRICE_SECTION_TITLE,
  SCHEDULE_SECTION_TITLE,
} from '../../constants.js'

export default function CustomerContentPanel({
  addressInfo,
  setAddressInfo,
  priceInfo,
  setPriceInfo,
  scheduleInfo,
  setScheduleInfo,
  attentionInfo,
  setAttentionInfo,
  scheduleImage,
  onScheduleImageChange,
  onClearScheduleImage,
  addressLines = [],
  copiedKey,
  handleCopyLine,
  onSave,
}) {
  const tabs = useMemo(
    () => [
      { id: 'address', label: ADDRESS_SECTION_TITLE },
      { id: 'price', label: PRICE_SECTION_TITLE },
      { id: 'schedule', label: SCHEDULE_SECTION_TITLE },
      { id: 'attention', label: ATTENTION_SECTION_TITLE },
    ],
    [],
  )
  const [active, setActive] = useState(tabs[0].id)
  const [imageFeedback, setImageFeedback] = useState('')

  const compressImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const maxSize = 1400
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
          const width = Math.round(img.width * scale)
          const height = Math.round(img.height * scale)
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const quality = file.type === 'image/png' ? 0.92 : 0.82
          resolve(canvas.toDataURL(file.type || 'image/jpeg', quality))
        }
        img.onerror = reject
        img.src = reader.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !onScheduleImageChange) return
    const input = event.target
    try {
      const dataUrl = await compressImage(file)
      onScheduleImageChange(dataUrl)
      setImageFeedback('Зураг сонгож нэмэгдлээ.')
      if (onSave) onSave({ scheduleImage: dataUrl })
    } catch (error) {
      console.error('Зураг боловсруулах үед алдаа', error)
      setImageFeedback('Зураг боловсруулах үед алдаа гарлаа. Дахин оролдоно уу.')
    } finally {
      if (input) input.value = ''
    }
  }

  return (
    <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row">
        <aside className="md:w-48 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                active === tab.id
                  ? 'border-[#b5654f] bg-[#ffece2] text-[#3b231f]'
                  : 'border-[#efd2bf] bg-white text-[#6f4a3b] hover:bg-[#fff7f2]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-xs opacity-60">→</span>
            </button>
          ))}
        </aside>

        <div className="flex-1 space-y-4">
          {active === 'address' && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#3b231f]">{ADDRESS_SECTION_TITLE}</p>
              <textarea
                value={addressInfo}
                onChange={(event) => setAddressInfo(event.target.value)}
                rows={6}
                className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
                placeholder="Мөр мөрөөр бичнэ үү"
              />
              {addressLines.length > 0 && (
                <div className="space-y-1 rounded-xl border border-[#f0d9c5] bg-[#fff7f2] p-2 text-xs text-[#6f4a3b]">
                  {addressLines.map((line, index) => {
                    const key = `addr-${index}`
                    return (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className="line-clamp-1">{line}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyLine(line, key)}
                          className="shrink-0 rounded-full border border-[#e2a07d] px-3 py-1 text-[11px] font-semibold text-[#b5654f]"
                        >
                          {copiedKey === key ? 'Хууллаа' : 'Copy'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {active === 'price' && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#3b231f]">{PRICE_SECTION_TITLE}</p>
              <textarea
                value={priceInfo}
                onChange={(event) => setPriceInfo(event.target.value)}
                rows={6}
                className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
                placeholder="Мөр мөрөөр бичнэ үү"
              />
            </div>
          )}

          {active === 'schedule' && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#3b231f]">{SCHEDULE_SECTION_TITLE}</p>
              <textarea
                value={scheduleInfo}
                onChange={(event) => setScheduleInfo(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
                placeholder="Цагийн хуваарь болон салбарын хаяг..."
              />
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[#e2a07d] bg-[#fff9f4] px-3 py-3">
                <div className="relative w-full max-w-[200px] overflow-hidden rounded-lg border border-[#f0d9c5] bg-white sm:max-w-[240px]">
                  {scheduleImage ? (
                    <img
                      src={scheduleImage}
                      alt={`${SCHEDULE_SECTION_TITLE} зураг`}
                      loading="lazy"
                      className="block h-24 w-full object-contain sm:h-28"
                    />
                  ) : (
                    <div className="flex h-20 items-center justify-center text-xs text-[#b27b66]">Зураг байхгүй</div>
                  )}
                </div>
                <div className="space-y-2 text-xs text-[#6f4a3b]">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e2a07d] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#b5654f]">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    Зураг нэмэх
                  </label>
                  {onClearScheduleImage && scheduleImage ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClearScheduleImage()
                        setImageFeedback('Зураг устгагдлаа.')
                        if (onSave) onSave({ scheduleImage: '' })
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-[#f0d9c5] px-3 py-1.5 text-[11px] font-semibold text-[#8d6457]"
                    >
                      Зураг устгах
                    </button>
                  ) : null}
                  <p className="text-[11px] text-[#a57163]">PNG/JPG, 2MB-аас бага зураг байвал тохиромжтой.</p>
                  {imageFeedback ? (
                    <p className="text-[11px] font-semibold text-[#b5654f]">{imageFeedback}</p>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {active === 'attention' && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#3b231f]">{ATTENTION_SECTION_TITLE}</p>
              <textarea
                value={attentionInfo}
                onChange={(event) => setAttentionInfo(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
                placeholder="Анхааруулах мэдээлэл, зөвлөмжүүд..."
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="rounded-full bg-[#CDA799] px-4 py-2 text-sm font-semibold text-white"
        >
          Мэдээлэл хадгалах
        </button>
      </div>
    </div>
  )
}
