import type { ProjectAnalysis } from "@/shared/contract";

import { ActivitiesChart } from "@/ui/activities-chart";
import { ActivitiesTable } from "@/ui/activities-table";
import { ProjectSummaryPanel } from "@/ui/project-summary-panel";
import { ProjectVerdict } from "@/ui/project-verdict";

export interface DashboardProps {
  readonly analysis: ProjectAnalysis;
}

/**
 * Composición de la lectura: primero el diagnóstico, después el consolidado, la
 * gráfica y el detalle. Un proyecto sin actividades conserva el diagnóstico y el
 * consolidado en ceros, e informa la ausencia en lugar de una tabla vacía.
 */
export function Dashboard({ analysis }: DashboardProps) {
  const { activities, project, summary } = analysis;
  const withoutActivities = activities.length === 0;

  return (
    <article className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">{project.name}</h1>
        <p className="dashboard__cutoff">
          Fecha de corte <time>{project.cutoffDate}</time>
        </p>
      </header>

      <ProjectVerdict summary={summary} />
      <ProjectSummaryPanel summary={summary} />

      {withoutActivities ? (
        <p className="dashboard__empty" data-empty-project="true">
          Este proyecto está sin actividades registradas. No hay nada que
          consolidar todavía: los indicadores quedan no evaluables hasta que se
          registre la primera actividad.
        </p>
      ) : (
        <>
          <ActivitiesChart activities={activities} />
          <ActivitiesTable activities={activities} />
        </>
      )}
    </article>
  );
}
