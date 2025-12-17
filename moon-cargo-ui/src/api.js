const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const ADMIN_PIN_SECRET = import.meta.env.VITE_ADMIN_PIN_SECRET || import.meta.env.VITE_PIN_SECRET
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// NOTE: Backend хадгалах талбарууд snake_case (price, paid_amount, balance)
// Frontend ашиглах талбарууд camelCase (declared, paidAmount, balance)
// Backend 'price' = Frontend 'declared' гэсэн утгатай
const toUi = (row) => {
  const paidAmount = Number(row.paid_amount) || 0
  const price = Number(row.price) || 0
  const balance = Number(row.balance) || price - paidAmount
  const deliveryStatus = row.delivery_status || (row.location === 'delivery' ? 'delivery' : '')
  const knownStatus = ['paid', 'pending', 'delivered', 'delayed', 'canceled']
  const status = knownStatus.includes(row.status)
    ? row.status
    : balance <= 0
      ? 'paid'
      : 'pending'

  return {
    id: row.id,
    tracking: row.barcode,
    phone: row.phone || '',
    pin: row.pin || row.pin_plain || '',
    customerName: row.customer_name || '',
    quantity: Number(row.quantity) || 1,
    weight: Number(row.weight) || 0,
    declared: price,
    paidAmount,
    balance,
    status,
    deliveryStatus,
    location: row.location ?? (deliveryStatus === 'delivery' ? 'delivery' : ''),
    arrivalDate: row.arrival_date || '',
    deliveryAddress: row.notes || '',
    deliveryNote: row.delivery_note || '',
    createdAt: row.created_at || '',
  }
}

const normalizePhone = (phone) => (phone || '').toString().replace(/\D+/g, '')
const normalizePin = (pin) => (pin || '').toString().replace(/\D+/g, '')

const toApi = (record, { includeDefaults = false } = {}) => ({
  barcode: record.tracking?.trim().toUpperCase(),
  phone: normalizePhone(record.phone),
  customer_name: record.customerName || '',
  quantity: Number(record.quantity) || 1,
  weight: Number(record.weight) || 0,
  price: Number(record.declared) || 0,
  paid_amount: Number(record.paidAmount) || 0,
  status: record.status || 'pending',
  delivery_status:
    record.deliveryStatus !== undefined
      ? record.deliveryStatus || undefined
      : record.location === 'delivery'
        ? 'delivery'
        : undefined,
  location:
    record.location !== undefined
      ? record.location || undefined
      : includeDefaults
        ? 'warehouse'
        : undefined,
  arrival_date:
    record.arrivalDate && record.arrivalDate.trim()
      ? record.arrivalDate
      : includeDefaults
        ? new Date().toISOString().slice(0, 10)
        : undefined,
  notes: record.deliveryAddress || '',
  delivery_note: record.deliveryNote || '',
  pin: normalizePin(record.pin || record.deliveryPin || record.pinCode || ''),
  admin: record.admin === true ? true : undefined,
  adminBypass: record.adminBypass === true ? true : undefined,
})

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  
  if (SUPABASE_ANON_KEY) {
    headers['apikey'] = SUPABASE_ANON_KEY
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`
  }
  
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    let parsed = null
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = null
    }
    const err = new Error(parsed?.message || text || `Request failed ${res.status}`)
    if (parsed?.code) err.code = parsed.code
    if (parsed?.pin) err.pin = parsed.pin
    if (parsed?.pinCreated !== undefined) err.pinCreated = parsed.pinCreated
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

export async function listShipments() {
  const data = await request('/shipments')
  return (data?.data || []).map(toUi)
}

export async function createShipment(record) {
  const payload = toApi(record, { includeDefaults: true })
  const created = await request('/shipments', { method: 'POST', body: JSON.stringify(payload) })
  return toUi(created)
}

export async function updateShipment(id, record) {
  const payload = toApi(record)
  const updated = await request(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  return toUi(updated)
}

export async function setShipmentStatus(id, status, location, deliveryStatus) {
  const updated = await request(`/shipments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      location: location || undefined,
      delivery_status: deliveryStatus || undefined,
    }),
  })
  return toUi(updated)
}

export async function addPayment(id, amount, method = 'cash') {
  const result = await request(`/payments`, {
    method: 'POST',
    body: JSON.stringify({ amount, method, shipment_id: id }),
  })
  return { shipment: result.shipment ? toUi(result.shipment) : null, payments: result.payments || [] }
}

export async function ensurePin(phone) {
  if (!ADMIN_PIN_SECRET) throw new Error('Admin PIN secret is not configured')
  const body = JSON.stringify({ phone: normalizePhone(phone), admin: true })
  return request('/pins/ensure', {
    method: 'POST',
    body,
    headers: { 'x-admin-pin': ADMIN_PIN_SECRET },
  })
}

export async function lookupPin(phone) {
  if (!ADMIN_PIN_SECRET) throw new Error('Admin PIN secret is not configured')
  const body = JSON.stringify({ phone: normalizePhone(phone) })
  try {
    // Эхлээд shipments API-гаас (жагсаалт дээрхтэй адил) PIN-ийг авч үзнэ.
    const resp = await request(`/shipments?phone=${encodeURIComponent(normalizePhone(phone))}&limit=1`)
    const fromList = resp?.data?.[0]?.pin || resp?.data?.[0]?.pin_plain
    if (fromList) return { pin: fromList, phone: normalizePhone(phone), created: false }
  } catch (_) {
    // ignore, fallback доош
  }
  // Fallback: dedicated lookup эсвэл ensurePin.
  try {
    return await request('/pins/lookup', {
      method: 'POST',
      body,
      headers: { 'x-admin-pin': ADMIN_PIN_SECRET },
    })
  } catch (error) {
    try {
      return await ensurePin(phone)
    } catch {
      throw error
    }
  }
}

export async function fetchSections() {
  const res = await request('/content')
  return res.sections || []
}

export async function saveSections(sections) {
  const res = await request('/content', {
    method: 'PUT',
    body: JSON.stringify({ sections }),
  })
  return res.sections || []
}
export async function batchShipmentUpdate(action, ids, updates = {}) {
  const result = await request('/shipments/batch', {
    method: 'POST',
    body: JSON.stringify({ action, ids, updates }),
  })
  return result
}
