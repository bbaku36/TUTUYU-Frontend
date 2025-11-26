import cors from 'cors'
import express from 'express'
import { pool, initDb } from './db.js'

const app = express()
const port = process.env.PORT || 4000
const isVercel = Boolean(process.env.VERCEL)

app.use(cors())
app.use(
  express.json({
    // Allow content payloads (e.g., base64 images) up to 20MB.
    limit: '20mb',
  }),
)

// Ensure database initialization happens before handling requests (including on Vercel lambdas).
const dbReady = initDb().catch((err) => {
  console.error('DB init failed', err)
  throw err
})
app.use((req, _res, next) => {
  dbReady.then(() => next()).catch(next)
})

const toShipment = (row) =>
  row && {
    ...row,
    quantity: Number(row.quantity) || 0,
    weight: Number(row.weight) || 0,
    price: Number(row.price) || 0,
    paid_amount: Number(row.paid_amount) || 0,
    balance: Number(row.balance) || 0,
  }

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

app.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  }),
)

app.get(
  '/api/shipments',
  asyncHandler(async (req, res) => {
    const {
      phone,
      barcode,
      status,
      location,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20,
    } = req.query

    const conditions = []
    const values = []
    const add = (sql, val) => {
      values.push(val)
      conditions.push(`${sql} $${values.length}`)
    }
    const addDate = (sql, val) => {
      values.push(val)
      conditions.push(`${sql} $${values.length}::date`)
    }

    if (phone) add('phone ILIKE', `%${phone}%`)
    if (barcode) add('barcode ILIKE', `%${barcode}%`)
    if (status) add('status =', status)
    if (location) add('location =', location)
    if (dateFrom) addDate('arrival_date >=', dateFrom)
    if (dateTo) addDate('arrival_date <=', dateTo)
    if (search) {
      const start = values.length
      values.push(`%${search}%`, `%${search}%`, `%${search}%`)
      conditions.push(
        `(phone ILIKE $${start + 1} OR barcode ILIKE $${start + 2} OR COALESCE(notes,'') ILIKE $${start + 3})`,
      )
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const limitNum = Math.max(1, Math.min(Number(limit) || 20, 200))
    const pageNum = Math.max(1, Number(page) || 1)
    const offset = (pageNum - 1) * limitNum

    const total = (
      await pool.query(`SELECT COUNT(*)::int AS count FROM shipments ${where}`, values)
    ).rows[0].count

    const rows = (
      await pool.query(
        `
        SELECT * FROM shipments
        ${where}
        ORDER BY arrival_date DESC NULLS LAST, id DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `,
        [...values, limitNum, offset],
      )
    ).rows

    res.json({ data: rows.map(toShipment), meta: { page: pageNum, limit: limitNum, total } })
  }),
)

app.get(
  '/api/shipments/:id',
  asyncHandler(async (req, res) => {
    const row = (await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id])).rows[0]
    if (!row) return res.status(404).json({ message: 'Бичлэг олдсонгүй' })
    res.json(toShipment(row))
  }),
)

app.post(
  '/api/shipments',
  asyncHandler(async (req, res) => {
  const {
    barcode,
    phone = '',
    customer_name = '',
    quantity = 1,
    weight = 0,
    price = 0,
    paid_amount = 0,
    status = 'received',
    delivery_status = 'delivery',
    location = 'warehouse',
    arrival_date = new Date().toISOString().slice(0, 10),
    notes = '',
    delivery_note = '',
    courier = '',
    delivered_at = null,
  } = req.body || {}

    if (!barcode) return res.status(400).json({ message: 'Бар код заавал' })

    const cleanPrice = Number(price) || 0
    const cleanPaid = Number(paid_amount) || 0
    const cleanQuantity = Number(quantity) || 1
    const cleanWeight = Number(weight) || 0
    const balance = cleanPrice - cleanPaid

    const created = (
      await pool.query(
      `INSERT INTO shipments
         (barcode, phone, customer_name, quantity, weight, price, paid_amount, balance, status, delivery_status, location, arrival_date, notes, delivery_note, courier, delivered_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
        [
          barcode.trim(),
          phone.trim(),
          customer_name.trim(),
          cleanQuantity,
          cleanWeight,
          cleanPrice,
          cleanPaid,
          balance,
          status,
          delivery_status,
          location,
          arrival_date,
          notes,
          delivery_note,
          courier,
          delivered_at,
        ],
      )
    ).rows[0]

    res.status(201).json(toShipment(created))
  }),
)

app.put(
  '/api/shipments/:id',
  asyncHandler(async (req, res) => {
    const existing = (await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id])).rows[0]
    if (!existing) return res.status(404).json({ message: 'Бичлэг олдсонгүй' })

  const merged = {
    ...existing,
    ...req.body,
  }

    merged.quantity = Number(merged.quantity) || 1
    merged.weight = Number(merged.weight) || 0
    merged.price = Number(merged.price) || 0
    merged.paid_amount = Number(merged.paid_amount) || 0
    merged.balance = merged.price - merged.paid_amount

    const updated = (
      await pool.query(
        `UPDATE shipments SET
          barcode = $1, phone = $2, customer_name = $3, quantity = $4, weight = $5,
          price = $6, paid_amount = $7, balance = $8,
          status = $9, delivery_status = $10, location = $11, arrival_date = $12, notes = $13,
          delivery_note = $14, courier = $15,
          updated_at = NOW()
        WHERE id = $16
        RETURNING *`,
        [
          merged.barcode,
          merged.phone,
          merged.customer_name,
          merged.quantity,
          merged.weight,
          merged.price,
          merged.paid_amount,
          merged.balance,
          merged.status,
          merged.delivery_status || merged.deliveryStatus || 'delivery',
          merged.location,
          merged.arrival_date,
          merged.notes,
          merged.delivery_note || null,
          merged.courier || null,
          req.params.id,
        ],
      )
    ).rows[0]

    res.json(toShipment(updated))
  }),
)

app.patch(
  '/api/shipments/:id/status',
  asyncHandler(async (req, res) => {
    const existing = (await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id])).rows[0]
    if (!existing) return res.status(404).json({ message: 'Бичлэг олдсонгүй' })

    const status = req.body.status || existing.status
    const delivery_status = req.body.delivery_status || existing.delivery_status || 'delivery'
    const location = req.body.location || existing.location
    const delivered_at =
      delivery_status === 'delivered'
        ? existing.delivered_at || new Date().toISOString()
        : delivery_status === 'canceled' || delivery_status === 'pending'
          ? null
          : existing.delivered_at

    // Буцаах үед төлсөн дүнг 0 болгож үлдэгдлийг сэргээнэ.
    const paid_amount = status === 'pending' ? 0 : existing.paid_amount || 0
    const balance =
      status === 'pending' ? (existing.price || 0) : (existing.balance != null ? existing.balance : 0)

    const updated = (
      await pool.query(
        `UPDATE shipments
         SET status = $1, delivery_status = $2, location = $3, delivered_at = $4, paid_amount = $5, balance = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [status, delivery_status, location, delivered_at, paid_amount, balance, req.params.id],
      )
    ).rows[0]

    res.json(toShipment(updated))
  }),
)

