import {
  type ActivityFormValues,
  activityWriteOf,
} from "@/ui/activity-form-state";
import {
  type FetchLike,
  createActivity,
  createProject,
  deleteActivity,
  deleteProject,
  fetchProjectAnalysis,
  fetchProjectList,
  replaceActivity,
  replaceProject,
} from "@/ui/evm-api-client";
import type { MutationPlan, RefreshRead } from "@/ui/mutation-flow";
import {
  type ProjectFormValues,
  projectWriteOf,
} from "@/ui/project-form-state";

/**
 * Un plan por operación publicada. Cada plan declara qué escribe y qué lee
 * después, y esas lecturas son exactamente las que ADR-007 y RF-01 permiten:
 *
 * - Una mutación de actividad relee la foto del proyecto, que llega con la
 *   tabla, el consolidado y la gráfica recalculados por el backend.
 * - Una mutación de proyecto relee la colección, porque el selector cambia, y la
 *   foto del proyecto que quede seleccionado. Sus campos no intervienen en EVM,
 *   así que el recálculo no es el motivo: la coherencia de la vista lo es.
 * - Eliminar el proyecto seleccionado no pide una foto inexistente y deja el
 *   dashboard sin selección, según RF-01.
 *
 * Vive fuera de React para que el flujo se pruebe contra la API simulada.
 */

/** Refresco de una mutación de actividad: una sola lectura. */
function analysisRefresh(
  projectId: number,
  fetchImpl: FetchLike,
): RefreshRead {
  return async () => ({
    analysis: await fetchProjectAnalysis(projectId, fetchImpl),
  });
}

/**
 * Refresco de una mutación de proyecto. Con `selectedProjectId` nulo solo lee la
 * colección y deja la vista sin proyecto analizado.
 */
function collectionRefresh(
  selectedProjectId: () => number | null,
  fetchImpl: FetchLike,
): RefreshRead {
  return async () => {
    const projects = await fetchProjectList(fetchImpl);
    const selected = selectedProjectId();

    if (selected === null) {
      return { analysis: null, projects, selectedProjectId: null };
    }

    return {
      analysis: await fetchProjectAnalysis(selected, fetchImpl),
      projects,
      selectedProjectId: selected,
    };
  };
}

export function createActivityPlan(
  projectId: number,
  values: ActivityFormValues,
  fetchImpl: FetchLike = fetch,
): MutationPlan {
  return {
    refresh: analysisRefresh(projectId, fetchImpl),
    write: async () => {
      await createActivity(projectId, activityWriteOf(values), fetchImpl);
    },
  };
}

export function replaceActivityPlan(
  projectId: number,
  activityId: number,
  values: ActivityFormValues,
  fetchImpl: FetchLike = fetch,
): MutationPlan {
  return {
    refresh: analysisRefresh(projectId, fetchImpl),
    write: async () => {
      await replaceActivity(
        projectId,
        activityId,
        activityWriteOf(values),
        fetchImpl,
      );
    },
  };
}

export function deleteActivityPlan(
  projectId: number,
  activityId: number,
  fetchImpl: FetchLike = fetch,
): MutationPlan {
  return {
    refresh: analysisRefresh(projectId, fetchImpl),
    write: async () => {
      await deleteActivity(projectId, activityId, fetchImpl);
    },
  };
}

/**
 * El cuerpo del `201` se usa solo para saber qué proyecto leer después. La vista
 * proviene de la lectura posterior, nunca de la respuesta de escritura.
 */
export function createProjectPlan(
  values: ProjectFormValues,
  fetchImpl: FetchLike = fetch,
): MutationPlan {
  let createdProjectId: number | null = null;

  return {
    refresh: collectionRefresh(() => createdProjectId, fetchImpl),
    write: async () => {
      const created = await createProject(projectWriteOf(values), fetchImpl);
      createdProjectId = created.id;
    },
  };
}

export function replaceProjectPlan(
  projectId: number,
  values: ProjectFormValues,
  fetchImpl: FetchLike = fetch,
): MutationPlan {
  return {
    refresh: collectionRefresh(() => projectId, fetchImpl),
    write: async () => {
      await replaceProject(projectId, projectWriteOf(values), fetchImpl);
    },
  };
}

export function deleteProjectPlan(
  projectId: number,
  selectedProjectId: number | null,
  fetchImpl: FetchLike = fetch,
): MutationPlan {
  const remaining =
    projectId === selectedProjectId ? null : selectedProjectId;

  return {
    refresh: collectionRefresh(() => remaining, fetchImpl),
    write: async () => {
      await deleteProject(projectId, fetchImpl);
    },
  };
}
