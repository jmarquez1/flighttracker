# Flight Tracker & Notifications SaaS

Plataforma SaaS para el seguimiento de vuelos y notificaciones automáticas para grupos de viaje.

## Estructura del Proyecto

- `apps/web`: Aplicación Next.js 14 con Dashboard administrativo y Portal Público.
- `apps/worker`: Servicio de polling inteligente (Cron) para Railway.
- `packages/shared`: Tipos y lógica compartida.
- `supabase/migrations`: Esquema de base de datos con RLS.

## Configuración

### 1. Supabase
1. Crea un nuevo proyecto en Supabase.
2. Ejecuta las migraciones SQL proporcionadas en el Editor SQL de Supabase.
3. Configura la autenticación (Email/Password).

### 2. Variables de Entorno

Crea archivos `.env` en las carpetas respectivas:

#### `apps/web/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

#### `apps/worker/.env`
```
SUPABASE_URL=tu_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
AVIATIONSTACK_KEY=155da468b0436682c53753add7745580
RESEND_API_KEY=tu_resend_key
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_FROM_NUMBER=tu_twilio_phone
```

### 3. Instalación y Desarrollo
```bash
npm install
npm run dev:web    # Inicia Next.js
npm run dev:worker # Inicia el Worker (polling)
```

## Despliegue en Railway

1. Conecta tu repositorio de GitHub.
2. **Servicio Web**: Crea un servicio para `apps/web`.
3. **Servicio Worker**: Crea un servicio para `apps/worker`. Configura un **Cron Schedule** (ej: `*/10 * * * *`) para ejecutar `npm start`.

## Roles del Sistema

- **SYSTEM_ADMIN**: Puede gestionar todas las organizaciones y usar el Simulador de Eventos.
- **ORG_ADMIN**: Gestiona los viajes, vuelos y contactos de su propia organización (ej: Active Tours).
- **Public**: Los clientes pueden ver su itinerario en `/t/[public_token]` sin iniciar sesión.

## Simulador de Eventos
Accede a `/dashboard/settings` como administrador para inyectar eventos de prueba (retrasos, cancelaciones) y verificar que las notificaciones funcionen correctamente.
