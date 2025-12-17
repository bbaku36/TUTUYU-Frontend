export const deliveryStatusOptions = [
  { id: 'warehouse', label: 'Агуулах' },
  { id: 'delivery', label: 'Хүргэлтэнд' },
  { id: 'delivered', label: 'Хүргэсэн' },
  { id: 'delayed', label: 'Хойшлуулсан' },
  { id: 'canceled', label: 'Цуцалсан' },
]

const statusStyles = {
  pending: 'bg-[#fff0e6] text-[#c16b3e]',
  paid: 'bg-[#e6f5ec] text-[#2f8552]',
  delivered: 'bg-[#e6f7ff] text-[#0b7285]',
  canceled: 'bg-[#ffecec] text-[#c92a2a]',
  delayed: 'bg-[#fff4e6] text-[#d9480f]',
  delivery: 'bg-[#f1f5f9] text-[#334155]',
  warehouse: 'bg-[#f1f5f9] text-[#334155]',
}

export const StatusChip = ({ variant, children }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[variant] || ''}`}>{children}</span>
)

export const formatCurrency = (value) =>
  `${new Intl.NumberFormat('mn-MN', { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)))}₮`

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return dateStr.slice(0, 10)
}
