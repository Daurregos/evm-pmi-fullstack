import type { ProjectAnalysis, ProjectListItem } from "@/shared/contract";

import {
  type FetchLike,
  fetchProjectAnalysis,
  fetchProjectList,
} from "@/ui/evm-api-client";
import type { DashboardPatch } from "@/ui/mutation-flow";

export interface DashboardSnapshot {
  readonly projects: readonly ProjectListItem[];
  readonly selectedProjectId: number | null;
  readonly analysis: ProjectAnalysis | null;
}

/**
 * Carga inicial: la colección para el selector y la lectura del primer
 * proyecto. Sin proyectos no hay selección ni lectura que pedir.
 *
 * Vive fuera del componente para que la carga se pruebe contra una API
 * simulada sin montar React.
 */
export async function loadDashboard(
  fetchImpl: FetchLike = fetch,
  configuredBaseUrl?: string,
): Promise<DashboardSnapshot> {
  const projects = await fetchProjectList(fetchImpl, configuredBaseUrl);
  const [first] = projects;

  if (first === undefined) {
    return { analysis: null, projects, selectedProjectId: null };
  }

  return {
    analysis: await fetchProjectAnalysis(
      first.id,
      fetchImpl,
      configuredBaseUrl,
    ),
    projects,
    selectedProjectId: first.id,
  };
}

/**
 * Aplica el refresco de una mutación sobre la foto vigente. Es un reemplazo
 * único: ADR-007 exige que tabla, consolidado y gráfica cambien juntos, así que
 * no existe un estado intermedio donde una parte esté nueva y otra vieja.
 */
export function withPatch(
  snapshot: DashboardSnapshot,
  patch: DashboardPatch,
): DashboardSnapshot {
  return {
    analysis: patch.analysis === undefined ? snapshot.analysis : patch.analysis,
    projects: patch.projects ?? snapshot.projects,
    selectedProjectId:
      patch.selectedProjectId === undefined
        ? snapshot.selectedProjectId
        : patch.selectedProjectId,
  };
}
