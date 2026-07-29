import type { Decimal } from "@/domain/decimal";

export type ProjectRecord = Readonly<{
  id: number;
  name: string;
  cutoffDate: string;
}>;

export type ActivityRecord = Readonly<{
  id: number;
  projectId: number;
  name: string;
  bac: Decimal;
  plannedProgress: Decimal;
  actualProgress: Decimal;
  ac: Decimal;
}>;

export type NewProjectRecord = Readonly<Omit<ProjectRecord, "id">>;

export type NewActivityRecord = Readonly<Omit<ActivityRecord, "id">>;

export interface EvmRepository {
  createProject(project: NewProjectRecord): Promise<ProjectRecord>;
  findProject(id: number): Promise<ProjectRecord | null>;
  listProjects(): Promise<readonly ProjectRecord[]>;
  replaceProject(
    id: number,
    project: NewProjectRecord,
  ): Promise<ProjectRecord | null>;
  deleteProject(id: number): Promise<boolean>;
  createActivity(activity: NewActivityRecord): Promise<ActivityRecord>;
  findActivity(
    projectId: number,
    id: number,
  ): Promise<ActivityRecord | null>;
  listActivities(projectId: number): Promise<readonly ActivityRecord[]>;
  replaceActivity(
    projectId: number,
    id: number,
    activity: NewActivityRecord,
  ): Promise<ActivityRecord | null>;
  deleteActivity(projectId: number, id: number): Promise<boolean>;
}
