/**
 * Presentación numérica del cliente.
 *
 * ADR-006b transporta los montos y el avance sin redondear y encarga su
 * presentación al frontend. Los índices llegan ya presentados en `display`,
 * marcadores incluidos, y este módulo los deja intactos.
 *
 * El redondeo se delega a `toFixed`, que opera sobre el valor absoluto y
 * resuelve los empates alejándose de cero, la convención del PRD §7.4. El
 * agrupamiento y la coma se aplican sobre la cadena resultante para que la
 * salida no dependa de los datos de locale del entorno.
 */

/** Marca de valor ausente. No es cero: un cero definido se muestra como cero. */
export const ABSENT_VALUE = "—";

const MINUS_SIGN = "−";
const GROUP_SEPARATOR = ".";
const DECIMAL_SEPARATOR = ",";

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+$)/g, GROUP_SEPARATOR);
}

function toSpanishNumber(fixed: string): string {
  const negative = fixed.startsWith("-");
  const magnitude = negative ? fixed.slice(1) : fixed;
  const [whole, fraction] = magnitude.split(".");
  const grouped = groupThousands(whole);
  const presented =
    fraction === undefined
      ? grouped
      : `${grouped}${DECIMAL_SEPARATOR}${fraction}`;

  return negative ? `${MINUS_SIGN}${presented}` : presented;
}

/** Monto con dos decimales, coma decimal y punto de millar. */
export function formatAmount(value: number): string {
  return toSpanishNumber(value.toFixed(2));
}

/** Monto que el dominio puede declarar no evaluable. */
export function formatOptionalAmount(value: number | null): string {
  return value === null ? ABSENT_VALUE : formatAmount(value);
}

/** Porcentaje entero, como pide el PRD §7.4 para el avance. */
export function formatPercentage(value: number | null): string {
  return value === null
    ? ABSENT_VALUE
    : `${toSpanishNumber(value.toFixed(0))} %`;
}

/**
 * `cpi.display` y `spi.display` tal cual. Los marcadores `<0,99` y `>1,01` son
 * lógica de negocio resuelta por el backend (ADR-004) y no se reformatean.
 */
export function formatIndexDisplay(display: string | null): string {
  return display ?? ABSENT_VALUE;
}
