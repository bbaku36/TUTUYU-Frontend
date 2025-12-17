export default function AdminDocuments({
  filterPhone,
  setFilterPhone,
  filterTracking,
  setFilterTracking,
  documentTotals,
  documentPageRecords,
  documentRecords,
  documentPage,
  documentPageCount,
  documentPageSize,
  setDocumentPage,
  formatCurrency,
  formatDate,
  StatusChip,
  deliveryStatusOptions,
  handleDeliveryChange,
  updateRecordStatus,
  payRemaining,
  amountOf,
  onOpenPayments,
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-xs text-[#7d4b3a]">
          Утас
          <input
            type="text"
            value={filterPhone}
            onChange={(event) => setFilterPhone(event.target.value)}
            placeholder="+976..."
            className="mt-1 w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
          />
        </label>
        <label className="text-xs text-[#7d4b3a]">
          Баркод / Трак
          <input
            type="text"
            value={filterTracking}
            onChange={(event) => setFilterTracking(event.target.value)}
            placeholder="MC-000000"
            className="mt-1 w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
          />
        </label>
        <div className="flex items-end justify-end">
          <button
            type="button"
            onClick={() => {
              setFilterPhone('')
              setFilterTracking('')
            }}
            className="rounded-xl border border-[#efd2bf] px-4 py-2 text-sm font-semibold text-[#b5654f]"
          >
            Шүүлт цэвэрлэх
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#a57163]">Барааны жагсаалт</p>
            <h3 className="text-2xl font-semibold text-[#3b231f]">Баримтууд</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-[#6f4a3b]">
            <span className="rounded-full bg-[#f5ede4] px-3 py-1">Нийт: {documentTotals.count}</span>
            <span className="rounded-full bg-[#e7f7ef] px-3 py-1">
              Үлдэгдэл: {formatCurrency(documentTotals.balance)}
            </span>
            <button
              type="button"
              onClick={onOpenPayments}
              className="rounded-full border border-[#e2a07d] bg-[#fff7f2] px-4 py-2 text-sm font-semibold text-[#b5654f]"
            >
              Төлбөрийн үлдэгдэл
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#f0d9c5]">
          <table className="min-w-[960px] text-left text-sm text-[#3b231f]">
            <thead className="bg-[#f8efe6] text-xs uppercase text-[#8a6455] whitespace-nowrap">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Бар код</th>
                <th className="px-3 py-2">Утас</th>
                <th className="px-3 py-2">Огноо</th>
                <th className="px-3 py-2">Тоо</th>
                <th className="px-3 py-2">Үнэ</th>
                <th className="px-3 py-2">Төлсөн</th>
                <th className="px-3 py-2">Үлдэгдэл</th>
                <th className="px-3 py-2">Төлөв</th>
                <th className="px-3 py-2">Байршил</th>
                <th className="px-3 py-2">Хүргэлт</th>
                <th className="w-40 px-3 py-2">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e1d6] bg-white">
              {documentRecords.length === 0 && (
                <tr>
                  <td colSpan="11" className="px-3 py-3 text-center text-[#9b6b58]">
                    Өгөгдөл алга.
                  </td>
                </tr>
              )}
              {documentPageRecords.map((record, index) => {
                const total = amountOf(record)
                const paid = Number(record.paidAmount) || 0
                const balance = Math.max(0, total - paid)
                const isPaid = balance <= 0
                return (
                  <tr key={record.id} className="hover:bg-[#fdf7f2]">
                    <td className="px-3 py-2 text-xs text-[#8a6455] whitespace-nowrap">
                      {(documentPage - 1) * documentPageSize + index + 1}
                    </td>
                    <td className="px-3 py-2 font-semibold whitespace-nowrap">{record.tracking}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{record.phone || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(record.arrivalDate)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{record.quantity || 1}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(total)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(paid)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(balance)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <StatusChip variant={isPaid ? 'paid' : 'pending'}>{isPaid ? 'Төлсөн' : 'Төлөөгүй'}</StatusChip>
                    </td>
                    <td className="px-3 py-2 text-xs text-[#8d5f4c] whitespace-nowrap">{record.location || '—'}</td>
                    <td className="px-3 py-2 whitespace-normal">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip variant={record.deliveryStatus || record.status || 'delivery'}>
                          {record.deliveryStatus === 'delivered'
                            ? 'Хүргэсэн'
                            : record.deliveryStatus === 'delayed'
                              ? 'Хойшлуулсан'
                              : record.deliveryStatus === 'canceled'
                                ? 'Цуцалсан'
                                : record.location === 'delivery'
                                  ? 'Хүргэлтэнд'
                                  : '—'}
                        </StatusChip>
                        <select
                          value={
                            record.location === 'warehouse'
                              ? 'warehouse'
                              : deliveryStatusOptions.find((d) => d.id === record.deliveryStatus)?.id || 'delivery'
                          }
                          onChange={(event) => handleDeliveryChange(record, event.target.value)}
                          className="rounded-xl border border-[#efd2bf] bg-white px-2 py-1 text-xs text-[#3b231f]"
                        >
                          {deliveryStatusOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="w-40 px-3 py-2 space-y-2 whitespace-normal align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            record.status === 'paid' ? updateRecordStatus(record.id, 'pending') : payRemaining(record)
                          }
                          className="rounded-full border border-[#e2a07d] px-2.5 py-1 text-[11px] font-semibold text-[#b5654f]"
                        >
                          {record.status === 'paid' ? 'Буцаах' : 'Төлсөн болгох'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {documentRecords.length > documentPageSize && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[#6f4a3b]">
            <p>
              Хуудас {documentPage} / {documentPageCount}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDocumentPage((p) => Math.max(1, p - 1))}
                className="rounded-full border border-[#efd2bf] px-3 py-1 text-xs font-semibold text-[#3b231f] disabled:opacity-50"
                disabled={documentPage === 1}
              >
                Өмнөх
              </button>
              <button
                type="button"
                onClick={() => setDocumentPage((p) => Math.min(documentPageCount, p + 1))}
                className="rounded-full border border-[#efd2bf] px-3 py-1 text-xs font-semibold text-[#3b231f] disabled:opacity-50"
                disabled={documentPage === documentPageCount}
              >
                Дараах
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
