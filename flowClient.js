import axios from 'axios';
import crypto from 'crypto';

const FLOW_API_KEY = process.env.FLOW_API_KEY || process.env.FLOW_KEY;
const FLOW_API_SECRET = process.env.FLOW_API_SECRET || process.env.FLOW_SECRET;
const FLOW_ENV = (process.env.FLOW_ENV || 'sandbox').toLowerCase();

if (!FLOW_API_KEY || !FLOW_API_SECRET) {
  console.warn('[flowClient] Falta FLOW_API_KEY o FLOW_API_SECRET, las integraciones fallarán.');
}

const BASE_URL = FLOW_ENV === 'production'
  ? 'https://www.flow.cl/api'
  : 'https://sandbox.flow.cl/api';

const buildSignature = (params) => {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHmac('sha256', FLOW_API_SECRET).update(payload).digest('hex');
};

export const createPayment = async ({
  amount,
  commerceOrder,
  subject,
  email,
  urlConfirmation,
  urlReturn,
}) => {
  const params = {
    apiKey: FLOW_API_KEY,
    commerceOrder,
    subject,
    currency: 'CLP',
    amount,
    email,
    urlConfirmation,
    urlReturn,
  };

  const signature = buildSignature(params);
  const body = new URLSearchParams({ ...params, s: signature });

  const { data } = await axios.post(`${BASE_URL}/payment/create`, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });

  if (!data || !data.url) {
    throw new Error('Flow no retornó una URL de pago válida');
  }

  return data;
};
