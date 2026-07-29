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
