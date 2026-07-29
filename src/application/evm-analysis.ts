import type {
  ActivityRecord,
  EvmRepository,
  ProjectRecord,
} from "@/application/evm-repository";
import {
  consolidateProject,
  deriveActivity,
  type ActivityInput,
  type IndexResult as DomainIndexResult,
  type ProjectResult,
} from "@/domain/evm";
import type {
  ActivityRead,
  IndexResult,
  ProjectAnalysis,
  ProjectRead,
  ProjectSummary,
} from "@/shared/contract";

function toActivityInput(record: ActivityRecord): ActivityInput {
  return {
    bac: record.bac,
    plannedProgress: record.plannedProgress.div(100),
    actualProgress: record.actualProgress.div(100),
    ac: record.ac,
  };
}

function toNumber(value: { toNumber(): number } | null): number | null {
  return value?.toNumber() ?? null;
}

function toIndexResult(index: DomainIndexResult): IndexResult {
  return {
    value: toNumber(index.value),
    display: index.display,
    status: index.status,
    label: index.label,
  };
}

function toProjectRead(project: ProjectRecord): ProjectRead {
  return {
    id: project.id,
    name: project.name,
    cutoffDate: project.cutoffDate,
  };
}

function toActivityRead(record: ActivityRecord): ActivityRead {
  const derived = deriveActivity(toActivityInput(record));

  return {
    id: record.id,
    name: record.name,
    bac: record.bac.toNumber(),
    plannedProgress: record.plannedProgress.toNumber(),
    actualProgress: record.actualProgress.toNumber(),
    ac: record.ac.toNumber(),
    pv: derived.pv.toNumber(),
    ev: derived.ev.toNumber(),
    cv: derived.cv.toNumber(),
    sv: derived.sv.toNumber(),
    cpi: toIndexResult(derived.cpi),
    spi: toIndexResult(derived.spi),
    eac: toNumber(derived.eac),
    vac: toNumber(derived.vac),
  };
}

function toProjectSummary(result: ProjectResult): ProjectSummary {
  return {
    bac: result.bac.toNumber(),
    pv: result.pv.toNumber(),
    ev: result.ev.toNumber(),
    ac: result.ac.toNumber(),
    cv: result.cv.toNumber(),
    sv: result.sv.toNumber(),
    cpi: toIndexResult(result.cpi),
    spi: toIndexResult(result.spi),
    eac: toNumber(result.eac),
    vac: toNumber(result.vac),
    progress: toNumber(result.progress),
    activitiesWithEvAndZeroAc: result.activitiesWithEvAndZeroAc,
  };
}

export async function getProjectAnalysis(
  repository: EvmRepository,
  projectId: number,
): Promise<ProjectAnalysis | null> {
  const project = await repository.findProject(projectId);
  if (project === null) {
    return null;
  }

  const activities = await repository.listActivities(projectId);
  return {
    project: toProjectRead(project),
    activities: activities.map(toActivityRead),
    summary: toProjectSummary(
      consolidateProject(activities.map(toActivityInput)),
    ),
  };
}

export function getActivityRead(record: ActivityRecord): ActivityRead {
  return toActivityRead(record);
}
