# Invoice Review – Rediseño

## Qué cambió
- Nuevo layout mobile-first: tarjetas apiladas en móvil y grilla 7/5 en desktop con fondos degradados y blur.
- Header con jerarquía clara, barras de progreso y chips de estado para cola, smart match y panel activo.
- Inputs premium (bordes suaves, sombras internas) y selector de categoría con íconos, gradientes y descripciones.
- Items con tarjetas elevadas, badges de vinculación/precio y controles alineados para cantidades y precios.
- Totales en panel glassmorphism con gradiente y tipografía marcada.
- Panel de vista previa enmarcado, controles flotantes de zoom y resumen rápido (proveedor/total).
- Animaciones suaves en hover/press (-translate, sombras, transiciones de 300–500ms).

## Cómo usarla
- Navega con los botones de volver, saltar y guardar en el header; la barra indica avance en la cola.
- Selecciona categoría tocando cualquier tarjeta; cambia color y borde de foco.
- Agrega/elimina ítems con el CTA “Agregar Item” y el ícono de papelera en cada fila.
- Vincula inventario desde el selector dentro de cada item; el badge cambia a “Inventario vinculado”.
- Ajusta subtotal/impuestos manualmente; si difiere del cálculo, aparece aviso de ajuste.
- En la vista previa usa los botones flotantes o la rueda/pinch para zoom; arrastra cuando hay zoom > 1.

## Responsivo
- Móvil: tarjetas apiladas, controles con padding cómodo; botones a pantalla completa donde aplica.
- Desktop: grilla 7/5, panel de imagen alto con summary superior; formularios mantienen columnas dobles.
- Controles de zoom siempre visibles (top-right) y CTA principales en header.

## Qué verificar
- Mobile viewport: scroll suave, botones accesibles, selector de categoría legible y arrastre/zoom táctil.
- Desktop viewport: grilla dividida, alturas estables, scroll interno del formulario sin cortar header.
- Interacciones: agregar/eliminar items, cambiar categoría, vincular orden de compra, zoom/pan y reset.
- Datos: totales actualizan al cambiar cantidades/precios; badge de ajuste aparece al editar subtotal manual.

## Pasos de prueba rápidos
1) Selecciona categoría y confirma cambio visual.  
2) Añade un item, cambia cantidad/precio y verifica subtotal/total.  
3) Vincula un item a inventario y revisa badge verde.  
4) Ajusta subtotal manual para ver aviso “Ajustado”.  
5) Usa zoom + arrastre en la vista previa en desktop y móvil (DevTools).  
6) Guarda o salta para confirmar acciones siguen funcionando.
