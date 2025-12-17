# Estructura de plugins

Este repo organiza los plugins por idioma para que sea fácil mantenerlos y generar el índice.

## Layout

- `plugins/<idioma>/*.ts`: plugins escritos a mano.
- `plugins/multisrc/`: generadores/templates para familias de sitios.
- `plugins/multi/`: plugins que no son de un idioma específico (ej: Komga).
- `plugins/index.ts`: archivo generado automáticamente (no editar a mano).

## Reglas rápidas

- Cada nuevo plugin debe ir en su carpeta de idioma: `plugins/english/`, `plugins/spanish/`, etc.
- Evita poner plugins sueltos en `plugins/` (raíz).
- Si dudas del idioma, usa `multi/` solo cuando realmente aplique.

## Validación

Puedes validar el layout con:

- `npm run validate:plugins`
