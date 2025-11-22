// ============================================
// EMAIL TEMPLATES - REGALO AMOR
// Plantillas HTML profesionales y responsive
// ============================================

const ESTADOS_EMAIL = {
  pagado: {
    subject: '✓ Pago Confirmado - Tu pedido está en camino',
    title: '¡Pago Confirmado!',
    icon: '✓',
    color: '#10b981',
    message: 'Hemos recibido tu pago exitosamente. Ahora comenzaremos a preparar tu pedido con todo el cariño.'
  },
  en_proceso: {
    subject: '🔨 Tu pedido está siendo preparado',
    title: 'En Preparación',
    icon: '🔨',
    color: '#3b82f6',
    message: 'Estamos trabajando en tu pedido. Nuestros artesanos están poniendo todo su amor y dedicación.'
  },
  terminado: {
    subject: '✨ Tu pedido está listo',
    title: '¡Pedido Listo!',
    icon: '✨',
    color: '#8b5cf6',
    message: '¡Tu pedido está terminado y quedó hermoso! Pronto lo enviaremos a tu dirección.'
  },
  enviado: {
    subject: '🚚 Tu pedido va en camino',
    title: '¡En Camino!',
    icon: '🚚',
    color: '#6366f1',
    message: '¡Tu pedido está en camino! Pronto lo recibirás en tu dirección. Mantente atento.'
  },
  entregado: {
    subject: '🎉 ¡Pedido Entregado! Gracias por tu compra',
    title: '¡Entregado!',
    icon: '🎉',
    color: '#059669',
    message: '¡Tu pedido ha sido entregado! Esperamos que lo disfrutes. Gracias por confiar en nosotros.'
  },
  cancelado: {
    subject: '❌ Pedido Cancelado',
    title: 'Pedido Cancelado',
    icon: '✗',
    color: '#ef4444',
    message: 'Lamentamos informarte que tu pedido ha sido cancelado. Si tienes dudas, contáctanos.'
  }
};

function generarEmailHTML(pedido, nuevoEstado) {
  const estadoInfo = ESTADOS_EMAIL[nuevoEstado];
  if (!estadoInfo) return null;

  const carrito = pedido.carrito_json || [];
  const pedidoId = pedido.id.substring(0, 8).toUpperCase();

  // Timeline para el email
  const estados = ['pagado', 'en_proceso', 'terminado', 'enviado', 'entregado'];
  const indexActual = estados.indexOf(nuevoEstado);

  const timelineHTML = nuevoEstado !== 'cancelado' ? estados.map((estado, index) => {
    const isCompleted = index <= indexActual;
    const isCurrent = index === indexActual;
    const info = ESTADOS_EMAIL[estado] || {};
    return `
      <td style="text-align: center; padding: 0 5px;">
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${isCompleted ? info.color : '#e5e7eb'};
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          margin-bottom: 4px;
          ${isCurrent ? 'box-shadow: 0 0 0 4px rgba(0,0,0,0.1);' : ''}
        ">${isCompleted ? '✓' : ''}</div>
        <div style="font-size: 10px; color: ${isCompleted ? '#111827' : '#9ca3af'};">
          ${estado === 'pagado' ? 'Pagado' : ''}
          ${estado === 'en_proceso' ? 'Preparando' : ''}
          ${estado === 'terminado' ? 'Listo' : ''}
          ${estado === 'enviado' ? 'Enviado' : ''}
          ${estado === 'entregado' ? 'Entregado' : ''}
        </div>
      </td>
    `;
  }).join('') : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${estadoInfo.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f8f9fa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px; margin: 0 auto;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1f2937, #111827); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">🎁 Regalo Amor</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Regalos personalizados con amor</p>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="background: white; padding: 30px; text-align: center; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              <div style="
                display: inline-block;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: ${estadoInfo.color};
                color: white;
                font-size: 36px;
                line-height: 80px;
                margin-bottom: 16px;
              ">${estadoInfo.icon}</div>
              <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #111827;">${estadoInfo.title}</h2>
              <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.5;">${estadoInfo.message}</p>
            </td>
          </tr>

          ${nuevoEstado !== 'cancelado' ? `
          <!-- Timeline -->
          <tr>
            <td style="background: #f8f9fa; padding: 24px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>${timelineHTML}</tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Order Info -->
          <tr>
            <td style="background: white; padding: 24px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
                    <span style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Número de Pedido</span>
                    <div style="font-size: 20px; font-weight: 700; color: #111827; font-family: monospace;">#${pedidoId}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Products -->
          <tr>
            <td style="background: white; padding: 0 24px 24px 24px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #111827;">📦 Tu Pedido</h3>
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background: #f8f9fa; border-radius: 8px;">
                ${carrito.map(item => `
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-weight: 500; color: #111827;">${item.nombre}</span>
                    <span style="color: #6b7280; margin-left: 8px;">x${item.cantidad}</span>
                  </td>
                  <td style="padding: 12px 16px; text-align: right; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-weight: 600; color: #111827;">$${(item.precio * item.cantidad).toLocaleString('es-CL')}</span>
                  </td>
                </tr>
                `).join('')}
                <tr>
                  <td style="padding: 16px; font-weight: 700; color: #111827;">Total</td>
                  <td style="padding: 16px; text-align: right; font-weight: 700; font-size: 18px; color: #111827;">$${(pedido.total || 0).toLocaleString('es-CL')}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Info -->
          <tr>
            <td style="background: white; padding: 0 24px 24px 24px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #111827;">📍 Dirección de Entrega</h3>
              <div style="background: #f8f9fa; padding: 16px; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-weight: 500; color: #111827;">${pedido.nombre_cliente}</p>
                <p style="margin: 0 0 4px 0; color: #6b7280;">${pedido.direccion || 'No especificada'}</p>
                ${pedido.comuna ? `<p style="margin: 0 0 4px 0; color: #6b7280;">${pedido.comuna}</p>` : ''}
                <p style="margin: 0; color: #6b7280;">${pedido.telefono || ''}</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background: white; padding: 0 24px 30px 24px; text-align: center; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">¿Tienes alguna pregunta?</p>
              <a href="mailto:contacto@regaloamor.cl" style="
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(135deg, #1f2937, #111827);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
              ">Contáctanos</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 24px; border-radius: 0 0 16px 16px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Regalo Amor. Todos los derechos reservados.</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este email fue enviado a ${pedido.email} porque realizaste una compra.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getEmailSubject(nuevoEstado, pedidoId) {
  const estadoInfo = ESTADOS_EMAIL[nuevoEstado];
  return estadoInfo ? `${estadoInfo.subject} | Pedido #${pedidoId.substring(0, 8).toUpperCase()}` : 'Actualización de tu pedido';
}

export { generarEmailHTML, getEmailSubject, ESTADOS_EMAIL };
