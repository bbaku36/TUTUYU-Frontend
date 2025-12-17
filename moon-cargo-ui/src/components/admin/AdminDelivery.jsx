import { deliveryStatusOptions } from './common.jsx'

export default function AdminDelivery({
  filterPhone,
  setFilterPhone,
  filterTracking,
  setFilterTracking,
  deliveryTabFilter,
  setDeliveryTabFilter,
  deliveryVisibleCount,
  deliveryGroups,
  sendGroupToDelivery,
  setDeliveryInputPhone,
  setDeliveryInputValue,
  deliveryInputPhone,
  deliveryInputValue,
  setDeliveryStatusForPhone,
  amountOf,
  formatCurrency,
  StatusChip,
}) {
  return (
    <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#a57163]">Хүргэлтэнд байгаа бараа</p>
          <h3 className="text-2xl font-semibold text-[#3b231f]">Хүргэлтийн жагсаалт (утсаар)</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-[#6f4a3b]">
          <span className="rounded-full bg-[#f5ede4] px-3 py-1">Нийт: {deliveryVisibleCount}</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          type="text"
          value={filterPhone}
          onChange={(event) => setFilterPhone(event.target.value)}
          placeholder="Утасны дугаар"
          className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
        />
        <input
          type="text"
          value={filterTracking}
          onChange={(event) => setFilterTracking(event.target.value)}
          placeholder="Баркод / Трак"
          className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
        />
        <select
          value={deliveryTabFilter}
          onChange={(event) => setDeliveryTabFilter(event.target.value)}
          className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
        >
          <option value="all">Бүгд</option>
          <option value="delivery">Хүргэлтэнд</option>
          <option value="delivered">Хүргэсэн</option>
          <option value="delayed">Хойшлуулсан</option>
          <option value="canceled">Цуцалсан</option>
        </select>
      </div>

      {deliveryGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#efd2bf] bg-white px-4 py-3 text-sm text-[#8d6457]">
          Хүргэлтэнд үлдэгдэлтэй бараа алга байна.
        </div>
      ) : (
        deliveryGroups
          .filter((group) =>
            deliveryTabFilter === 'all'
              ? true
              : group.items.some((item) => (item.deliveryStatus || 'delivery') === deliveryTabFilter),
          )
          .map((group) => (
            <div key={group.phone} className="rounded-2xl border border-[#f0d9c5] bg-white px-4 py-3 shadow-sm space-y-3">
              {(() => {
                const allDelivery = group.items.every((item) => item.location === 'delivery')
                const allDelivered = group.items.every((item) => (item.deliveryStatus || 'delivery') === 'delivered')
                const btnText = allDelivered
                  ? 'Хүргэсэн'
                  : allDelivery
                    ? 'Хүргэлт цуцлах'
                    : 'Хүргэлтэнд гаргах'
                const btnClass = allDelivered
                  ? 'border-[#0f5132] bg-[#0f5132] text-white'
                  : allDelivery
                    ? 'border-[#c92a2a] bg-[#ffecec] text-[#c92a2a]'
                    : 'border-[#0f5132] bg-[#e6f7ff] text-[#0f5132]'

                const handleDeliveryClick = () => {
                  if (allDelivered) return
                  if (allDelivery) {
                    sendGroupToDelivery(group.phone, group.address || '', 'warehouse')
                    return
                  }
                  setDeliveryInputPhone(group.phone)
                  setDeliveryInputValue(group.address || '')
                }

                return (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#3b231f]">Утас: {group.phone}</p>
                      <p className="text-xs text-[#8a6455]">Нийт: {group.items.length}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={
                          group.items.every((item) => (item.deliveryStatus || 'delivery') === (group.items[0].deliveryStatus || 'delivery'))
                            ? group.items[0].deliveryStatus || 'delivery'
                            : ''
                        }
                        onChange={(event) => {
                          const next = event.target.value
                          if (next) setDeliveryStatusForPhone(group.phone, next)
                        }}
                        className="rounded-full border border-[#efd2bf] bg-white px-3 py-2 text-xs text-[#3b231f]"
                      >
                        <option value="">Төлөв өөрчлөх</option>
                        {deliveryStatusOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleDeliveryClick}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold ${btnClass}`}
                      >
                        {btnText}
                      </button>
                    </div>
                  </div>
                )
              })()}
          <div className="text-xs text-[#3b231f]">
            <span className="font-semibold">Хаяг: </span>
            {group.address || '—'}
          </div>
          <div className="text-xs text-[#3b231f]">
            <span className="font-semibold">Нэмэлт: </span>
            {group.items.find((item) => item.deliveryNote)?.deliveryNote || '—'}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] text-left text-sm text-[#3b231f]">
              <thead className="bg-[#f8efe6] text-xs uppercase text-[#8a6455] whitespace-nowrap">
                <tr>
                  <th className="px-3 py-2">Бар код</th>
                      <th className="px-3 py-2">Үнэ</th>
                      <th className="px-3 py-2">Үлдэгдэл</th>
                      <th className="px-3 py-2">Хүргэлт</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0e1d6]">
                    {group.items.map((item) => {
                      const total = amountOf(item)
                      const paid = Number(item.paidAmount) || 0
                      const balance = Math.max(0, total - paid)
                      return (
                        <tr key={item.id}>
                          <td className="px-3 py-2">{item.tracking}</td>
                          <td className="px-3 py-2">{formatCurrency(total)}</td>
                          <td className="px-3 py-2">{formatCurrency(balance)}</td>
                          <td className="px-3 py-2">
                            <StatusChip variant={item.deliveryStatus || 'delivery'}>
                              {item.deliveryStatus === 'delivered'
                                ? 'Хүргэсэн'
                                : item.deliveryStatus === 'delayed'
                                  ? 'Хойшлуулсан'
                                  : item.deliveryStatus === 'canceled'
                                    ? 'Цуцалсан'
                                    : 'Хүргэлтэнд'}
                            </StatusChip>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
      )}
    </div>
  )
}
