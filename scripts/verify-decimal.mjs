#!/usr/bin/env node
// Sonda de viabilidad de una sola ejecución, ya satisfecha. Su implementación
// es deliberadamente independiente de src/ y se retirará en el primer slice de fase 1.
/**
 * Verificación de ADR-003 en TypeScript/JavaScript con decimal.js.
 *
 * Comprueba, ANTES de escribir una línea de la aplicación, que la aritmética
 * decimal de JS reproduce exactamente `evm-fixture.json`. Si esto falla, el
 * stack no puede cumplir ADR-003 y hay que revisarlo antes de seguir.
 *
 *   node verify-decimal.mjs [ruta/al/evm-fixture.json]
 *
 * Sale con código 0 si todo pasa, 1 si algo falla.
 */
import Decimal from 'decimal.js';
import { readFileSync } from 'node:fs';

// ADR-003: precisión suficiente para cocientes no terminantes, sin
// cuantización intermedia. El default de decimal.js son 20 dígitos; se sube
// para que la doble división de EAC = BAC / (EV/AC) no acumule error.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

const LOW = new Decimal('0.99');
const HIGH = new Decimal('1.01');

const LABEL = {
  cpi: { favorable: 'eficiente en costos', neutral: 'en presupuesto', unfavorable: 'sobre presupuesto' },
  spi: { favorable: 'adelantado', neutral: 'en cronograma', unfavorable: 'atrasado' },
};

/**
 * Redondeo de presentación: 2 decimales, empates alejándose de cero.
 *
 * OJO: el segundo argumento SOBRESCRIBE la configuración global de
 * `Decimal.set({ rounding })`. Es esta línea —y no la configuración global— la
 * que hace cumplir el empate de ADR-003. Con `precision: 40` ninguna operación
 * del dominio alcanza el límite de precisión, así que el `rounding` global
 * queda inerte.
 *
 * Para comprobar que este test detecta un modo incorrecto hay que cambiar el
 * argumento de AQUÍ, no la línea de `Decimal.set`.
 */
const round2 = (d) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

/** ADR-006b: objeto de índice con valor, presentación, estado e interpretación. */
function indexObject(kind, value) {
  if (value === null) {
    return { value: null, display: null, status: 'not_evaluable', label: 'no evaluable' };
  }
  const r = round2(value);
  let display;
  if (r.eq(LOW) && value.lt(LOW)) display = '<0,99';
  else if (r.eq(HIGH) && value.gt(HIGH)) display = '>1,01';
  else display = r.toFixed(2).replace('.', ',');

  // La clasificación usa el valor SIN redondear (ADR-003).
  const status = value.gte(LOW) && value.lte(HIGH) ? 'neutral'
    : value.gt(HIGH) ? 'favorable' : 'unfavorable';

  return { value: Number(value.toString()), display, status, label: LABEL[kind][status] };
}

/** Núcleo EVM. Recibe magnitudes y deriva; no conoce porcentajes. */
function derive(bac, pv, ev, ac) {
  const cpi = ac.gt(0) ? ev.div(ac) : null;
  const spi = pv.gt(0) ? ev.div(pv) : null;
  const eac = cpi !== null && cpi.gt(0) ? bac.div(cpi) : null;
  const vac = eac !== null ? bac.minus(eac) : null;
  return {
    pv: Number(pv), ev: Number(ev),
    cv: Number(ev.minus(ac)), sv: Number(ev.minus(pv)),
    cpi: indexObject('cpi', cpi), spi: indexObject('spi', spi),
    eac: eac === null ? null : Number(eac.toString()),
    vac: vac === null ? null : Number(vac.toString()),
  };
}

// ---------------------------------------------------------------------------

const path = process.argv[2] ?? './evm-fixture.json';
const fx = JSON.parse(readFileSync(path, 'utf8'));

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  if (!ok) console.log(`  ✗ ${name}\n      esperado: ${JSON.stringify(want)}\n      obtenido: ${JSON.stringify(got)}`);
};

console.log(`decimal.js reproduciendo ${path} (v${fx.version})\n`);

