## 1. Integrar y cerrar las fronteras de fase 0

- [x] 1.1 Fusionar explícitamente `chore/phase-0-lint-rules-wip` y resolver sus
  conflictos contra el scaffold vigente sin conservar tipos de dominio
  paralelos ni modificar fuentes cerradas.
- [x] 1.2 Ajustar la configuración y las pruebas ESLint al alcance aprobado para
  `domain/`, `ui/`, `application/` y la política Decimal, excluyendo
  `scripts/` y `contracts/`.
- [x] 1.3 Añadir `npm run lint` y `npm run lint:imports` a CI, ejecutar lint,
  imports y typecheck, y demostrar con un import real temporal que lint falla
  antes de restaurar el archivo.
- [x] 1.4 Completar la evidencia y las tareas pendientes del cambio
  `phase-0-project-scaffold`, revisarlo y archivarlo antes de introducir
  fórmulas EVM.

## 2. Trasladar las garantías decimales

- [x] 2.1 Añadir pruebas focalizadas para los empates `1.005`, `-1.005` y
  `0.625`, además de la ida y vuelta Decimal–número JSON–Decimal cubierta por
  la sonda.
- [x] 2.2 Ejecutar las pruebas decimales, confirmar que usan únicamente la
  política de `src/domain/decimal.ts` y retirar
  `scripts/verify-decimal.mjs`.

## 3. Implementar la primitiva y la actividad con TDD

- [x] 3.1 Cargar directamente el fixture y caracterizar la forma estable de
  CPI/SPI, cero definido, no evaluabilidad, ocho indicadores y estado derivado;
  cuando el comportamiento ya exista, registrar el primer GREEN, demostrar
  sensibilidad mediante una mutación temporal RED y restaurar el GREEN.
- [x] 3.2 Implementar los tipos enfocados y
  `deriveFromMagnitudes(bac, pv, ev, ac)` con aritmética Decimal sin
  cuantización intermedia hasta pasar esas pruebas.
- [x] 3.3 Cargar directamente el fixture y caracterizar las ocho actividades,
  verificando que `deriveActivity` calcule solo PV/EV antes de delegar en la
  primitiva; cuando el comportamiento ya exista, registrar el primer GREEN,
  demostrar sensibilidad mediante una mutación temporal RED y restaurar el
  GREEN.

## 4. Completar taxonomía y presentación con TDD

- [x] 4.1 Cubrir contra el fixture los cinco estados de actividad, las cuatro
  combinaciones de evaluabilidad y la no propagación de una actividad no
  evaluable al consolidado.
- [x] 4.2 Cargar directamente los siete casos de `neutralBandChecks` y
  caracterizar clasificación sin redondear, etiquetas españolas y marcadores
  limitados a cruces ocultos; cuando el comportamiento ya exista, registrar el
  primer GREEN, demostrar sensibilidad mediante una mutación temporal RED y
  restaurar el GREEN.

## 5. Implementar la consolidación con TDD

- [x] 5.1 Cargar directamente el fixture y caracterizar el resumen de
  referencia, incluidos avance, conteo de EV positivo con AC cero y proyecto
  vacío; cuando el comportamiento ya exista, registrar el primer GREEN,
  demostrar sensibilidad mediante una mutación temporal RED y restaurar el
  GREEN.
- [x] 5.2 Implementar `consolidateProject` sumando BAC, PV, EV y AC y delegando
  los resultados compartidos a la misma primitiva.
- [x] 5.3 Añadir las tres aserciones negativas explícitas contra
  `negativeChecks` y confirmar que fallan ante las estrategias incorrectas y
  pasan con la implementación vigente.

## 6. Verificar, revisar y cerrar el cambio

- [ ] 6.1 Ejecutar de forma fresca la suite de dominio aislada, lint, imports,
  typecheck, suite completa, build y `git diff --check`, leyendo todas sus
  salidas.
- [ ] 6.2 Contrastar cada requisito de la spec, cada tarea y cada afirmación de
  `Verificación` de ADR-001 contra pruebas o revisión estructural concreta.
- [ ] 6.3 Revisar que los commits contienen solo el cambio, que las fuentes
  cerradas y cambios locales ajenos permanecen intactos, y resolver los
  hallazgos de revisión con nueva verificación.
- [ ] 6.4 Archivar `phase-1-evm-domain`, confirmar el diff histórico y preparar
  un PR dirigido a `develop` sin fusionarlo.
