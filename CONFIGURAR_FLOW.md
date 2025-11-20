# Configurar Flow en Render

## ⚠️ Por qué no pasa por Flow

Actualmente la tienda **NO** está usando Flow para pagos porque las variables de entorno no están configuradas en Render.

Cuando un cliente hace un pedido:
- ❌ No redirige a Flow
- ✅ Va directo a "Pedido recibido - Pago pendiente"
- ✅ Guarda el pedido en la base de datos
- ✅ Muestra mensaje: "Te contactaremos para coordinar el pago"

---

## 🔧 Cómo activar Flow (OPCIONAL)

Si quieres que los clientes paguen automáticamente con tarjeta/Webpay a través de Flow:

### 1. Obtén tus credenciales de Flow

1. Crea una cuenta en https://www.flow.cl
2. Ve a **Configuración → API**
3. Copia:
   - **API Key** (apiKey)
   - **Secret Key** (secretKey)

### 2. Configura las variables en Render

1. Ve a https://dashboard.render.com
2. Abre tu servicio **regalo-amor**
3. Ve a **Environment**
4. Agrega estas 3 variables:

```
FLOW_API_KEY=tu_api_key_de_flow_aqui
FLOW_API_SECRET=tu_secret_key_de_flow_aqui
FLOW_ENV=sandbox
```

**Importante:**
- Para pruebas: `FLOW_ENV=sandbox`
- Para producción: `FLOW_ENV=production`

### 3. Redeploy

1. En Render, click en **Manual Deploy → Deploy latest commit**
2. Espera 2-3 minutos

### 4. ✅ Verifica que funciona

1. Ve a tu tienda
2. Agrega un producto al carrito
3. Completa el formulario de compra
4. Click en "Confirmar y pagar"
5. **Ahora debería redirigir a Flow** en lugar de mostrar "Pago pendiente"

---

## 📊 Cómo saber si Flow está configurado

Visita: `https://regalo-amor.onrender.com/api/health`

**Verás:**
```json
{
  "flow": "configurado"  ← Debe decir esto
}
```

Si dice `"no configurado (opcional)"` → Flow NO está activo

---

## 🎯 ¿Necesito Flow obligatoriamente?

**NO**. La tienda funciona perfectamente sin Flow:

**Sin Flow (estado actual):**
- ✅ Los pedidos se guardan en la base de datos
- ✅ Recibes los datos del cliente
- ✅ Mensaje: "Te contactaremos para el pago"
- 💰 Coordinas el pago manualmente (transferencia, efectivo, etc.)

**Con Flow:**
- ✅ Todo lo anterior +
- 💳 El cliente paga con tarjeta inmediatamente
- ✅ Pago automático confirmado
- ✅ Menos trabajo manual para ti

---

## 🔐 Seguridad

- ✅ Las credenciales de Flow se guardan en Render (seguro)
- ✅ Nunca se muestran en el código
- ✅ No se exponen en el navegador del cliente

---

## 💡 Recomendación

**Para empezar:** Deja Flow desactivado y coordina pagos manualmente

**Cuando tengas más ventas:** Activa Flow para automatizar los cobros

---

## 🆘 Problemas comunes

### "Flow da error al pagar"
- Verifica que las credenciales sean correctas
- Asegúrate de usar `FLOW_ENV=sandbox` para pruebas
- Revisa los logs en Render

### "Sigue sin pasar por Flow"
- Verifica en `/api/health` que diga "configurado"
- Redeploy después de agregar las variables
- Las variables NO deben contener "TU_FLOW"
