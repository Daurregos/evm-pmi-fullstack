import type {
  ActivityRecord,
  EvmRepository,
  ProjectRecord,
} from "@/application/evm-repository";
import { mapActivityRow } from "@/infrastructure/database/map-activity-row";
import { activities, projects } from "@/infrastructure/database/schema";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type * as schema from "./schema";

export class DrizzleEvmRepository implements EvmRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async saveProject(project: ProjectRecord): Promise<void> {
    await this.db
      .insert(projects)
      .values(project)
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          name: project.name,
          cutoffDate: project.cutoffDate,
        },
      });
  }

  async saveActivity(activity: ActivityRecord): Promise<void> {
    await this.db
      .insert(activities)
      .values({
        id: activity.id,
        projectId: activity.projectId,
        name: activity.name,
        bac: activity.bac.toString(),
        plannedProgress: activity.plannedProgress.toString(),
        actualProgress: activity.actualProgress.toString(),
        ac: activity.ac.toString(),
      })
      .onConflictDoUpdate({
        target: activities.id,
        set: {
          projectId: activity.projectId,
          name: activity.name,
          bac: activity.bac.toString(),
          plannedProgress: activity.plannedProgress.toString(),
          actualProgress: activity.actualProgress.toString(),
          ac: activity.ac.toString(),
        },
      });
  }

  async findActivity(id: number): Promise<ActivityRecord | null> {
    const [row] = await this.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    return row ? mapActivityRow(row) : null;
  }
}
