# 🚀 CONFIGURAR VARIABLES DE ENTORNO EN RENDER

## ⚠️ IMPORTANTE: Tu tienda NO funcionará hasta que configures esto

El error **500 Internal Server Error** que ves es porque **Render necesita las variables de entorno**.

---

## 📋 PASO A PASO PARA CONFIGURAR RENDER

### 1️⃣ Accede a tu Dashboard de Render

1. Ve a https://dashboard.render.com
2. Inicia sesión con tu cuenta
3. Click en tu servicio **"regalo-amor"**

---

### 2️⃣ Ir a Environment Variables

1. En el menú lateral, click en **"Environment"**
2. Verás una lista de variables de entorno (probablemente vacía)
3. Click en **"Add Environment Variable"**

---

### 3️⃣ Agregar las variables OBLIGATORIAS

Debes agregar estas variables **UNA POR UNA**:

#### Variable 1: ADMIN_PASSWORD
```
Key: ADMIN_PASSWORD
Value: RegaloAmor2024
```

#### Variable 2: SUPABASE_URL
```
Key: SUPABASE_URL
Value: [Tu URL de Supabase]
```

**¿Dónde obtener tu URL de Supabase?**
1. Ve a https://supabase.com
2. Selecciona tu proyecto
3. Settings → API
4. Copia "Project URL"
5. Se ve así: `https://abcdefgh.supabase.co`

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: [Tu Service Role Key de Supabase]
```

**¿Dónde obtener tu Service Role Key?**
1. En Supabase → Settings → API
2. Copia "service_role" key (secret)
3. Empieza con `eyJhbGc...`
4. ⚠️ **MUY IMPORTANTE: Es la key "service_role", NO la "anon public"**

#### Variable 4: SUPABASE_BUCKET_IMAGENES
```
Key: SUPABASE_BUCKET_IMAGENES
Value: imagenes
```

#### Variable 5: BASE_URL
```
Key: BASE_URL
Value: https://regalo-amor.onrender.com
```

*(Reemplaza con tu URL real de Render)*

---

### 4️⃣ Agregar variables de FLOW (Opcional - para pagos)

Si ya tienes Flow configurado, agrega estas variables:

#### Variable 6: FLOW_API_KEY
```
Key: FLOW_API_KEY
Value: [Tu API Key de Flow]
```

#### Variable 7: FLOW_API_SECRET
```
Key: FLOW_API_SECRET
Value: [Tu Secret Key de Flow]
```

#### Variable 8: FLOW_ENV
```
Key: FLOW_ENV
Value: sandbox
```

*(Cambia a `production` cuando vayas a producción)*

---

### 5️⃣ Guardar y desplegar

1. Después de agregar TODAS las variables, click en **"Save Changes"**
2. Render automáticamente hará un **redeploy**
3. Espera 2-3 minutos a que termine el deploy
4. ✅ ¡Tu tienda funcionará!

---

## ✅ VERIFICAR QUE TODO FUNCIONE

### Opción 1: Endpoint de salud

Abre en tu navegador:
```
https://regalo-amor.onrender.com/api/health
```

Deberías ver:
```json
{
  "ok": true,
  "supabase": "configurado",
  "flow": "configurado" o "no configurado (opcional)",
  "admin": "configurado",
  "message": "Sistema funcionando correctamente"
}
```

### Opción 2: Probar el admin

1. Abre tu tienda: `https://regalo-amor.onrender.com`
2. Click en **"Panel"**
3. Contraseña: `RegaloAmor2024`
4. ✅ Si entras al dashboard = TODO FUNCIONA

---

## 🔴 ERRORES COMUNES

### Error: "Base de datos no configurada"

**Causa**: Falta `SUPABASE_URL` o `SUPABASE_SERVICE_ROLE_KEY`

**Solución**:
- Verifica que agregaste ambas variables
- Verifica que NO dejaste "TU_SUPABASE_URL_AQUI"
- Deben ser valores REALES de tu proyecto Supabase

### Error: "Invalid supabaseUrl"

**Causa**: La URL de Supabase está mal

**Solución**:
- Debe empezar con `https://`
- Debe terminar con `.supabase.co`
- Ejemplo correcto: `https://abcdefgh.supabase.co`

### Error: 401 Unauthorized en admin

**Causa**: `ADMIN_PASSWORD` no está configurada

**Solución**:
- Agrega la variable `ADMIN_PASSWORD=RegaloAmor2024`
- Guarda y espera el redeploy

### Error: "Could not find table 'productos'"

**Causa**: Las tablas NO existen en Supabase

**Solución**:
1. Ve a Supabase → SQL Editor
2. Abre el archivo `setup_database.sql` de tu proyecto
3. Copia TODO el contenido
4. Pega en SQL Editor
5. Click en RUN
6. Verifica que se crearon las tablas

---

## 📊 RESUMEN DE VARIABLES OBLIGATORIAS

```env
# OBLIGATORIAS (la tienda NO funciona sin estas)
ADMIN_PASSWORD=RegaloAmor2024
SUPABASE_URL=https://tuprojecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_BUCKET_IMAGENES=imagenes
BASE_URL=https://regalo-amor.onrender.com

# OPCIONALES (para pagos con Flow)
FLOW_API_KEY=tu_flow_api_key
FLOW_API_SECRET=tu_flow_secret_key
FLOW_ENV=sandbox
```

---

## 🎯 DESPUÉS DE CONFIGURAR

Una vez que agregues las variables:

1. ✅ El error 500 desaparecerá
2. ✅ Podrás entrar al admin
3. ✅ Podrás crear productos
4. ✅ Los clientes podrán ver la tienda
5. ✅ Todo funcionará correctamente

---

## 🆘 ¿SIGUE SIN FUNCIONAR?

1. Verifica en Render → Logs que el deploy terminó correctamente
2. Busca errores en los logs
3. Verifica que TODAS las variables estén agregadas
4. Prueba el endpoint `/api/health` para ver qué falta

---

**¿Necesitas ayuda?** Revisa los logs de Render para más detalles del error.
