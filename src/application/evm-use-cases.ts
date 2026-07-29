import { getActivityRead, getProjectAnalysis } from "@/application/evm-analysis";
import type { EvmRepository } from "@/application/evm-repository";
import {
  validateActivityWrite,
  validateProjectWrite,
} from "@/application/evm-validation";
import { Decimal } from "@/domain/decimal";
import type {
  ActivityRead,
  ContractViolation,
  ProjectAnalysis,
  ProjectListItem,
  ProjectRead,
} from "@/shared/contract";

type WriteInput = Readonly<Record<string, unknown>>;

export type UseCaseResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{
      ok: false;
      kind: "validation";
      violations: readonly ContractViolation[];
    }>
  | Readonly<{ ok: false; kind: "not_found" }>;

export class EvmUseCases {
  constructor(private readonly repository: EvmRepository) {}

  async createProject(input: WriteInput): Promise<UseCaseResult<ProjectRead>> {
    const validation = validateProjectWrite(input);
    if (!validation.ok) {
      return {
        ok: false,
        kind: "validation",
        violations: validation.violations,
      };
    }

    const created = await this.repository.createProject(validation.value);
    return {
      ok: true,
      value: {
        id: created.id,
        name: created.name,
        cutoffDate: created.cutoffDate,
      },
    };
  }

  async replaceProject(
    projectId: number,
    input: WriteInput,
  ): Promise<UseCaseResult<ProjectRead>> {
    const validation = validateProjectWrite(input);
    if (!validation.ok) {
      return {
        ok: false,
        kind: "validation",
        violations: validation.violations,
      };
    }

    const replaced = await this.repository.replaceProject(
      projectId,
      validation.value,
    );
    if (replaced === null) {
      return { ok: false, kind: "not_found" };
    }

    return {
      ok: true,
      value: {
        id: replaced.id,
        name: replaced.name,
        cutoffDate: replaced.cutoffDate,
      },
    };
  }

  async deleteProject(projectId: number): Promise<UseCaseResult<void>> {
    if (!(await this.repository.deleteProject(projectId))) {
      return { ok: false, kind: "not_found" };
    }

    return { ok: true, value: undefined };
  }

  async listProjects(): Promise<readonly ProjectListItem[]> {
    const projects = await this.repository.listProjects();
    return projects.map(({ id, name }) => ({ id, name }));
  }

  async createActivity(
    projectId: number,
    input: WriteInput,
  ): Promise<UseCaseResult<ActivityRead>> {
    const validation = validateActivityWrite(input);
    if (!validation.ok) {
      return {
        ok: false,
        kind: "validation",
        violations: validation.violations,
      };
    }

    if ((await this.repository.findProject(projectId)) === null) {
      return { ok: false, kind: "not_found" };
    }

    const created = await this.repository.createActivity({
      projectId,
      name: validation.value.name,
      bac: new Decimal(validation.value.bac),
      plannedProgress: new Decimal(validation.value.plannedProgress),
      actualProgress: new Decimal(validation.value.actualProgress),
      ac: new Decimal(validation.value.ac),
    });
    return { ok: true, value: getActivityRead(created) };
  }

  async replaceActivity(
    projectId: number,
    activityId: number,
    input: WriteInput,
  ): Promise<UseCaseResult<ActivityRead>> {
    const validation = validateActivityWrite(input);
    if (!validation.ok) {
      return {
        ok: false,
        kind: "validation",
        violations: validation.violations,
      };
    }

    const replaced = await this.repository.replaceActivity(projectId, activityId, {
      projectId,
      name: validation.value.name,
      bac: new Decimal(validation.value.bac),
      plannedProgress: new Decimal(validation.value.plannedProgress),
      actualProgress: new Decimal(validation.value.actualProgress),
      ac: new Decimal(validation.value.ac),
    });
    if (replaced === null) {
      return { ok: false, kind: "not_found" };
    }

    return { ok: true, value: getActivityRead(replaced) };
  }

  async deleteActivity(
    projectId: number,
    activityId: number,
  ): Promise<UseCaseResult<void>> {
    if (!(await this.repository.deleteActivity(projectId, activityId))) {
      return { ok: false, kind: "not_found" };
    }

    return { ok: true, value: undefined };
  }

  getProjectAnalysis(projectId: number): Promise<ProjectAnalysis | null> {
    return getProjectAnalysis(this.repository, projectId);
  }
}
