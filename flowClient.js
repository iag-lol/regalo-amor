import crypto from 'crypto';

export async function createFlowPayment({
  amount,
  commerceOrder,
  subject,
  email,
  urlConfirmation,
  urlReturn
}) {
  const apiKey = process.env.FLOW_API_KEY;
  // Usar FLOW_SECRET_KEY (nombre de variable en Render)
  const apiSecret = process.env.FLOW_SECRET_KEY || process.env.FLOW_API_SECRET;
  const ambiente = process.env.FLOW_AMBIENTE || process.env.FLOW_ENV || 'sandbox';

  const baseUrl = ambiente === 'production'
    ? 'https://www.flow.cl/api'
    : 'https://sandbox.flow.cl/api';

  const params = {
    apiKey,
    commerceOrder: String(commerceOrder),
    subject,
    currency: 'CLP',
    amount: Math.round(amount),
    email,
    urlConfirmation,
    urlReturn
  };

  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(toSign)
    .digest('hex');

  params.s = signature;

  const queryString = new URLSearchParams(params).toString();

  try {
    const response = await fetch(`${baseUrl}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: queryString
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(data.message || 'Error al crear pago en Flow');
    }

    return {
      url: data.url + '?token=' + data.token,
      token: data.token,
      flowOrder: data.flowOrder
    };
  } catch (error) {
    console.error('Error en Flow:', error);
    throw error;
  }
}
