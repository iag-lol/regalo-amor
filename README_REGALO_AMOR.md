# 🎁 Regalo Amor - Tienda de Regalos Personalizados

Tienda online premium para venta de productos personalizados: tazas, botellas, poleras, gorros, pantuflas, cuadros y mucho más.

## 🚀 Características principales

### Frontend Premium
- ✨ **Diseño moderno y elegante** con paleta blanco/negro difuminado
- 📱 **100% Responsivo** optimizado para móviles, tablets y desktop
- 🎨 **Animaciones suaves** con transiciones premium
- 🛒 **Carrito de compras** interactivo con personalización total
- 🎯 **Experiencia de usuario** tipo Apple/tiendas premium

### Panel Administrativo Completo
- 📊 **Dashboard** con métricas en tiempo real
- 📦 **Gestión de productos** CRUD completo con subida de imágenes
- 🏷️ **Sistema de categorías** dinámico
- 💰 **Control de precios y descuentos**
- 📈 **Stock y alertas** automáticas
- 📋 **Gestión de pedidos** con historial completo
- 💳 **Módulo SII** para control de IVA y ventas mensuales
- ⚙️ **Configuración de envíos** (días, horarios, comunas, costos)

### Integración de Pagos
- 💳 **Flow** integrado para pagos seguros
- 🔔 **Notificaciones** automáticas por WhatsApp
- 📄 **Boletas electrónicas** automáticas

### Base de Datos y Storage
- 🗄️ **Supabase** como backend
- 📸 **Supabase Storage** para imágenes de productos
- 👥 **Sistema de clientes** con puntos de fidelidad
- 🎁 **Personalización** con subida de imágenes

## 📋 Requisitos previos

- Node.js 18 o superior
- Cuenta de Supabase (gratuita)
- Cuenta de Flow para pagos
- Git (opcional)

## 🔧 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd tienda-flow
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y completa con tus credenciales:

```bash
cp .env.example .env
```

Edita el archivo `.env`:

```env
# Supabase
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SUPABASE_BUCKET_IMAGENES=imagenes

# Flow
FLOW_API_KEY=tu_flow_api_key
FLOW_SECRET_KEY=tu_flow_secret_key
FLOW_API_URL=https://sandbox.flow.cl/api

# Server
PORT=3000
BASE_URL=http://localhost:3000

# Admin
ADMIN_PASSWORD=tu_password_admin_segura
```

### 4. Configurar Supabase

#### a) Crear las tablas necesarias

En el SQL Editor de Supabase, ejecuta:

```sql
-- Tabla de productos
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC NOT NULL,
  imagen_url TEXT,
  categoria TEXT,
  stock INTEGER DEFAULT 0,
  descuento NUMERIC DEFAULT 0,
  es_combo BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  imagenes_galeria JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rut TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  direccion TEXT,
  comuna TEXT,
  telefono_wsp TEXT,
  telefono_llamada TEXT,
  telefono_es_mismo BOOLEAN DEFAULT false,
  fidelidad_puntos INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  total NUMERIC NOT NULL,
  estado TEXT DEFAULT 'pendiente_pago',
  fecha TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),
  texto_personalizacion TEXT,
  tipo_diseno TEXT,
  imagen_url TEXT,
  fecha_envio DATE,
  horario_envio TEXT,
  canal TEXT DEFAULT 'web',
  carrito_json JSONB
);

-- Tabla de configuración de envíos
CREATE TABLE config_envios (
  id INTEGER PRIMARY KEY DEFAULT 1,
  dias_abiertos TEXT[] DEFAULT ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  horarios TEXT[] DEFAULT ARRAY['10:00-13:00', '15:00-19:00'],
  costo_base NUMERIC DEFAULT 4990,
  comunas_disponibles TEXT[] DEFAULT ARRAY['Santiago', 'Providencia', 'Las Condes']
);

-- Tabla de métricas diarias
CREATE TABLE metricas_diarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE DEFAULT CURRENT_DATE,
  ingresos NUMERIC DEFAULT 0,
  pedidos_count INTEGER DEFAULT 0
);

-- Tabla de estado SII
CREATE TABLE sii_estado (
  mes TEXT PRIMARY KEY,
  estado TEXT DEFAULT 'pendiente',
  fecha_pago TIMESTAMP
);
```

#### b) Crear bucket de Storage

1. Ve a Storage en Supabase
2. Crea un nuevo bucket llamado `imagenes`
3. Hazlo público para que las imágenes sean accesibles

### 5. Iniciar el servidor

#### Desarrollo local:
```bash
npm run dev
```

