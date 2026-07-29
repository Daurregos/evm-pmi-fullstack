import type { IndexStatus } from "@/shared/contract";

/**
 * Tratamiento visual de los cuatro `status` de ADR-006b.
 *
 * RF-08 pide que un indicador no evaluable se muestre neutral, así que
 * `neutral` y `not_evaluable` comparten tono y glifo. Son ramas separadas a
 * propósito: el estado sigue siendo distinto y el marcado lo conserva.
 */
export type IndexTone = "unfavorable" | "steady" | "favorable";

export function indexTone(status: IndexStatus): IndexTone {
  switch (status) {
    case "unfavorable":
      return "unfavorable";
    case "neutral":
      return "steady";
    case "not_evaluable":
      return "steady";
    case "favorable":
      return "favorable";
  }
}

/** Glifo que acompaña al tono para no depender solo del color. */
export function indexGlyph(status: IndexStatus): string {
  switch (status) {
    case "unfavorable":
      return "▼";
    case "neutral":
      return "◆";
    case "not_evaluable":
      return "◆";
    case "favorable":
      return "▲";
  }
}
