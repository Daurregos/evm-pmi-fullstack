import type { ActivityRead, ProjectAnalysis } from "@/shared/contract";

import { ActivitiesChart } from "@/ui/activities-chart";
import { ActivitiesTable } from "@/ui/activities-table";
import { ProjectSummaryPanel } from "@/ui/project-summary-panel";
import { ProjectVerdict } from "@/ui/project-verdict";

export interface DashboardProps {
  readonly analysis: ProjectAnalysis;
  readonly onCreateActivity?: () => void;
  readonly onEditActivity?: (activity: ActivityRead) => void;
  readonly onDeleteActivity?: (activity: ActivityRead) => void;
  readonly onEditProject?: () => void;
  readonly onDeleteProject?: () => void;
}

/**
 * Composición de la lectura: primero el diagnóstico, después el consolidado, la
 * gráfica y el detalle. Un proyecto sin actividades conserva el diagnóstico y el
 * consolidado en ceros, e informa la ausencia en lugar de una tabla vacía.
 *
 * Las acciones de RF-01 y RF-02 aparecen solo cuando el contenedor entrega sus
 * manejadores, y la de crear vive junto al encabezado: un proyecto vacío también
 * necesita recibir su primera actividad.
 */
export function Dashboard({
  analysis,
  onCreateActivity,
  onDeleteActivity,
  onDeleteProject,
  onEditActivity,
  onEditProject,
}: DashboardProps) {
  const { activities, project, summary } = analysis;
  const withoutActivities = activities.length === 0;

  return (
    <article className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">{project.name}</h1>
        <p className="dashboard__cutoff">
          Fecha de corte <time>{project.cutoffDate}</time>
        </p>

        <div className="dashboard__actions">
          {onEditProject === undefined ? null : (
            <button
              className="button button--ghost"
              data-action="edit-project"
              onClick={onEditProject}
              type="button"
            >
              Editar proyecto
            </button>
          )}
          {onDeleteProject === undefined ? null : (
            <button
              className="button button--ghost"
              data-action="delete-project"
              onClick={onDeleteProject}
              type="button"
            >
              Eliminar proyecto
            </button>
          )}
          {onCreateActivity === undefined ? null : (
            <button
              className="button button--primary"
              data-action="create-activity"
              onClick={onCreateActivity}
              type="button"
            >
              Nueva actividad
            </button>
          )}
        </div>
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
          <ActivitiesTable
            activities={activities}
            onDeleteActivity={onDeleteActivity}
            onEditActivity={onEditActivity}
          />
        </>
      )}
    </article>
  );
}
