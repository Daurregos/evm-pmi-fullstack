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

export interface EvmRepository {
  saveProject(project: ProjectRecord): Promise<void>;
  saveActivity(activity: ActivityRecord): Promise<void>;
  findActivity(id: number): Promise<ActivityRecord | null>;
}
