# SAT Móvil (React + Tailwind + Supabase)

Esqueleto inicial de una app Web/PWA para gestión de Servicio de Asistencia Técnica.

## Estructura

- `src/components`: componentes visuales reutilizables.
- `src/hooks`: hooks de estado y lógica de negocio.
- `src/services`: acceso a datos (mock o Supabase).
- `src/views`: pantallas/vistas de la aplicación.

## Requisitos

- Node.js 20+

## Puesta en marcha

```bash
npm install
npm run dev
```

## Arranque en PowerShell (si PATH no detecta node/npm)

```powershell
npm run dev:pwsh
```

Para compilar:

```powershell
npm run build:pwsh
```

## Tareas de VS Code

Se incluyó [tasks.json](.vscode/tasks.json) con estas tareas:

- `Dev SAT (pwsh)`: inicia servidor de desarrollo.
- `Build SAT (pwsh)`: compila el proyecto (tarea build por defecto).

Puedes ejecutarlas desde `Terminal > Run Task...`.

## Depuración en VS Code

Se incluyó [launch.json](.vscode/launch.json) con estas configuraciones:

- `Depurar SAT en Chrome`: abre Chrome en `http://localhost:5173` y permite breakpoints en React.
- `Depurar SAT en Edge`: abre Edge en `http://localhost:5173` y permite breakpoints en React.
- `Adjuntar a Chrome (SAT)`: se adjunta a un Chrome ya iniciado con puerto de depuración `9222`.

Flujo recomendado:

1. Ejecutar la tarea `Dev SAT (pwsh)` desde `Terminal > Run Task...`.
2. Ir a `Run and Debug` en VS Code.
3. Elegir `Depurar SAT en Chrome` y comenzar la depuración.

## Variables de entorno

1. Copia `.env.example` a `.env`.
2. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Crear esquema en Supabase

Si el backend devuelve errores tipo `PGRST205` (tabla no encontrada), ejecuta este script en Supabase SQL Editor:

- [supabase/01_schema_sat.sql](supabase/01_schema_sat.sql)

Despues reinicia el servidor de Vite.

## Datos demo y limpieza

Para poblar datos de prueba en tu proyecto Supabase:

- [supabase/02_seed_sat.sql](supabase/02_seed_sat.sql)

Migraciones adicionales disponibles:

- [supabase/03_add_tiempo_empleado_minutos.sql](supabase/03_add_tiempo_empleado_minutos.sql): separa el tiempo empleado en una columna propia y migra datos antiguos.
- [supabase/04_security_roles_rls.sql](supabase/04_security_roles_rls.sql): activa modelo de seguridad por roles (`admin`, `oficina`, `tecnico`) y elimina politicas abiertas de desarrollo.

Para limpiar datos de pruebas/demo creados por este proyecto:

- [supabase/99_cleanup_pruebas.sql](supabase/99_cleanup_pruebas.sql)
- [scripts/cleanup-test-data.ps1](scripts/cleanup-test-data.ps1): limpieza directa por REST usando `.env`

Orden recomendado en SQL Editor:

1. Ejecutar [supabase/01_schema_sat.sql](supabase/01_schema_sat.sql)
2. Ejecutar [supabase/02_seed_sat.sql](supabase/02_seed_sat.sql)
3. Probar la app
4. Ejecutar [supabase/99_cleanup_pruebas.sql](supabase/99_cleanup_pruebas.sql) cuando quieras dejar limpio el entorno

## Seguridad para produccion (RLS real)

Cuando quieras cerrar seguridad en Supabase:

1. Ejecutar [supabase/04_security_roles_rls.sql](supabase/04_security_roles_rls.sql)
2. Crear usuarios en `Auth > Users`.
3. Ejecutar [supabase/05_asignacion_roles_usuarios.sql](supabase/05_asignacion_roles_usuarios.sql) tras editar sus emails y tecnicos.
4. Validar resultado con el bloque de verificacion del propio script.

Ejemplo minimo de asignacion de rol:

```sql
insert into public.usuarios_sat (user_id, rol, nombre_visible)
values ('UUID_DEL_USUARIO_AUTH', 'oficina', 'Operador SAT');
```

Ejemplo minimo de vinculo tecnico:

```sql
update public.tecnicos
set user_id = 'UUID_DEL_USUARIO_AUTH'
where id = 'UUID_DEL_TECNICO';
```

Nota:
Con esta migracion, las politicas `dev_full_*` se eliminan y el acceso anonimo deja de funcionar para operaciones de negocio. Antes de activarla en produccion, asegúrate de tener flujo de login en la app.

Estado actual del frontend:

- Si Supabase esta configurado en `.env`, la app muestra pantalla de acceso y exige login.
- Al iniciar sesion, se habilita la navegacion normal.
- Incluye boton de cierre de sesion en cabecera.

Checklist de validacion recomendada:

- [docs/checklist-validacion-roles.md](docs/checklist-validacion-roles.md)

## Estado actual

- Navbar inferior estilo app móvil.
- Vista Lista de Órdenes con tarjetas por avería.
- Vistas placeholder para Clientes y Parte de Trabajo.