#### Producción:
```bash
npm start
```

La tienda estará disponible en `http://localhost:3000`

## 🎨 Panel Administrativo

### Acceso
1. Ve a `http://localhost:3000`
2. Haz clic en "Panel" en el header
3. Ingresa la contraseña configurada en `ADMIN_PASSWORD`

### Funcionalidades

#### 📊 Dashboard
- Pedidos del día en tiempo real
- Alertas de stock bajo (menos de 5 unidades)
- Gráfico de ventas últimos 7 días
- Información del SII (ventas mensuales para IVA)

#### 📦 Gestión de Productos
- **Crear productos**: Nombre, categoría, precio, stock, descuento, descripción, imagen
- **Editar productos**: Modificar cualquier campo
- **Eliminar productos**: Marcar como inactivo
- **Subir imágenes**: Drag & drop con preview
- **Filtros**: Por categoría y búsqueda por texto
- **Categorías dinámicas**: Se crean automáticamente al agregar productos

#### 📋 Pedidos
- Ver todos los pedidos con detalles completos
- Información del cliente
- Productos comprados
- Personalización solicitada
- Imágenes subidas por el cliente
- Estado del pedido

#### ⚙️ Configuración
- **Días de apertura**: Define qué días entregas
- **Horarios**: Define bloques horarios de entrega
- **Costo de envío**: Precio base del delivery
- **Comunas**: Lista de comunas donde entregas

## 🛍️ Uso para clientes

### Comprar productos

1. **Explorar**: Navega por los productos en la página principal
2. **Filtrar**: Usa la búsqueda y filtro por categorías
3. **Agregar**: Haz clic en "Agregar" en los productos deseados
4. **Personalizar**: Clic en "Personalizar" en el header
5. **Completar datos**:
   - Información personal (nombre, RUT, email)
   - Dirección y comuna de entrega
   - Teléfonos de contacto
   - Día y horario de entrega preferido
6. **Personalización**:
   - Mensaje especial (hasta 240 caracteres)
   - Tipo de diseño
   - Subir imagen de referencia
7. **Pagar**: Confirmar y pagar con Flow

### Programa de fidelidad

- Acumula puntos en cada compra
- 1 punto por cada $10.000 gastados
- Puntos se muestran después del pago
- Utilízalos para futuros descuentos

## 🚀 Despliegue en Render

### 1. Crear cuenta en Render
Visita [render.com](https://render.com) y crea una cuenta gratuita

### 2. Nuevo Web Service
- Click en "New +" → "Web Service"
- Conecta tu repositorio de GitHub
- Selecciona tu proyecto

### 3. Configuración
- **Name**: regalo-amor-tienda
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (o el que prefieras)

### 4. Variables de entorno
Agrega todas las variables del archivo `.env` en la sección "Environment"

### 5. Deploy
- Click en "Create Web Service"
- Espera a que se complete el despliegue
- Tu tienda estará en `https://regalo-amor-tienda.onrender.com`

### 6. Actualizar BASE_URL
No olvides actualizar la variable `BASE_URL` con tu URL de Render

## 📱 Características premium

### Diseño
- Paleta blanco premium con negros difuminados
- Tipografías Inter + Playfair Display
- Sombras suaves y elegantes
- Bordes redondeados modernos
- Animaciones y transiciones fluidas

### Responsividad
- **Mobile first**: Optimizado para smartphones
- **Tablet**: Layout adaptativo
- **Desktop**: Experiencia completa
- **Touch friendly**: Botones y áreas de clic grandes

### Performance
- Carga rápida de imágenes
- Lazy loading
- Optimización de assets
- Caché inteligente

## 🔐 Seguridad

- Autenticación admin con token
- Validación de datos en frontend y backend
- Sanitización de inputs
- HTTPS en producción (Render)
- Variables de entorno protegidas
- CORS configurado

## 📞 Soporte

Para dudas o problemas:
1. Revisa este README
2. Verifica las variables de entorno
3. Revisa los logs del servidor
4. Verifica la consola del navegador

## 🎯 Roadmap futuro

- [ ] Notificaciones push
- [ ] Chat en vivo con clientes
- [ ] Sistema de cupones de descuento
- [ ] Múltiples imágenes por producto
- [ ] Reseñas y valoraciones
- [ ] Newsletter
- [ ] Integración con redes sociales
- [ ] Analytics avanzado

## 📄 Licencia

Proyecto privado - Regalo Amor © 2024

---

**¡Tu tienda está lista para vender! 🎉**

Recuerda configurar correctamente Flow y Supabase antes de ir a producción.