app.get(
  '/api/shipments/:id/payments',
  asyncHandler(async (req, res) => {
    const payments = (
      await pool.query('SELECT * FROM payments WHERE shipment_id = $1 ORDER BY created_at DESC', [req.params.id])
    ).rows
    res.json(payments)
  }),
)

app.post(
  '/api/shipments/:id/payments',
  asyncHandler(async (req, res) => {
    const shipment = (await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id])).rows[0]
    if (!shipment) return res.status(404).json({ message: 'Бичлэг олдсонгүй' })

    const amount = Number(req.body.amount) || 0
    const method = req.body.method || 'cash'
    if (amount <= 0) return res.status(400).json({ message: 'Төлбөрийн дүн > 0 байх ёстой' })

    await pool.query('INSERT INTO payments (shipment_id, amount, method) VALUES ($1,$2,$3)', [
      req.params.id,
      amount,
      method,
    ])

    const paid = (shipment.paid_amount || 0) + amount
    const balance = (shipment.price || 0) - paid
    const status = balance <= 0 ? 'paid' : shipment.status

    const updated = (
      await pool.query(
        `UPDATE shipments
         SET paid_amount = $1, balance = $2, status = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [paid, balance, status, req.params.id],
      )
    ).rows[0]

    const payments = (
      await pool.query('SELECT * FROM payments WHERE shipment_id = $1 ORDER BY created_at DESC', [req.params.id])
    ).rows

    res.status(201).json({ shipment: toShipment(updated), payments })
  }),
)

app.get(
  '/api/stats/summary',
  asyncHandler(async (_req, res) => {
    const totals = (
      await pool.query('SELECT COUNT(*)::int AS count, COALESCE(SUM(price),0)::int AS price, COALESCE(SUM(balance),0)::int AS balance FROM shipments')
    ).rows[0]

    const byStatusRows = (await pool.query('SELECT status, COUNT(*)::int AS count FROM shipments GROUP BY status')).rows
    const byStatus = byStatusRows.reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {})

    res.json({
      total_shipments: totals.count || 0,
      total_price: Number(totals.price) || 0,
      total_balance: Number(totals.balance) || 0,
      by_status: byStatus,
    })
  }),
)

// Контент (хаяг холбох, үнэ тариф) хадгалах/унших
app.get(
  '/api/content',
  asyncHandler(async (_req, res) => {
    const row = (await pool.query("SELECT payload FROM site_content WHERE key = 'sections'")).rows[0]
    const payload = row?.payload
    const sections = typeof payload === 'string' ? JSON.parse(payload || '[]') : payload || []
    res.json({ sections })
  }),
)

app.put(
  '/api/content',
  asyncHandler(async (req, res) => {
    const sections = Array.isArray(req.body.sections) ? req.body.sections : []
    const payload = JSON.stringify(sections)
    await pool.query(
      `INSERT INTO site_content(key, payload, updated_at)
       VALUES ('sections', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [payload],
    )
    res.json({ sections })
  }),
)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Серверийн алдаа' })
})

const start = async () => {
  await dbReady
  app.listen(port, () => {
    console.log(`Backend up on http://localhost:${port}`)
  })
}

if (!isVercel) {
  start().catch((err) => {
    console.error('Start failed', err)
    process.exit(1)
  })
}

// For Vercel serverless
export default app
