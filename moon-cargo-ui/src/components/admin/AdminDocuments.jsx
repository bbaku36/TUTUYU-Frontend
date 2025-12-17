import { useState, useMemo } from 'react'

export default function AdminDocuments({
  filterPhone,
  setFilterPhone,
  filterTracking,
  setFilterTracking,
  documentTotals,
  documentPageRecords,
  documentRecords,
  archivedRecords,
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
  exportToExcel,
  fetchArchivedRecords,
}) {
  const [showArchived, setShowArchived] = useState(false)
  const [archivedData, setArchivedData] = useState([])
  const [loadingArchive, setLoadingArchive] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')
  
  const handleToggleArchive = async () => {
    if (!showArchived && archivedData.length === 0) {
      // First time showing archive - fetch data
      setLoadingArchive(true)
      try {
        const data = await fetchArchivedRecords()
        setArchivedData(data)
      } catch (error) {
        console.error('Failed to load archive:', error)
      } finally {
        setLoadingArchive(false)
      }
    }
    setShowArchived(!showArchived)
  }
  
  const handleExportWithFilter = () => {
    let filtered = displayRecords
    
    if (exportStartDate || exportEndDate) {
      filtered = displayRecords.filter(r => {
        const recordDate = new Date(r.createdAt)
        const start = exportStartDate ? new Date(exportStartDate) : null
        const end = exportEndDate ? new Date(exportEndDate) : null
        
        if (start && recordDate < start) return false
        if (end) {
          const endOfDay = new Date(end)
          endOfDay.setHours(23, 59, 59, 999)
          if (recordDate > endOfDay) return false
        }
        return true
      })
    }
    
    if (filtered.length === 0) {
      alert('Сонгосон хугацаанд бараа алга')
      return
    }
    
    exportToExcel(filtered, showArchived ? 'tutuyu-archive' : 'tutuyu-barimtud')
    setShowExportModal(false)
    setExportStartDate('')
    setExportEndDate('')
  }
  
  const displayRecords = showArchived ? archivedData : documentRecords
  const displayPageRecords = useMemo(() => {
    const start = (documentPage - 1) * documentPageSize
    const end = start + documentPageSize
    return displayRecords.slice(start, end)
  }, [displayRecords, documentPage, documentPageSize])
  
  const displayPageCount = Math.max(1, Math.ceil(displayRecords.length / documentPageSize))

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
            <h3 className="text-2xl font-semibold text-[#3b231f]">
              {showArchived ? 'Архив' : 'Баримтууд'}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-[#6f4a3b]">
            {!showArchived && (
              <>
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
              </>
            )}
            {showArchived && (
              <span className="rounded-full bg-[#f5ede4] px-3 py-1">Архивласан: {archivedData.length}</span>
            )}
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
              title="Excel татах"
            >
              📥 Excel
            </button>
            <button
              type="button"
              onClick={handleToggleArchive}
              disabled={loadingArchive}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                showArchived 
                  ? 'border-[#e2a07d] bg-[#fff7f2] text-[#b5654f]'
                  : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
              } ${loadingArchive ? 'opacity-50 cursor-wait' : ''}`}
            >
              {loadingArchive ? '⏳ Ачаалж байна...' : showArchived ? '📋 Баримт харах' : '📦 Архив харах'}
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
              {displayRecords.length === 0 && (
                <tr>
                  <td colSpan="11" className="px-3 py-3 text-center text-[#9b6b58]">
                    {showArchived ? 'Архивласан бараа алга.' : 'Өгөгдөл алга.'}
                  </td>
                </tr>
              )}
              {displayPageRecords.map((record, index) => {
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

        {displayRecords.length > documentPageSize && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[#6f4a3b]">
            <p>
              Хуудас {documentPage} / {displayPageCount}
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
                disabled={documentPage === displayPageCount}
              >
                Дараах
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Excel Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-[#3b231f] mb-4">📥 Excel татах</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#7d4b3a] mb-1">Эхлэх огноо</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#7d4b3a] mb-1">Дуусах огноо</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full rounded-xl border border-[#efd2bf] bg-white px-3 py-2 text-sm text-[#3b231f]"
                />
              </div>
              
              <p className="text-xs text-[#9b6b58]">
                💡 Огноо сонгохгүй бол бүх бараа татагдана
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="flex-1 rounded-xl border border-[#efd2bf] px-4 py-2 text-sm font-semibold text-[#7d4b3a] hover:bg-[#fdf7f2]"
              >
                Цуцлах
              </button>
              <button
                type="button"
                onClick={handleExportWithFilter}
                className="flex-1 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
              >
                📥 Татах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
