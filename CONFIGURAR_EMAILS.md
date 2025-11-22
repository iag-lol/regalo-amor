# Configurar Envío de Emails

## Descripción

El sistema envía emails automáticos a los clientes cuando cambia el estado de su pedido:

- **Pago Confirmado** - Cuando se confirma el pago
- **En Preparación** - Cuando se inicia la preparación
- **Listo** - Cuando el pedido está terminado
- **Despachado** - Cuando se envía el pedido
- **Entregado** - Cuando se confirma la entrega
- **Cancelado** - Si se cancela el pedido

Los emails tienen un diseño profesional, moderno y responsive.

---

## Variables de Entorno Necesarias

Agrega estas variables en **Render** → Environment Variables:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
```

---

## Configuración con Gmail

### 1. Habilitar Verificación en 2 Pasos
1. Ve a tu cuenta Google → Seguridad
2. Habilita la verificación en 2 pasos

### 2. Crear Contraseña de Aplicación
1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona "Correo" y "Otro (nombre personalizado)"
3. Escribe: "Regalo Amor"
4. Copia la contraseña de 16 caracteres generada

### 3. Configurar en Render
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  ← La contraseña de 16 caracteres
```

---

## Configuración con Otros Proveedores

### Outlook / Hotmail
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@outlook.com
EMAIL_PASS=tu-contraseña
```

### Yahoo
```
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@yahoo.com
EMAIL_PASS=tu-app-password
```

### SendGrid (Profesional)
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=tu-sendgrid-api-key
```

### Mailgun (Profesional)
```
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@tu-dominio.mailgun.org
EMAIL_PASS=tu-mailgun-password
```

---

## Verificar Configuración

1. Haz deploy en Render
2. Ve a un pedido en el panel admin
3. Cambia el estado
4. El sistema intentará enviar el email
5. Revisa los logs de Render para ver si se envió correctamente

**Log exitoso:**
```
✓ Email enviado a cliente@email.com - Estado: pagado
```

**Log de error (si falta configuración):**
```
Error al enviar email: [detalles del error]
```

---

## Diseño del Email

Los emails incluyen:

1. **Header** - Logo y nombre de Regalo Amor
2. **Badge de Estado** - Icono y título del estado
3. **Timeline Visual** - Progreso del pedido
4. **Detalles del Pedido** - Número de pedido, productos, total
5. **Dirección de Entrega** - Datos del cliente
6. **Botón de Contacto** - Para que el cliente pueda comunicarse
7. **Footer** - Copyright y disclaimer

---

## Sin Configuración de Email

Si NO configuras las variables de email:
- El sistema funcionará normalmente
- Los estados se actualizarán correctamente
- Simplemente no se enviarán emails
- El toast mostrará: "Estado actualizado (email no configurado)"

---

## Recomendación

Para producción, recomiendo usar:
- **SendGrid** (100 emails/día gratis)
- **Mailgun** (1000 emails/mes gratis)
- **Amazon SES** (muy económico a escala)

Estos proveedores tienen mejor entregabilidad que Gmail para emails transaccionales.

---

## Resumen de Variables

```
# Mínimo necesario para emails
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password-16-caracteres
```

Después de agregar estas variables en Render y hacer redeploy, los emails se enviarán automáticamente.
