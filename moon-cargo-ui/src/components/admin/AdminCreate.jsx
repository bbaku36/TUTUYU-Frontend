export default function AdminCreate({
  formData,
  handleFormChange,
  handleFormSubmit,
  autoFillTracking,
  setAutoFillTracking,
  setScannerTarget,
  toast,
}) {
  return (
    <div className="rounded-2xl border border-[#f0d9c5] bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify_between">
        <h3 className="text-xl font-semibold">Бараа бүртгэх</h3>
        <span className="text-xs text-[#a57163]">{toast || 'Нэмэх, төлөв хадгалах'}</span>
      </div>
      <form className="mt-4 space-y-4" onSubmit={handleFormSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-[#7d4b3a]">
            Утас
            <input
              type="tel"
              value={formData.phone}
              onChange={handleFormChange('phone')}
              placeholder="+976 9911-7788"
              className="mt-2 w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-base text-[#3b231f]"
            />
          </label>
          <label className="text-sm text-[#7d4b3a]">
            <span className="mb-1 flex flex-wrap items-center justify-between gap-3">
              Трак / Barcode
              <span className="flex items-center gap-2 text-xs text-[#b27b66]">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={autoFillTracking} onChange={(event) => setAutoFillTracking(event.target.checked)} />
                  Скан шууд бөглөнө
                </label>
                <button
                  type="button"
                  onClick={() => setScannerTarget('form')}
                  className="rounded-full border border-[#e2a07d] px-3 py-1 text-[11px] font-semibold text-[#b5654f]"
                >
                  Камер
                </button>
              </span>
            </span>
            <input
              type="text"
              value={formData.tracking}
              onChange={handleFormChange('tracking')}
              placeholder="MC-000123"
              className="mt-2 w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-base uppercase text-[#3b231f]"
            />
          </label>
          <label className="text-sm text-[#7d4b3a]">
            Салбар / Байршил
            <input
              type="text"
              value={formData.location}
              onChange={handleFormChange('location')}
              placeholder="УБ, СБД ... эсвэл салбарын нэр"
              className="mt-2 w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-base text-[#3b231f]"
            />
          </label>
          <label className="text-sm text-[#7d4b3a]">
            Жин (кг)
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.weight}
              onChange={handleFormChange('weight')}
              placeholder="0.00"
              className="mt-2 w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-base text-[#3b231f]"
            />
          </label>
          <label className="text-sm text-[#7d4b3a]">
            Карго үнэ / ₮
            <input
              type="number"
              step="any"
              value={formData.declared}
              onChange={handleFormChange('declared')}
              placeholder="150000"
              className="mt-2 w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-base text-[#3b231f]"
            />
          </label>
          <label className="text-sm text-[#7d4b3a]">
            Тоо ширхэг
            <input
              type="number"
              min="1"
              step="1"
              value={formData.quantity}
              onChange={handleFormChange('quantity')}
              className="mt-2 w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-base text-[#3b231f]"
            />
          </label>
          <label className="text-sm text-[#7d4b3a]">
            Ирсэн огноо
            <input
              type="date"
              value={formData.arrivalDate}
              onChange={handleFormChange('arrivalDate')}
              className="mt-2 w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-base text-[#3b231f]"
            />
          </label>
          <label className="text-sm text-[#7d4b3a]">
            Метр куб
            <input
              type="number"
              min="0"
              step="0.001"
              value={formData.cubic}
              onChange={handleFormChange('cubic')}
              placeholder="0.000"
              className="mt-2 w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-base text-[#3b231f]"
            />
          </label>
          {formData.location === 'delivery' && (
            <label className="text-sm text-[#7d4b3a] md:col-span-2">
              Хүргэлтийн хаяг
              <textarea
                rows={2}
                value={formData.deliveryAddress}
                onChange={handleFormChange('deliveryAddress')}
                placeholder="УБ, СБД ..."
                className="mt-2 w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-base text-[#3b231f]"
              />
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="flex-1 rounded-2xl bg-gradient-to-r from-[#b5654f] to-[#e2a07d] px-6 py-3 font-semibold text-white"
          >
            Хадгалах
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl border border-[#efd2bf] bg-white px-6 py-3 font-semibold text-[#b5654f]"
          >
            Шошго хэвлэх
          </button>
        </div>
      </form>
    </div>
  )
}
