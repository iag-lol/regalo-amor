# Variables de Entorno para Render

## ✅ Variables que YA tienes correctamente configuradas:

```
ADMIN_PASSWORD=tu_password_admin
FLOW_API_KEY=tu_api_key_de_flow
FLOW_SECRET_KEY=tu_secret_key_de_flow
FLOW_BASE_URL=https://regalo-amor.onrender.com
FLOW_URL_CONFIRMATION=https://regalo-amor.onrender.com/api/flow/confirmacion
FLOW_URL_RETURN=https://regalo-amor.onrender.com/gracias.html
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_BUCKET_IMAGENES=imagenes
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

---

## ⚠️ Variable CRÍTICA que te FALTA:

### SUPABASE_URL
**Obligatoria para que funcione la base de datos**

**Cómo obtenerla:**
1. Ve a https://supabase.com/dashboard
2. Abre tu proyecto
3. Ve a Settings → API
4. Copia el valor de **Project URL**
5. Ejemplo: `https://abcdefghijklmno.supabase.co`

**Agregar en Render:**
```
SUPABASE_URL=https://tu-proyecto.supabase.co
```

---

## 📋 Variables Finales Completas

Después de agregar `SUPABASE_URL`, tus variables en Render deben ser:

```
# Admin
ADMIN_PASSWORD=tu_password_admin

# Supabase (Base de Datos)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_BUCKET_IMAGENES=imagenes

# Flow (Pagos)
FLOW_API_KEY=tu_api_key_de_flow
FLOW_SECRET_KEY=tu_secret_key_de_flow
FLOW_BASE_URL=https://regalo-amor.onrender.com
FLOW_URL_CONFIRMATION=https://regalo-amor.onrender.com/api/flow/confirmacion
FLOW_URL_RETURN=https://regalo-amor.onrender.com/gracias.html
```

---

## 🔧 Pasos Siguientes

1. **Agregar SUPABASE_URL en Render:**
   - Dashboard → Tu servicio → Environment
   - Add Environment Variable
   - Key: `SUPABASE_URL`
   - Value: `https://tu-proyecto.supabase.co`

2. **Redeploy:**
   - Manual Deploy → Deploy latest commit
   - Espera 2-3 minutos

3. **Verificar:**
   - Visita: `https://regalo-amor.onrender.com/api/health`
   - Debe mostrar:
     ```json
     {
       "supabase": "configurado",
       "flow": "configurado",
       "admin": "configurado"
     }
     ```

---

## ✅ Cambios Realizados en el Código

El código ahora está **adaptado para usar tus variables exactas**:

### Antes (no funcionaba):
```javascript
process.env.FLOW_API_SECRET  // ❌ Esta variable no existe en tu Render
process.env.BASE_URL         // ❌ Esta variable no existe en tu Render
```

### Ahora (funciona):
```javascript
process.env.FLOW_SECRET_KEY       // ✅ Esta es la que tienes
process.env.FLOW_URL_CONFIRMATION // ✅ Esta es la que tienes
process.env.FLOW_URL_RETURN       // ✅ Esta es la que tienes
```

---

## 🎯 ¿Qué hace cada variable Flow?

- **FLOW_API_KEY**: Tu usuario de Flow (clave pública)
- **FLOW_SECRET_KEY**: Tu contraseña de Flow (clave secreta)
- **FLOW_BASE_URL**: URL base de tu sitio en Render
- **FLOW_URL_CONFIRMATION**: URL donde Flow confirma el pago (webhook)
- **FLOW_URL_RETURN**: URL donde redirige al cliente después del pago

---

## ⚡ Resumen

**Solo te falta agregar 1 variable:** `SUPABASE_URL`

Después de agregarla y hacer redeploy, **Flow funcionará perfectamente** con las credenciales que ya tienes configuradas. 🚀
