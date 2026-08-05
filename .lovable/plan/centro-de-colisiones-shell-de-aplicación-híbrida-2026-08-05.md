# Centro de Colisiones — Shell de aplicación híbrida

Aplicación de gestión para taller de colisiones con dos entornos simulados (PWA de patio y escritorio de oficina), siguiendo la guía de identidad gráfica adjunta.

## Identidad visual (de la guía)

- Primary Slate `#0F172A` — menús y estructura de escritorio
- Accent Blue `#0284C7` — botones, enlaces, tabs activas
- Insurance Purple `#7C3AED` — ajustes y conciliación con aseguradoras
- Amber `#D97706` (estancado/repuestos), Green `#16A34A` (salida/pagos), Crimson `#B91C1C` (alerta), Muted Grey `#64748B`, Light BG `#F8FAFC`
- Tipografía Helvetica en todo el sistema: títulos 18px bold, cards 14px bold, cuerpo 12px/16px
- Móvil: fondo blanco puro, contraste extremo, áreas táctiles mínimas de 48px
- Escritorio: fondo `#F8FAFC`, densidad alta y diseño scannable

Nota: el usuario pidió "Slate y Deep Purple"; la guía define Slate + Accent Blue con Purple reservado para seguros. Se respeta la guía y el morado se usa como acento secundario destacado.

## Alcance de esta entrega

1. **Login simulado** (pantalla inicial en `/`): selector de Rol (Administrador, Gerente, Asesor) y Sucursal (Quito Norte, Quito Sur, Guayaquil). Sin backend; la sesión vive en estado de cliente + localStorage para preparar el aislamiento de datos por sucursal.
2. **Barra superior de simulación**: alterna entre "Móvil (Asesor de Patio)" y "Escritorio (Administración/Oficina)", muestra rol y sucursal activos y permite cerrar sesión.
3. **Vista Escritorio**: sidebar shadcn colapsable con navegación (Dashboard, Kanban de Flujo, Proformas, Ajustes de Seguro, Repuestos, Facturación, Reportes) y un dashboard con tarjetas de indicadores y tabla densa de casos.
4. **Vista Móvil (PWA)**: layout de ancho móvil centrado, tabs inferiores grandes (Patio, Ingreso, Mis Casos, Perfil), listado de vehículos con tarjetas de estado por color y botones de 48px.
5. **Kanban de estados** con los siete estados y colores/bordes definidos en la guía, incluyendo badge "Estancado" (>15 días).

Los datos son de demostración (mock en el front). No se conecta base de datos en esta etapa.

## Detalles técnicos

- Tokens de color en `src/styles.css` (`@theme inline`, oklch) para slate, accent, purple, amber, green, crimson, muted y light-bg; sin colores hardcodeados en componentes.
- Helvetica cargada como familia del sistema vía token `--font-sans`.
- Rutas: `src/routes/index.tsx` (login/entrada), `src/routes/app.tsx` como layout con la barra de simulación + `src/routes/app.index.tsx` (dashboard/patio según modo). Cada ruta con su propio `head()`.
- Contexto `SimulationProvider` (modo vista, rol, sucursal) en `src/context/simulation.tsx`, persistido en localStorage y leído tras hidratación.
- Componentes shadcn: sidebar, card, badge, table, tabs, select, button, avatar, separator.
- Sin service worker: la "PWA" es una simulación visual de viewport, salvo que se pida instalabilidad real.

## Siguientes pasos sugeridos (no incluidos)

Autenticación con roles en base de datos y aislamiento por sucursal con RLS.
