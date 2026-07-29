import type { ProjectAnalysis, ProjectListItem } from "@/shared/contract";

/**
 * Mitad de cliente de ADR-007. Una mutación son dos operaciones separadas: la
 * escritura y el refresco. El backend recalcula, así que el cliente no fusiona
 * ni deriva nada; solo reemplaza la vista con lo que devolvió la lectura.
 *
 * Tres resultados y una asimetría deliberada:
 *
 * - `rejected`: la escritura falló. No se pide ninguna lectura, porque el
 *   estado previo permanece intacto.
 * - `applied`: escritura y refresco correctos. La vista se reemplaza completa.
 * - `stale`: la escritura tuvo éxito y falló la lectura. El cambio permanece
 *   guardado y la vista queda desactualizada.
 *
 * El resultado `stale` conserva únicamente el `refresh` del plan y descarta el
 * `write`, de modo que un reintento no puede repetir la escritura: hacerlo
 * duplicaría la actividad. La garantía es estructural, no un recordatorio.
 */

/** Reemplazo parcial y coherente de la vista. */
export interface DashboardPatch {
  readonly projects?: readonly ProjectListItem[];
  readonly selectedProjectId?: number | null;
  readonly analysis?: ProjectAnalysis | null;
}

export type RefreshRead = () => Promise<DashboardPatch>;

export interface MutationPlan {
  readonly write: () => Promise<void>;
  readonly refresh: RefreshRead;
}

/** Lo único que un reintento necesita: la lectura. */
export interface StaleView {
  readonly refresh: RefreshRead;
}

export type RefreshOutcome =
  | {
      readonly kind: "applied";
      readonly patch: DashboardPatch;
    }
  | {
      readonly kind: "stale";
      readonly failure: unknown;
      readonly refresh: RefreshRead;
    };

export type MutationOutcome =
  | RefreshOutcome
  | {
      readonly kind: "rejected";
      readonly failure: unknown;
    };

async function runRefresh(refresh: RefreshRead): Promise<RefreshOutcome> {
  try {
    return { kind: "applied", patch: await refresh() };
  } catch (failure: unknown) {
    return { failure, kind: "stale", refresh };
  }
}

export async function applyMutation(
  plan: MutationPlan,
): Promise<MutationOutcome> {
  try {
    await plan.write();
  } catch (failure: unknown) {
    return { failure, kind: "rejected" };
  }

  return runRefresh(plan.refresh);
}

/** Reintenta solo la lectura. No hay forma de llegar aquí con una escritura. */
export function retryRefresh(stale: StaleView): Promise<RefreshOutcome> {
  return runRefresh(stale.refresh);
}
