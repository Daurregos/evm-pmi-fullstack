import type { IndexResult, ProjectSummary } from "@/shared/contract";

import { formatIndexDisplay, formatProgress } from "@/ui/format";
import { indexGlyph, indexTone } from "@/ui/index-status";

export interface ProjectVerdictProps {
  readonly summary: ProjectSummary;
}

interface VerdictCardProps {
  readonly card: string;
  readonly index: IndexResult;
  readonly title: string;
}

function VerdictCard({ card, index, title }: VerdictCardProps) {
  return (
    <article
      className={`verdict verdict--${indexTone(index.status)}`}
      data-status={index.status}
      data-verdict={card}
    >
      <h3 className="verdict__title">{title}</h3>
      <p className={`verdict__reading index--${indexTone(index.status)}`}>
        <span aria-hidden="true" className="verdict__glyph">
          {indexGlyph(index.status)}
        </span>
        <span className="verdict__value">
          {formatIndexDisplay(index.display)}
        </span>
      </p>
      <p className="verdict__label">{index.label}</p>
    </article>
  );
}

/**
 * RF-08 a nivel de proyecto: el diagnóstico de costo y cronograma en grande,
 * con el avance al lado, para que el estado se lea sin recorrer la tabla. El
 * texto es el `label` que resolvió el backend.
 */
export function ProjectVerdict({ summary }: ProjectVerdictProps) {
  return (
    <section aria-label="Diagnóstico del proyecto" className="verdicts">
      <VerdictCard card="cost" index={summary.cpi} title="Costo (CPI)" />
      <VerdictCard
        card="schedule"
        index={summary.spi}
        title="Cronograma (SPI)"
      />
      <article className="verdict verdict--progress" data-verdict="progress">
        <h3 className="verdict__title">Avance del proyecto</h3>
        <p className="verdict__reading">
          <span className="verdict__value">
            {formatProgress(summary.progress)}
          </span>
        </p>
        <p className="verdict__label">valor ganado sobre presupuesto total</p>
      </article>
    </section>
  );
}
