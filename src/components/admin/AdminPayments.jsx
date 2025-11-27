export default function AdminPayments({
  paymentPhoneQuery,
  setPaymentPhoneQuery,
  paymentTrackingQuery,
  setPaymentTrackingQuery,
  paymentFilteredRecords,
  paymentAmounts,
  handlePaymentAmountChange,
  payCustom,
  payRemaining,
  updateRecordLocation,
  amountOf,
  formatCurrency,
  StatusChip,
  setScannerTarget,
}) {
  return (
    <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#a57163]">Төлбөр / үлдэгдэл</p>
          <h3 className="text-2xl font-semibold text-[#3b231f]">Хэрэглэгчийн төлбөр</h3>
        </div>
        <button
          type="button"
          onClick={() => setScannerTarget('records')}
          className="rounded-full border border-[#e2a07d] px-3 py-1 text-xs font-semibold text-[#b5654f]"
        >
          Камер
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          type="text"
          value={paymentPhoneQuery}
          onChange={(event) => setPaymentPhoneQuery(event.target.value)}
          placeholder="Утасны дугаар"
          className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
        />
        <input
          type="text"
          value={paymentTrackingQuery}
          onChange={(event) => setPaymentTrackingQuery(event.target.value)}
          placeholder="Баркод / Трак"
          className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
        />
        <p className="md:col-span-2 text-xs text-[#a57163]">Зөвхөн үлдэгдэлтэй бараанууд гарч ирнэ.</p>
      </div>

      <div className="mt-4 space-y-3">
        {paymentFilteredRecords.length === 0 ? (
          <p className="text-sm text-[#b27b66]">Үлдэгдэлтэй бараа олдсонгүй.</p>
        ) : (
          paymentFilteredRecords.map((record) => {
            const total = amountOf(record)
            const paid = Number(record.paidAmount) || 0
            const balance = Math.max(0, total - paid)
            return (
              <div key={record.id} className="rounded-2xl border border-[#f4decf] bg-white px-4 py-3 text-sm text-[#6f4a3b]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#3b231f]">{record.tracking}</p>
                    <p className="text-xs text-[#8d5f4c]">
                      Нийт: {formatCurrency(total)} · Төлсөн: {formatCurrency(paid)} · Үлдэгдэл:{' '}
                      <span className="font-semibold text-[#c24b34]">{formatCurrency(balance)}</span>
                    </p>
                  </div>
                  <StatusChip variant={record.status === 'paid' ? 'paid' : 'pending'}>
                    {record.status === 'paid' ? 'Төлсөн' : 'Хүлээгдэж'}
                  </StatusChip>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={paymentAmounts[record.id] ?? ''}
                    onChange={(event) => handlePaymentAmountChange(record.id, event.target.value)}
                    placeholder="Дүн"
                    className="w-24 rounded-xl border border-[#efd2bf] bg-white px-2 py-1 text-xs text-[#3b231f]"
                  />
                  <button
                    type="button"
                    onClick={() => payCustom(record)}
                    className="rounded-full border border-[#e2a07d] px-3 py-1 text-xs font-semibold text-[#b5654f]"
                  >
                    Нэмэх
                  </button>
                  <button
                    type="button"
                    onClick={() => payRemaining(record)}
                    className="rounded-full border border-[#c3a48c] px-3 py-1 text-xs font-semibold text-[#8d5f4c]"
                  >
                    Үлдэгдэл тэглэх
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRecordLocation(record.id, record.location === 'delivery' ? 'warehouse' : 'delivery')}
                    className="rounded-full border border-[#c3a48c] px-3 py-1 text-xs font-semibold text-[#8d5f4c]"
                  >
                    {record.location === 'delivery' ? 'Агуулах' : 'Хүргэлт'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