// --- 1. Los ocho indicadores de cada actividad ------------------------------
console.log('1. Indicadores por actividad');
let tB = new Decimal(0), tP = new Decimal(0), tE = new Decimal(0), tA = new Decimal(0);
for (const a of fx.readResponse.activities) {
  const bac = new Decimal(a.bac), ac = new Decimal(a.ac);
  const pv = new Decimal(a.plannedProgress).div(100).times(bac);
  const ev = new Decimal(a.actualProgress).div(100).times(bac);
  const got = derive(bac, pv, ev, ac);
  for (const k of ['pv', 'ev', 'cv', 'sv', 'cpi', 'spi', 'eac', 'vac']) {
    check(`${a.$id}.${k}`, got[k], a[k]);
  }
  tB = tB.plus(bac); tP = tP.plus(pv); tE = tE.plus(ev); tA = tA.plus(ac);
}

// --- 2. Consolidado: sumar magnitudes ANTES de dividir (RF-04) --------------
console.log('2. Consolidado');
const s = fx.readResponse.summary;
const tot = derive(tB, tP, tE, tA);
check('summary.bac', Number(tB), s.bac);
check('summary.ac', Number(tA), s.ac);
for (const k of ['pv', 'ev', 'cv', 'sv', 'cpi', 'spi', 'eac', 'vac']) check(`summary.${k}`, tot[k], s[k]);
check('summary.progress', Number(tE.div(tB).times(100).toString()), s.progress);

// --- 3. Aserciones negativas: lo que NO debe salir --------------------------
console.log('3. Comprobaciones negativas');
const n = fx.negativeChecks;
const defined = fx.readResponse.activities.map(a => a.cpi.value).filter(v => v !== null);
const avg = defined.reduce((acc, v) => acc.plus(v), new Decimal(0)).div(defined.length);
check('promedio de índices ≠ CPI consolidado', Number(round2(avg).toString()), n.cpiAsAverageOfIndices);
check('  y difiere del correcto', tot.cpi.display !== round2(avg).toFixed(2).replace('.', ','), true);
const sumEac = fx.readResponse.activities.filter(a => a.eac !== null)
  .reduce((acc, a) => acc.plus(a.eac), new Decimal(0));
check('suma de EAC ≠ EAC consolidado', Number(sumEac.toString()), n.eacAsSumOfActivityEacs);
check('EAC desde CPI redondeado', Number(round2(tB.div(round2(new Decimal(s.cpi.value)))).toString()), n.eacFromRoundedCpi);

// --- 4. Empates de redondeo (ADR-003) --------------------------------------
console.log('4. Empates: alejándose de cero');
check('1,005 → 1,01', round2(new Decimal('1.005')).toFixed(2), '1.01');
check('-1,005 → -1,01', round2(new Decimal('-1.005')).toFixed(2), '-1.01');
check('0,625 → 0,63', round2(new Decimal('0.625')).toFixed(2), '0.63');
check('0,985 → 0,99', round2(new Decimal('0.985')).toFixed(2), '0.99');

// --- 5. Banda y marcadores (RF-05) -----------------------------------------
console.log('5. Banda inclusiva y marcadores');
for (const c of fx.neutralBandChecks.cases) {
  const bac = new Decimal(c.$input.bac), ac = new Decimal(c.$input.ac);
  const pv = new Decimal(c.$input.plannedProgress).div(100).times(bac);
  const ev = new Decimal(c.$input.actualProgress).div(100).times(bac);
  for (const [kind, want] of Object.entries(c.$expected)) {
    const raw = kind === 'cpi' ? (ac.gt(0) ? ev.div(ac) : null) : (pv.gt(0) ? ev.div(pv) : null);
    check(`${c.$id}.${kind}`, indexObject(kind, raw), want);
  }
}

// --- 6. Frontera IEEE: el viaje de vuelta ----------------------------------
console.log('6. Ida y vuelta por número JSON');
for (const v of [s.cpi.value, s.eac, s.vac, s.progress]) {
  check(`Number → Decimal → Number (${v})`, Number(new Decimal(v).toString()), v);
}

// ---------------------------------------------------------------------------
console.log(`\n${fail === 0 ? '✓ TODO PASA' : '✗ FALLOS'} — ${pass} comprobaciones correctas, ${fail} fallidas`);
process.exit(fail === 0 ? 0 : 1);
