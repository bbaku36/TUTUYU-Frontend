export default function AdminList({
  filterPhone,
  setFilterPhone,
  filterTracking,
  setFilterTracking,
  paymentGroupAmounts,
  setPaymentGroupAmounts,
  payCustomForPhone,
  payAllForPhone,
  unpayAllForPhone,
  phoneGroups,
  phoneGroupsPage,
  visiblePage,
  setVisiblePage,
  phoneGroupPageCount,
  deliveryInputPhone,
  deliveryInputValue,
  setDeliveryInputPhone,
  setDeliveryInputValue,
  deliveryGroupAddresses,
  setDeliveryGroupAddresses,
  sendGroupToDelivery,
  revertDeliveryForPhone,
  setDeliveryStatusForPhone,
  deleteShipment,
  amountOf,
  formatCurrency,
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

      <div className="space-y-4">
        <p className="text-sm font-semibold text-[#3b231f]">Утас бүрээр бүлэглэсэн</p>
        {phoneGroups.length === 0 ? (
          <p className="text-sm text-[#9b6b58]">Өгөгдөл алга.</p>
        ) : (
          phoneGroupsPage.map((group) => (
            <div key={group.phone} className="rounded-2xl border border-[#f0d9c5] bg-white px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#3b231f]">Утас: {group.phone}</p>
                  <p className="text-xs text-[#8a6455]">
                    Нийт: {group.items.length} · Үлдэгдэл: {formatCurrency(group.balance)}
                  </p>
                  <p className="text-xs text-[#8a6455]">PIN: {group.pin || '—'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={paymentGroupAmounts[group.phone] ?? ''}
                    onChange={(event) => setPaymentGroupAmounts((prev) => ({ ...prev, [group.phone]: event.target.value }))}
                    placeholder="Дүн"
                    className="w-28 rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-xs text-[#3b231f]"
                  />
                  <button
                    type="button"
                    onClick={() => payCustomForPhone(group.phone)}
                    className="rounded-full border border-[#e2a07d] bg-[#fff7f2] px-4 py-2 text-xs font-semibold text-[#b5654f]"
                  >
                    Дүн нэмэх
                  </button>
                  {(() => {
                    const hasBalance = group.balance > 0
                    
                    if (hasBalance) {
                      return (
                        <button
                          type="button"
                          onClick={() => payAllForPhone(group.phone)}
                          className="rounded-full border border-[#e2a07d] bg-[#fff7f2] px-4 py-2 text-xs font-semibold text-[#b5654f]"
                        >
                          Бүгдийг төлсөн болгох
                        </button>
                      )
                    } else {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Энэ утасны бүх төлбөрийг буцааж төлөгдөөгүй болгох уу?')) {
                              unpayAllForPhone(group.phone)
                            }
                          }}
                          className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Төлбөр буцаах
                        </button>
                      )
                    }
                  })()}
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

                    const handleClick = () => {
                      if (allDelivered) return
                      if (allDelivery) {
                        sendGroupToDelivery(group.phone, group.address || '', 'warehouse')
                        return
                      }
                      setDeliveryInputPhone(group.phone)
                      setDeliveryInputValue(group.address || '')
                    }

                    return (
                      <>
                      <button
                        type="button"
                        onClick={handleClick}
                        disabled={allDelivered}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold ${btnClass} ${
                          allDelivered ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                      >
                        {btnText}
                      </button>
                      {allDelivered && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`${group.phone} дугаарын хүргэлтийг буцаах уу?`)) {
                              revertDeliveryForPhone(group.phone)
                            }
                          }}
                          className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-100"
                        >
                          Олгогдсон бараа буцаах
                        </button>
                      )}
                    </>
                    )
                  })()}
                  {(() => {
                    const handed = group.items.every((item) => (item.deliveryStatus || 'delivery') === 'delivered')
                    return (
                      <button
                        type="button"
                        disabled={handed}
                        onClick={() => {
                          if (!handed) setDeliveryStatusForPhone(group.phone, 'delivered')
                        }}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                          handed
                            ? 'border-[#94a3b8] bg-[#e2e8f0] text-[#475569] cursor-not-allowed'
                            : 'border-[#0f5132] bg-[#0f5132] text-white'
                        }`}
                      >
                        {handed ? 'Бараа олгогдсон' : 'Бараа олгох'}
                      </button>
                    )
                  })()}
                </div>
              </div>

              {deliveryInputPhone === group.phone && !group.items.every((item) => item.location === 'delivery') && (
                <form
                  className="mt-2 flex flex-wrap items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    sendGroupToDelivery(group.phone, deliveryInputValue)
                  }}
                >
                  <input
                    type="text"
                    value={deliveryInputValue}
                    onChange={(event) => {
                      const value = event.target.value
                      setDeliveryInputValue(value)
                      setDeliveryGroupAddresses((prev) => ({ ...prev, [group.phone]: value }))
                    }}
                    className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
                    placeholder="Хүргэлтийн хаяг оруулах"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="rounded-full border border-[#0f5132] bg-[#0f5132] px-4 py-2 text-xs font-semibold text-white"
                    >
                      Хүргэлтэнд гаргах
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryInputPhone('')
                        setDeliveryInputValue('')
                      }}
                      className="rounded-full border border-[#efd2bf] px-4 py-2 text-xs font-semibold text-[#b5654f]"
                    >
                      Болих
                    </button>
                  </div>
                </form>
              )}

              <div className="text-xs text-[#3b231f]">
                <span className="font-semibold">Хаяг: </span>
                {group.items.find((it) => it.deliveryAddress)?.deliveryAddress ||
                  deliveryGroupAddresses[group.phone] ||
                  '—'}
              </div>
              <div className="text-xs text-[#3b231f] mt-1">
                <span className="font-semibold">Нэмэлт: </span>
                {group.items.find((it) => it.deliveryNote)?.deliveryNote || '—'}
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="min-w-[720px] text-left text-sm text-[#3b231f]">
                  <thead className="bg-[#f8efe6] text-xs uppercase text-[#8a6455] whitespace-nowrap">
                    <tr>
                      <th className="px-3 py-2">Бар код</th>
                      <th className="px-3 py-2">Үнэ</th>
                      <th className="px-3 py-2">Төлсөн</th>
                      <th className="px-3 py-2">Үлдэгдэл</th>
                      <th className="px-3 py-2">Үйлдэл</th>
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
                          <td className="px-3 py-2">{formatCurrency(paid)}</td>
                          <td className="px-3 py-2">{formatCurrency(balance)}</td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => deleteShipment(item.id, item.tracking)}
                              className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                              title="Устгах"
                            >
                              🗑️
                            </button>
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
      {phoneGroups.length > 0 && phoneGroups.length > phoneGroupsPage.length && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#6f4a3b]">
          <p>
            Хуудас {visiblePage} / {phoneGroupPageCount}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisiblePage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-[#efd2bf] px-3 py-1 text-xs font-semibold text-[#3b231f] disabled:opacity-50"
              disabled={visiblePage === 1}
            >
              Өмнөх
            </button>
            <button
              type="button"
              onClick={() => setVisiblePage((p) => Math.min(phoneGroupPageCount, p + 1))}
              className="rounded-full border border-[#efd2bf] px-3 py-1 text-xs font-semibold text-[#3b231f] disabled:opacity-50"
              disabled={visiblePage === phoneGroupPageCount}
            >
              Дараах
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
