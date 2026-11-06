-- La asignación vive ahora en issue_assignees. Se aplica después de desplegar
-- la versión de la app que ya no usa esta columna.
alter table public.issues drop column assignee_id;
