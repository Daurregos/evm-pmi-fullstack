import type {
  ActivityRecord,
  EvmRepository,
  ProjectRecord,
} from "@/application/evm-repository";
import { mapActivityRow } from "@/infrastructure/database/map-activity-row";
import { activities, projects } from "@/infrastructure/database/schema";
import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type * as schema from "./schema";

export class DrizzleEvmRepository implements EvmRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async createProject(
    project: Omit<ProjectRecord, "id">,
  ): Promise<ProjectRecord> {
    const [created] = await this.db.insert(projects).values(project).returning();
    if (!created) {
      throw new Error("No se pudo crear el proyecto.");
    }

    return created;
  }

  async findProject(id: number): Promise<ProjectRecord | null> {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    return project ?? null;
  }

  async listProjects(): Promise<readonly ProjectRecord[]> {
    return this.db.select().from(projects).orderBy(projects.id);
  }

  async replaceProject(
    id: number,
    project: Omit<ProjectRecord, "id">,
  ): Promise<ProjectRecord | null> {
    const [replaced] = await this.db
      .update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();

    return replaced ?? null;
  }

  async deleteProject(id: number): Promise<boolean> {
    const [deleted] = await this.db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });

    return deleted !== undefined;
  }

  async createActivity(
    activity: Omit<ActivityRecord, "id">,
  ): Promise<ActivityRecord> {
    const [created] = await this.db
      .insert(activities)
      .values(this.activityValues(activity))
      .returning();
    if (!created) {
      throw new Error("No se pudo crear la actividad.");
    }

    return mapActivityRow(created);
  }

  async findActivity(
    projectId: number,
    id: number,
  ): Promise<ActivityRecord | null> {
    const [row] = await this.db
      .select()
      .from(activities)
      .where(and(eq(activities.projectId, projectId), eq(activities.id, id)))
      .limit(1);

    return row ? mapActivityRow(row) : null;
  }

  async listActivities(
    projectId: number,
  ): Promise<readonly ActivityRecord[]> {
    const rows = await this.db
      .select()
      .from(activities)
      .where(eq(activities.projectId, projectId))
      .orderBy(activities.id);

    return rows.map(mapActivityRow);
  }

  async replaceActivity(
    projectId: number,
    id: number,
    activity: Omit<ActivityRecord, "id">,
  ): Promise<ActivityRecord | null> {
    const [replaced] = await this.db
      .update(activities)
      .set(this.activityValues(activity))
      .where(and(eq(activities.projectId, projectId), eq(activities.id, id)))
      .returning();

    return replaced ? mapActivityRow(replaced) : null;
  }

  async deleteActivity(projectId: number, id: number): Promise<boolean> {
    const [deleted] = await this.db
      .delete(activities)
      .where(and(eq(activities.projectId, projectId), eq(activities.id, id)))
      .returning({ id: activities.id });

    return deleted !== undefined;
  }

  private activityValues(activity: Omit<ActivityRecord, "id">) {
    return {
      projectId: activity.projectId,
      name: activity.name,
      bac: activity.bac.toString(),
      plannedProgress: activity.plannedProgress.toString(),
      actualProgress: activity.actualProgress.toString(),
      ac: activity.ac.toString(),
    };
  }
}
