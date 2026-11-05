# Anvil Studio Tasks

Gestor de tareas para equipos: proyectos, sprints, tablero Kanban con drag & drop, backlog, comentarios y cambios en tiempo real.

Hecho con Next.js (App Router) y TypeScript, Tailwind CSS y shadcn/ui, Supabase (Postgres, Auth y Realtime) y dnd-kit.

## Ejecutar en local

Necesitas Node.js 22 o superior y un proyecto de Supabase.

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea el archivo de variables y rellénalo con la Project URL y la clave pública de tu proyecto (Project Settings > API):

   ```bash
   cp .env.local.example .env.local
   ```

   Usa solo la clave pública (`sb_publishable_...`). La `service_role` y la secret no hacen falta y nunca deben subirse al repositorio.

3. Aplica las migraciones de `supabase/migrations`:

   ```bash
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase db push
   ```

4. Arranca la app y abre http://localhost:3000:

   ```bash
   npm run dev
   ```

### Supabase en local (opcional)

Con Docker en marcha puedes probar sin tocar tu proyecto real:

```bash
npx supabase start
```

Copia la `API URL` y la `Publishable key` que muestra `npx supabase status` en un archivo `.env.development.local`, con los mismos nombres de variable. Next.js le da prioridad sobre `.env.local` en `npm run dev`. Las cuentas locales no necesitan confirmar el email.

## Desplegar en Vercel

1. Enlaza el proyecto y define las variables de entorno:

   ```bash
   npx vercel link
   npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
   npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
   ```

2. Despliega a producción:

   ```bash
   npx vercel --prod
   ```

3. En Supabase, abre Authentication > URL Configuration y ajusta:
   - **Site URL:** la URL de producción.
   - **Redirect URLs:** `https://TU-DOMINIO/auth/callback`.

`vercel.json` fija la región de las funciones en París (`cdg1`), la misma zona que la base de datos. Si tu proyecto de Supabase está en otra región, cámbiala ahí para reducir la latencia.

## Limitaciones conocidas

- **Las invitaciones no envían un email.** Si la persona ya tiene cuenta, entra en el proyecto al momento. Si no, la invitación queda pendiente y se aplica cuando registra y confirma ese email, así que hay que avisarle aparte. Enviar el correo requeriría la clave `service_role` en el servidor o un proveedor de email.
- **El email integrado de Supabase es solo para pruebas.** Limita mucho los envíos por hora y solo entrega a los miembros de tu organización de Supabase. Para que se registren otras personas, configura un SMTP propio en Authentication > SMTP Settings. No desactives la confirmación de email: es lo que impide reclamar una invitación con un email ajeno.
- **La invitación revela si un email está registrado.** Un administrador de proyecto puede deducirlo por la respuesta (añadido o pendiente).

## Estructura

| Ruta | Contenido |
| --- | --- |
| `supabase/migrations` | Esquema, triggers, políticas RLS y funciones |
| `src/proxy.ts` | Refresco de sesión y protección de rutas (el `middleware` de Next.js 16) |
| `src/lib/supabase` | Clientes de Supabase y tipos de la base de datos |
| `src/app/(auth)` | Login, registro y logout |
| `src/app/(app)/projects` | Listado y creación de proyectos |
| `src/app/(app)/projects/[projectId]` | Tablero, backlog, miembros, detalle de tarea y suscripción Realtime |

## Seguridad

Todas las tablas tienen Row Level Security: un usuario solo ve y modifica datos de los proyectos de los que es miembro, y solo los administradores gestionan el proyecto y sus miembros. Los permisos por columna protegen los campos que mantiene la base de datos, como el número de tarea y el estado del sprint.
