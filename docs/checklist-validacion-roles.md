# Checklist de Validacion por Rol

Objetivo: confirmar que RLS y login funcionan segun el perfil de usuario.

## Precondiciones

1. Se ejecuto [supabase/04_security_roles_rls.sql](../supabase/04_security_roles_rls.sql).
2. Se ejecuto [supabase/05_asignacion_roles_usuarios.sql](../supabase/05_asignacion_roles_usuarios.sql).
3. Existen usuarios en Supabase Auth para admin, oficina y tecnico.
4. El tecnico esta vinculado en public.tecnicos.user_id.

## Paso 0 - Verificacion SQL Rapida

Ejecuta este bloque y confirma que no devuelve filas en blanco para email o rol:

```sql
select
  us.user_id,
  au.email,
  us.rol,
  us.nombre_visible,
  t.id as tecnico_id,
  t.nombre as tecnico_nombre
from public.usuarios_sat us
left join auth.users au on au.id = us.user_id
left join public.tecnicos t on t.user_id = us.user_id
order by us.rol, au.email;
```

## Paso 1 - Perfil Oficina

1. Inicia sesion en la app con usuario de oficina.
2. Crea un cliente nuevo.
3. Crea un equipo para ese cliente.
4. Crea una orden con tecnico asignado.
5. Edita la orden y cambia estado a En Proceso.

Resultado esperado:

1. Todas las operaciones deben funcionar sin error de permisos.
2. Los cambios deben verse al recargar la pantalla.

## Paso 2 - Perfil Tecnico

1. Cierra sesion.
2. Inicia sesion con usuario tecnico vinculado.
3. Verifica que solo aparecen ordenes asignadas a ese tecnico.
4. En una orden asignada, cambia estado a Pausado o En Proceso.
5. Finaliza una orden asignada con tareas y tiempo.
6. Intenta crear cliente o equipo.

Resultado esperado:

1. Solo puede ver y operar ordenes propias.
2. Puede actualizar estados permitidos y finalizar ordenes propias.
3. No debe poder crear ni editar catalogos de clientes, equipos o tecnicos.

## Paso 3 - Perfil Admin

1. Cierra sesion.
2. Inicia sesion con usuario admin.
3. Repite operaciones de oficina y verifica acceso total.
4. Opcional: modifica rol de un usuario en public.usuarios_sat y valida efecto.

Resultado esperado:

1. Acceso completo en catalogos y ordenes.
2. Sin bloqueos por RLS en flujos de gestion.

## Paso 4 - Acceso Anonimo

1. Cierra sesion.
2. Intenta operar sin login.

Resultado esperado:

1. La app debe mostrar acceso y no permitir operacion de negocio.
2. No debe existir acceso anonimo a datos protegidos.

## Criterio de Cierre

La validacion se considera cerrada cuando:

1. Oficina y admin operan sin errores de permisos.
2. Tecnico queda limitado a sus ordenes y acciones permitidas.
3. Sin sesion no hay operaciones de negocio.
4. No hay errores inesperados en consola al ejecutar los casos.