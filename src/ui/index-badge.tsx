import type { IndexResult } from "@/shared/contract";

import { formatIndexDisplay } from "@/ui/format";
import { indexGlyph, indexTone } from "@/ui/index-status";

export interface IndexBadgeProps {
  readonly index: IndexResult;
}

/**
 * Presenta un índice tal como llega: `display` sin reformatear —marcadores
 * `<0,99` y `>1,01` incluidos— y el `label` que resolvió el backend.
 */
export function IndexBadge({ index }: IndexBadgeProps) {
  return (
    <span
      className={`index index--${indexTone(index.status)}`}
      data-status={index.status}
    >
      <span aria-hidden="true" className="index__glyph">
        {indexGlyph(index.status)}
      </span>
      <span className="index__value">{formatIndexDisplay(index.display)}</span>
      <span className="index__label">{index.label}</span>
    </span>
  );
}
