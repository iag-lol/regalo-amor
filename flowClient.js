import axios from 'axios';
import qs from 'qs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const {
  FLOW_API_KEY,
  FLOW_SECRET_KEY,
  FLOW_BASE_URL,
  FLOW_URL_CONFIRMATION,
  FLOW_URL_RETURN
} = process.env; // Coloca tus credenciales reales de Flow en .env (sandbox)

function assertEnv(varValue, varName) {
  if (!varValue) {
    throw new Error(`Falta la variable de entorno ${varName}. Revisa tu archivo .env.`);
  }
}

function signParams(params, secretKey) {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHmac('sha256', secretKey).update(stringToSign, 'utf8').digest('hex');
}

export async function crearPagoFlow({ commerceOrder, subject, amount, email }) {
  assertEnv(FLOW_API_KEY, 'FLOW_API_KEY');
  assertEnv(FLOW_SECRET_KEY, 'FLOW_SECRET_KEY');
  assertEnv(FLOW_BASE_URL, 'FLOW_BASE_URL');
  assertEnv(FLOW_URL_CONFIRMATION, 'FLOW_URL_CONFIRMATION');
  assertEnv(FLOW_URL_RETURN, 'FLOW_URL_RETURN');

  const params = {
    apiKey: FLOW_API_KEY,
    commerceOrder,
    subject,
    currency: 'CLP',
    amount: Number(amount).toFixed(0),
    email,
    paymentMethod: 9,
    urlConfirmation: FLOW_URL_CONFIRMATION,
    urlReturn: FLOW_URL_RETURN
  };

  const signature = signParams(params, FLOW_SECRET_KEY);
  const body = qs.stringify({ ...params, s: signature });

  const endpoint = `${FLOW_BASE_URL.replace(/\/$/, '')}/payment/create`;
  const { data } = await axios.post(endpoint, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  if (!data?.url || !data?.token) {
    throw new Error('Flow no respondió con URL y token válidos.');
  }

  return data;
}
