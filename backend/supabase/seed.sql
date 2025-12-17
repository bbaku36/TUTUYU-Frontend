-- Clear existing
TRUNCATE TABLE payments, shipments RESTART IDENTITY CASCADE;

-- Insert Shipments
INSERT INTO shipments (barcode, phone, customer_name, quantity, price, paid_amount, balance, status, location, arrival_date, notes)
VALUES 
('ol109', '88047321', 'Boogy', 1, 12000, 4000, 8000, 'delivered', 'courier', '2021-05-09', ''),
('ol110', '99974024', 'Boogy', 1, 14500, 2500, 12000, 'delivered', 'courier', '2021-05-09', 'Шуурхай хүргэлт'),
('ol111', '96424242', 'Boogy', 1, 18000, 2000, 16000, 'outgoing', 'courier', '2021-05-09', ''),
('ol113', '99019685', 'Boogy', 1, 34000, 32000, 2000, 'received', 'warehouse', '2021-05-09', 'Олголт бэлэн'),
('ol115', '99567721', 'Boogy', 2, 22000, 0, 22000, 'received', 'warehouse', '2021-05-09', 'Хос хайрцаг'),
('ol118', '89517710', 'Boogy', 1, 14000, 8500, 5500, 'outgoing', 'courier', '2021-05-10', 'Улаан хайрцаг');

-- Insert Payments
INSERT INTO payments (shipment_id, amount, method)
SELECT id, 4000, 'cash' FROM shipments WHERE barcode = 'ol109';

INSERT INTO payments (shipment_id, amount, method)
SELECT id, 2500, 'cash' FROM shipments WHERE barcode = 'ol110';

INSERT INTO payments (shipment_id, amount, method)
SELECT id, 2000, 'cash' FROM shipments WHERE barcode = 'ol111';

INSERT INTO payments (shipment_id, amount, method)
SELECT id, 32000, 'cash' FROM shipments WHERE barcode = 'ol113';

INSERT INTO payments (shipment_id, amount, method)
SELECT id, 8500, 'cash' FROM shipments WHERE barcode = 'ol118';
