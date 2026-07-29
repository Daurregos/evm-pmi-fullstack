import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/** Marcado estático de un componente presentacional, sin DOM ni efectos. */
export function renderMarkup(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

const entities: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&gt;": ">",
  "&lt;": "<",
  "&quot;": '"',
  "&#x27;": "'",
};

/**
 * Texto que un lector vería: sin etiquetas, con entidades resueltas y espacios
 * colapsados. Permite aseverar cadenas como `<0,99` sin depender del escapado.
 */
export function visibleText(markup: string): string {
  return markup
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;|&gt;|&lt;|&quot;|&#x27;/g, (entity) => entities[entity])
    .replace(/\s+/g, " ")
    .trim();
}

/** Valores de un atributo, en orden de aparición. */
export function attributeValues(markup: string, attribute: string): string[] {
  const pattern = new RegExp(`${attribute}="([^"]*)"`, "g");

  return [...markup.matchAll(pattern)].map(([, value]) => value);
}

/** Ocurrencias de una subcadena en el marcado. */
export function occurrences(markup: string, needle: string): number {
  return markup.split(needle).length - 1;
}

/**
 * Marcado de cada elemento `tag` con `data-field`, indexado por ese nombre.
 * Sirve para el consolidado, cuyos valores no viven en una tabla.
 */
export function fieldsOf(
  markup: string,
  tag = "dd",
): Readonly<Record<string, string>> {
  const pattern = new RegExp(
    `<${tag}[^>]*data-field="([^"]*)"[^>]*>([\\s\\S]*?)</${tag}>`,
    "g",
  );
  const fields: Record<string, string> = {};

  for (const [, field, inner] of markup.matchAll(pattern)) {
    fields[field] = inner;
  }

  return fields;
}

/**
 * Marcado completo del primer elemento `tag` cuyo atributo coincide con el
 * valor, etiqueta de apertura y sus atributos incluidos.
 */
export function elementWith(
  markup: string,
  attribute: string,
  value: string,
  tag = "div",
): string {
  const pattern = new RegExp(
    `<${tag}[^>]*${attribute}="${value}"[^>]*>[\\s\\S]*?</${tag}>`,
  );
  const found = pattern.exec(markup);

  if (found === null) {
    throw new Error(`No <${tag} ${attribute}="${value}"> in: ${markup}`);
  }

  return found[0];
}

export interface TableRow {
  /** Valor de `data-row-id` de la fila. */
  readonly id: string;
  /** Marcado de cada celda, por `data-field`. */
  readonly cells: Readonly<Record<string, string>>;
  /** Nombres de `data-field` en orden de aparición. */
  readonly fields: readonly string[];
}

/** Filas de una tabla, indexadas por `data-row-id` y `data-field`. */
export function tableRows(markup: string): TableRow[] {
  const rowPattern = /<tr[^>]*data-row-id="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/g;
  const cellPattern = /<td[^>]*data-field="([^"]*)"[^>]*>([\s\S]*?)<\/td>/g;

  return [...markup.matchAll(rowPattern)].map(([, id, rowMarkup]) => {
    const cells: Record<string, string> = {};
    const fields: string[] = [];

    for (const [, field, cellMarkup] of rowMarkup.matchAll(cellPattern)) {
      cells[field] = cellMarkup;
      fields.push(field);
    }

    return { cells, fields, id };
  });
}
