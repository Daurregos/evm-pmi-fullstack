import type { ProjectAnalysis, ProjectListItem } from "@/shared/contract";

import {
  type FetchLike,
  fetchProjectAnalysis,
  fetchProjectList,
} from "@/ui/evm-api-client";

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
