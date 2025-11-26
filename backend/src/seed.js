import { pool, initDb } from './db.js'

const shipments = [
  {
    barcode: 'ol109',
    phone: '88047321',
    customer_name: 'Boogy',
    quantity: 1,
    price: 12000,
    paid_amount: 4000,
    status: 'delivered',
    location: 'courier',
    arrival_date: '2021-05-09',
    notes: '',
  },
  {
    barcode: 'ol110',
    phone: '99974024',
    customer_name: 'Boogy',
    quantity: 1,
    price: 14500,
    paid_amount: 2500,
    status: 'delivered',
    location: 'courier',
    arrival_date: '2021-05-09',
    notes: 'Шуурхай хүргэлт',
  },
  {
    barcode: 'ol111',
    phone: '96424242',
    customer_name: 'Boogy',
    quantity: 1,
    price: 18000,
    paid_amount: 2000,
    status: 'outgoing',
    location: 'courier',
    arrival_date: '2021-05-09',
    notes: '',
  },
  {
    barcode: 'ol113',
    phone: '99019685',
    customer_name: 'Boogy',
    quantity: 1,
    price: 34000,
    paid_amount: 32000,
    status: 'received',
    location: 'warehouse',
    arrival_date: '2021-05-09',
    notes: 'Олголт бэлэн',
  },
  {
    barcode: 'ol115',
    phone: '99567721',
    customer_name: 'Boogy',
    quantity: 2,
    price: 22000,
    paid_amount: 0,
    status: 'received',
    location: 'warehouse',
    arrival_date: '2021-05-09',
    notes: 'Хос хайрцаг',
  },
  {
    barcode: 'ol118',
    phone: '89517710',
    customer_name: 'Boogy',
    quantity: 1,
    price: 14000,
    paid_amount: 8500,
    status: 'outgoing',
    location: 'courier',
    arrival_date: '2021-05-10',
    notes: 'Улаан хайрцаг',
  },
]

async function seed() {
  await initDb()
  console.log('Schema checked')

  await pool.query('DELETE FROM payments')
  await pool.query('DELETE FROM shipments')

  for (const item of shipments) {
    const balance = (item.price || 0) - (item.paid_amount || 0)
    const { rows } = await pool.query(
      `INSERT INTO shipments
       (barcode, phone, customer_name, quantity, weight, price, paid_amount, balance, status, location, arrival_date, notes)
       VALUES ($1,$2,$3,$4,0,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        item.barcode,
        item.phone,
        item.customer_name,
        item.quantity,
        item.price,
        item.paid_amount,
        balance,
        item.status,
        item.location,
        item.arrival_date,
        item.notes,
      ],
    )
    const shipmentId = rows[0].id
    if (item.paid_amount > 0) {
      await pool.query('INSERT INTO payments (shipment_id, amount, method) VALUES ($1,$2,$3)', [
        shipmentId,
        item.paid_amount,
        'cash',
      ])
    }
  }

  console.log('Seed done:', shipments.length, 'shipments')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
