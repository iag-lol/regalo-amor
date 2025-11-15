import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { crearPagoFlow } from './flowClient.js';

dotenv.config(); // Recuerda poner tus llaves sandbox reales en .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const orders = new Map();
const UNIT_PRICE = 100;
let orderSequence = 1;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/orden', async (req, res) => {
  try {
    const { quantity, email } = req.body ?? {};
    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ ok: false, message: 'La cantidad debe ser un número entero mayor a 0.' });
    }

    if (typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ ok: false, message: 'Debes ingresar un correo válido.' });
    }

    const total = qty * UNIT_PRICE;
    const orderId = `ORD-${orderSequence++}`;
    const order = {
      id: orderId,
      email: email.trim(),
      quantity: qty,
      unitPrice: UNIT_PRICE,
      total,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    orders.set(orderId, order);

    const subject = 'Botella personalizada (demo)';
    const paymentPayload = {
      commerceOrder: orderId,
      subject,
      amount: total,
      email: order.email
    };

    const { url, token } = await crearPagoFlow(paymentPayload);
    const urlPago = `${url}?token=${token}`;

    return res.json({ ok: true, urlPago, orderId });
  } catch (error) {
    console.error('Error al crear la orden o el pago:', error?.response?.data ?? error.message);
    return res.status(500).json({ ok: false, message: 'No pudimos crear la orden. Intenta nuevamente.' });
  }
});

app.post('/api/flow/confirmacion', (req, res) => {
  console.log('Confirmación recibida desde Flow:', req.body);
  // Aquí podrías consumir https://sandbox.flow.cl/api/payment/getStatus para validar el pago realmente
  res.status(200).send('OK');
});

app.get('/api/orden/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ ok: false, message: 'Orden no encontrada.' });
  }
  return res.json({ ok: true, order });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
