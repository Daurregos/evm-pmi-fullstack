import type { ProjectSummary } from "@/shared/contract";

import {
  formatAmount,
  formatOptionalAmount,
  formatPercentage,
} from "@/ui/format";
import { IndexBadge } from "@/ui/index-badge";

export interface ProjectSummaryPanelProps {
  readonly summary: ProjectSummary;
}

/**
 * RF-07: el consolidado que el backend calculó sumando magnitudes antes de
 * derivar ratios, más el avance del proyecto y el conteo de actividades con EV
 * positivo y AC cero que advierte un posible rezago en el registro de costos.
 */
export function ProjectSummaryPanel({ summary }: ProjectSummaryPanelProps) {
  return (
    <section aria-label="Consolidado del proyecto" className="summary">
      <h2 className="summary__title">Consolidado del proyecto</h2>
      <dl className="summary__grid">
        <div className="summary__entry">
          <dt>BAC</dt>
          <dd data-field="bac">{formatAmount(summary.bac)}</dd>
        </div>
        <div className="summary__entry">
          <dt>PV</dt>
          <dd data-field="pv">{formatAmount(summary.pv)}</dd>
        </div>
        <div className="summary__entry">
          <dt>EV</dt>
          <dd data-field="ev">{formatAmount(summary.ev)}</dd>
        </div>
        <div className="summary__entry">
          <dt>AC</dt>
          <dd data-field="ac">{formatAmount(summary.ac)}</dd>
        </div>
        <div className="summary__entry">
          <dt>CV</dt>
          <dd data-field="cv">{formatAmount(summary.cv)}</dd>
        </div>
        <div className="summary__entry">
          <dt>SV</dt>
          <dd data-field="sv">{formatAmount(summary.sv)}</dd>
        </div>
        <div className="summary__entry">
          <dt>CPI</dt>
          <dd data-field="cpi">
            <IndexBadge index={summary.cpi} />
          </dd>
        </div>
        <div className="summary__entry">
          <dt>SPI</dt>
          <dd data-field="spi">
            <IndexBadge index={summary.spi} />
          </dd>
        </div>
        <div className="summary__entry">
          <dt>EAC</dt>
          <dd data-field="eac">{formatOptionalAmount(summary.eac)}</dd>
        </div>
        <div className="summary__entry">
          <dt>VAC</dt>
          <dd data-field="vac">{formatOptionalAmount(summary.vac)}</dd>
        </div>
        <div className="summary__entry">
          <dt>Avance</dt>
          <dd data-field="progress">{formatPercentage(summary.progress)}</dd>
        </div>
        <div className="summary__entry summary__entry--note">
          <dt>Actividades con EV y AC cero</dt>
          <dd data-field="activitiesWithEvAndZeroAc">
            {summary.activitiesWithEvAndZeroAc}
          </dd>
        </div>
      </dl>
      <p className="summary__caveat">
        El conteo advierte un posible rezago en el registro de costos: esas
        actividades aportan al numerador del CPI consolidado sin aportar al
        denominador. No declara que los datos sean erróneos.
      </p>
    </section>
  );
}
