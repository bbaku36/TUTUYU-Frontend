# Cargo Backend (Express + PostgreSQL / Supabase)

Энэ backend нь PostgreSQL (Supabase) дээр хадгалагдах ачаа, төлбөрийн мэдээллийн API.

## Орчин
1) Supabase дээр Project үүсгээд Database → Connection string хэсгээс `SUPABASE_DB_URL`-ээ ав.
2) `backend/.env` файл үүсгээд:
```
SUPABASE_DB_URL=postgresql://user:password@db.host:5432/dbname
PORT=4000
```
3) Суурилуулах/ажиллуулах:
```bash
cd backend
npm install
npm run seed   # Жишээ өгөгдөл Supabase руу
npm start      # http://localhost:4000
```

## Гол маршрут
- `GET /health` — сервер ажиллаж буй эсэх
- `GET /api/shipments` — жагсаалт, query: `phone`, `barcode`, `status`, `location`, `dateFrom`, `dateTo`, `search`, `page`, `limit`
- `GET /api/shipments/:id` — ганц бичлэг
- `POST /api/shipments` — шинэ ачаа
- `PUT /api/shipments/:id` — бүх талбар шинэчлэх
- `PATCH /api/shipments/:id/status` — статус/байршил солих
- `GET /api/shipments/:id/payments` — төлбөрийн жагсаалт
- `POST /api/shipments/:id/payments` — төлбөр нэмэх (`{ amount, method }`)
- `GET /api/stats/summary` — тоо хэмжээ, үнэ, үлдэгдлийн нийлбэр

## JSON жишээ
### Ачаа бүртгэх
```json
{
  "barcode": "ol200",
  "phone": "99990000",
  "customer_name": "Moogy",
  "quantity": 1,
  "weight": 2.3,
  "price": 18000,
  "paid_amount": 5000,
  "status": "received",
  "location": "warehouse",
  "arrival_date": "2024-04-02",
  "notes": "tsagaan box"
}
```

### Төлбөр нэмэх
`POST /api/shipments/:id/payments`
```json
{ "amount": 3000, "method": "cash" }
```
