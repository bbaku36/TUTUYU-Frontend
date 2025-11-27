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
